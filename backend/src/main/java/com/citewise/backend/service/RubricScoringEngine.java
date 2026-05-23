package com.citewise.backend.service;

import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import com.citewise.backend.dto.RawAIResponse;
import com.citewise.backend.entity.DocumentInsight;
import com.citewise.backend.entity.EvidenceExcerpt;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.stream.Collectors;

@Component
public class RubricScoringEngine {
    private static final Logger logger = LoggerFactory.getLogger(RubricScoringEngine.class);
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Parse raw n8n / AI JSON into a DocumentInsight entity.
     */
    public DocumentInsight parseAIResponse(String rawJsonResponse, Long documentId) {
        try {
            if (rawJsonResponse == null || rawJsonResponse.isBlank()) {
                return null;
            }

            JsonNode root = unwrapPayload(objectMapper.readTree(rawJsonResponse));
            // Read and normalize component scores (clamped 0-100)
            double gapAlignment = clampScore(normalizeScore(readScore(root, "gapAlignment", "gapAlignmentScore", "gap_alignment_score")));
            double methodology = clampScore(normalizeScore(readScore(root, "methodology", "methodologyScore", "methodology_score")));
            double theoretical = clampScore(normalizeScore(readScore(root, "theory", "theoreticalScore", "theoretical_score", "theoryScore")));
            double citation = clampScore(normalizeScore(readScore(root, "citationQuality", "citationScore", "citation_quality", "citation_score")));

            DocumentInsight insight = new DocumentInsight();
            insight.setDocumentId(documentId);

            insight.setGapAlignmentScore(gapAlignment);
            insight.setMethodologyScore(methodology);
            insight.setTheoreticalScore(theoretical);
            insight.setCitationScore(citation);

            // parse evidence excerpts
            List<EvidenceExcerpt> excerpts = parseEvidenceExcerpts(root, insight);
            insight.setEvidenceExcerpts(excerpts);

            // store raw JSON and timestamp
            insight.setRawAiResponseJson(rawJsonResponse);
            insight.setGeneratedAt(LocalDateTime.now());

            // flags arrays
            List<String> mismatchFlags = parseStringArray(root, "mismatchFlags", "mismatch_flags");
            List<String> weaknessFlags = parseStringArray(root, "weaknessFlags", "weakness_flags");
            List<String> validationFlags = parseStringArray(root, "validationFlags", "validation_flags");
            insight.setMismatchFlagsJson(toJsonSafe(mismatchFlags));
            insight.setWeaknessFlagsJson(toJsonSafe(weaknessFlags));
            insight.setValidationFlagsJson(toJsonSafe(validationFlags));

            // provisional weights and computation
            // TODO: Replace these provisional weights with official rubric when provided
            double overall = calculateOverallScore(gapAlignment, methodology, theoretical, citation);
            insight.setOverallScore(overall);
            insight.setAverageOverallScore((gapAlignment + methodology + theoretical + citation) / 4.0);

            // Read confidence from response if present (supports nested containers)
            String confidence = readText(root, "confidenceLevel", "confidence_level", "confidence");
            if (confidence == null) confidence = "Low"; // safe default
            insight.setConfidenceLevel(confidence);

            // Prefer n8n-provided relevance if present, otherwise compute deterministically
            String responseRelevance = readText(root, "relevanceLevel", "relevance_level", "relevance");
            String relevanceLevel = responseRelevance != null ? responseRelevance : applyThresholdRules(overall, gapAlignment, confidence, mismatchFlags, excerpts);
            insight.setRelevanceLevel(relevanceLevel);

            // Prefer n8n-provided recommendation if present, otherwise recompute
            String responseRecommendation = readText(root, "recommendationStatus", "recommendation_status", "recommendation", "status");
            if (responseRecommendation != null) {
                insight.setRecommendationStatus(responseRecommendation);
            } else {
                String recomputedRecommendation = computeRecommendation(overall, gapAlignment, confidence, mismatchFlags);
                insight.setRecommendationStatus(recomputedRecommendation);
            }

            if (!hasUsableContent(insight)) {
                logger.warn(
                    "n8n JSON parsed but has no scores/excerpts (often Code node could not read AI Agent output). Raw: {}",
                    rawJsonResponse.length() > 500 ? rawJsonResponse.substring(0, 500) + "..." : rawJsonResponse
                );
                return null;
            }

            return insight;
        } catch (JsonProcessingException jpe) {
            logger.error("Failed to parse AI JSON response", jpe);
            throw new RuntimeException("Invalid AI response JSON", jpe);
        } catch (Exception e) {
            logger.error("Unexpected error while parsing AI response", e);
            throw new RuntimeException("Failed to parse AI response", e);
        }
    }

