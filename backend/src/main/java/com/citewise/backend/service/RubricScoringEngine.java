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

            double gapAlignment = normalizeScore(readScore(root, "gapAlignmentScore", "gap_alignment_score"));
            double methodology = normalizeScore(readScore(root, "methodologyScore", "methodology_score"));
            double theoretical = normalizeScore(readScore(root, "theoreticalScore", "theoretical_score"));
            double citation = normalizeScore(readScore(root, "citationScore", "citation_score"));

            DocumentInsight insight = new DocumentInsight();
            insight.setDocumentId(documentId);

            insight.setGapAlignmentScore(gapAlignment);
            insight.setMethodologyScore(methodology);
            insight.setTheoreticalScore(theoretical);
            insight.setCitationScore(citation);

            double average = (gapAlignment + methodology + theoretical + citation) / 4.0;
            insight.setAverageOverallScore(average);

            List<EvidenceExcerpt> excerpts = parseEvidenceExcerpts(root, insight);

            insight.setEvidenceExcerpts(excerpts);

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

    public boolean hasUsableContent(DocumentInsight insight) {
        if (insight == null) {
            return false;
        }
        boolean hasExcerpts = insight.getEvidenceExcerpts() != null && !insight.getEvidenceExcerpts().isEmpty();
        boolean hasScores =
            isPositive(insight.getGapAlignmentScore())
                || isPositive(insight.getMethodologyScore())
                || isPositive(insight.getTheoreticalScore())
                || isPositive(insight.getCitationScore());
        return hasExcerpts || hasScores;
    }

    private boolean isPositive(Double value) {
        return value != null && value > 0;
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
        for (String field : fieldNames) {
            JsonNode node = root.path(field);
            if (!node.isMissingNode() && !node.isNull()) {
                return node.asDouble(0.0);
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
            ex.setDocumentInsight(insight);
            excerpts.add(ex);
        }
        return excerpts;
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
        for (String field : fieldNames) {
            JsonNode value = node.path(field);
            if (!value.isMissingNode() && !value.isNull()) {
                return value.asText(null);
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