    // Provisional weights - TODO: replace with teacher-provided rubric
    private static final double WEIGHT_GAP = 0.40;
    private static final double WEIGHT_METHOD = 0.25;
    private static final double WEIGHT_THEORY = 0.20;
    private static final double WEIGHT_CITATION = 0.15;

    public String validateAIResponse(JsonNode root) {
        // simple validation example - could be expanded
        if (root == null) return "empty";
        return "ok";
    }

    public double calculateOverallScore(double gap, double method, double theory, double citation) {
        return (gap * WEIGHT_GAP) + (method * WEIGHT_METHOD) + (theory * WEIGHT_THEORY) + (citation * WEIGHT_CITATION);
    }

    private double clampScore(double v) {
        if (Double.isNaN(v) || v < 0) return 0.0;
        if (v > 100) return 100.0;
        return v;
    }

    public String applyThresholdRules(double overall, double gapAlignment, String confidenceLevel, List<String> mismatchFlags, List<EvidenceExcerpt> excerpts) {
        // Low Relevance if overall < 60
        if (overall < 60) return "Low";
        // Low Relevance if gapAlignment <= 40
        if (gapAlignment <= 40) return "Low";
        // Low Relevance if there is no verified evidence
        boolean hasVerified = excerpts != null && !excerpts.isEmpty();
        if (!hasVerified) return "Low";
        // Low Relevance if mismatchFlags contains a critical mismatch (heuristic contains 'critical')
        if (mismatchFlags != null) {
            for (String f : mismatchFlags) {
                if (f != null && f.toLowerCase().contains("critical")) return "Low";
            }
        }
        return "Medium";
    }

    public String computeRecommendation(double overall, double gapAlignment, String confidenceLevel, List<String> mismatchFlags) {
        boolean hasCritical = mismatchFlags != null && mismatchFlags.stream().anyMatch(f -> f != null && f.toLowerCase().contains("critical"));
        boolean confidenceLow = confidenceLevel == null || confidenceLevel.equalsIgnoreCase("Low");
        if (overall >= 80 && gapAlignment >= 75 && !confidenceLow && !hasCritical) {
            return "Recommended";
        }
        return "Needs Review";
    }

    private String toJsonSafe(List<String> list) {
        try {
            if (list == null) return "[]";
            return objectMapper.writeValueAsString(list);
        } catch (JsonProcessingException e) {
            return "[]";
        }
    }

    private List<String> parseStringArray(JsonNode root, String... fieldNames) {
        // check top-level
        for (String f : fieldNames) {
            JsonNode node = root.path(f);
            if (!node.isMissingNode() && node.isArray()) {
                try {
                    return objectMapper.convertValue(node, objectMapper.getTypeFactory().constructCollectionType(List.class, String.class));
                } catch (Exception e) {
                    return Collections.emptyList();
                }
            }
        }
        // check nested containers
        for (String container : List.of("scores", "meta", "analysis", "result")) {
            JsonNode c = root.path(container);
            if (c != null && c.isObject()) {
                for (String f : fieldNames) {
                    JsonNode node = c.path(f);
                    if (!node.isMissingNode() && node.isArray()) {
                        try {
                            return objectMapper.convertValue(node, objectMapper.getTypeFactory().constructCollectionType(List.class, String.class));
                        } catch (Exception e) {
                            return Collections.emptyList();
                        }
                    }
                }
            }
        }
        return Collections.emptyList();
    }

    public boolean hasUsableContent(DocumentInsight insight) {
        if (insight == null) {
            return false;
        }
        boolean hasExcerpts = insight.getEvidenceExcerpts() != null && !insight.getEvidenceExcerpts().isEmpty();
        boolean hasScores =
            insight.getGapAlignmentScore() != null
                || insight.getMethodologyScore() != null
                || insight.getTheoreticalScore() != null
                || insight.getCitationScore() != null;
        boolean hasSignals =
            hasText(insight.getRecommendationStatus())
                || hasText(insight.getRelevanceLevel())
                || hasText(insight.getConfidenceLevel())
                || hasText(insight.getRawAiResponseJson())
                || hasFlags(insight.getMismatchFlagsJson())
                || hasFlags(insight.getWeaknessFlagsJson())
                || hasFlags(insight.getValidationFlagsJson());
        return hasExcerpts || hasScores || hasSignals;
    }

    private boolean isPositive(Double value) {
        return value != null && value > 0;
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private boolean hasFlags(String json) {
        return json != null && !json.isBlank() && !"[]".equals(json.trim());
    }

    public DocumentInsight mapToEntity(RawAIResponse response, Long documentId) {
        if (response == null) {
            return null;
        }
        try {
            return parseAIResponse(objectMapper.writeValueAsString(response), documentId);
        } catch (JsonProcessingException e) {
            logger.error("Failed to map AI response to entity", e);
            throw new RuntimeException("Failed to map AI response", e);
        }
    }

    private double readScore(JsonNode root, String... fieldNames) {
        // Try root first, then common nested containers like 'scores', 'meta', 'analysis'
        for (String field : fieldNames) {
            JsonNode node = root.path(field);
            if (!node.isMissingNode() && !node.isNull() && node.isNumber()) {
                return node.asDouble(0.0);
            }
        }
        for (String container : List.of("scores", "meta", "analysis", "result")) {
            JsonNode c = root.path(container);
            if (c != null && c.isObject()) {
                for (String field : fieldNames) {
                    JsonNode node = c.path(field);
                    if (!node.isMissingNode() && !node.isNull() && node.isNumber()) {
                        return node.asDouble(0.0);
                    }
                }
            }
        }
        return 0.0;
    }

    /** n8n may return 0–100 or 0–1; store consistently as 0–100. */
    private double normalizeScore(double value) {
        if (value > 0 && value <= 1.0) {
            return value * 100.0;
        }
        return value;
    }

    private List<EvidenceExcerpt> parseEvidenceExcerpts(JsonNode root, DocumentInsight insight) {
        List<EvidenceExcerpt> excerpts = new ArrayList<>();
        JsonNode evidenceArray = findEvidenceArray(root);
        if (evidenceArray == null || !evidenceArray.isArray()) {
            return excerpts;
        }
        int order = 0;
        for (JsonNode node : evidenceArray) {
            String quote = readText(node, "quoteText", "quote_text", "quote", "text");
            if (quote == null || quote.isBlank()) {
                continue;
            }
            EvidenceExcerpt ex = new EvidenceExcerpt();
            ex.setQuoteText(quote);
            JsonNode pageNode = node.path("pageNumber");
            if (pageNode.isMissingNode()) {
                pageNode = node.path("page_number");
            }
            if (pageNode.isMissingNode()) {
                pageNode = node.path("page");
            }
            if (!pageNode.isMissingNode() && !pageNode.isNull()) {
                ex.setPageNumber(pageNode.asInt());
            }

            ex.setRelevanceLevel(readText(node, "relevanceLevel", "relevance_level", "relevance"));
            ex.setCriterion(readText(node, "criterion", "criteria"));
            ex.setEvidenceType(readText(node, "evidenceType", "evidence_type", "type"));
            int display = readInt(node, "displayOrder", "display_order");
            ex.setDisplayOrder(display == 0 ? order : display);

            ex.setDocumentInsight(insight);
            excerpts.add(ex);
            order++;
        }
        return excerpts;
    }

    private int readInt(JsonNode node, String... fieldNames) {
        for (String field : fieldNames) {
            JsonNode v = node.path(field);
            if (!v.isMissingNode() && !v.isNull() && v.canConvertToInt()) {
                return v.asInt();
            }
        }
        return 0;
    }

    private JsonNode findEvidenceArray(JsonNode root) {
        for (String field : List.of("evidenceExcerpts", "evidence_excerpts", "excerpts", "quotes")) {
            JsonNode arr = root.path(field);
            if (arr.isArray()) {
                return arr;
            }
        }
        return null;
    }

    private String readText(JsonNode node, String... fieldNames) {
        // Try direct fields
        for (String field : fieldNames) {
            JsonNode value = node.path(field);
            if (!value.isMissingNode() && !value.isNull()) {
                return value.asText(null);
            }
        }
        // Try common nested containers on this node
        for (String container : List.of("scores", "meta", "analysis", "result")) {
            JsonNode c = node.path(container);
            if (c != null && c.isObject()) {
                for (String field : fieldNames) {
                    JsonNode value = c.path(field);
                    if (!value.isMissingNode() && !value.isNull()) {
                        return value.asText(null);
                    }
                }
            }
        }
        return null;
    }

    private JsonNode unwrapPayload(JsonNode root) {
        if (root == null || root.isNull()) {
            return objectMapper.createObjectNode();
        }
        if (root.isTextual()) {
            try {
                return unwrapPayload(objectMapper.readTree(root.asText()));
            } catch (JsonProcessingException e) {
                logger.warn("Could not parse nested JSON string from n8n");
                return objectMapper.createObjectNode();
            }
        }
        if (root.isArray() && root.size() > 0) {
            return unwrapPayload(root.get(0));
        }
        for (String field : List.of("output", "body", "data", "json", "result")) {
            JsonNode nested = root.path(field);
            if (nested.isObject() || nested.isArray() || nested.isTextual()) {
                return unwrapPayload(nested);
            }
        }
        return root;
    }
}
