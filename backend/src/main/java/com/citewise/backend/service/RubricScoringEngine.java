package com.citewise.backend.service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

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
     * Parse raw AI JSON response into a DocumentInsight entity.
     */
    public DocumentInsight parseAIResponse(String rawJsonResponse, UUID documentId, UUID sessionId) {
        try {
            if (rawJsonResponse == null || rawJsonResponse.isBlank()) {
                return null;
            }

            JsonNode root = objectMapper.readTree(rawJsonResponse);

            double gapAlignment = root.path("gapAlignmentScore").asDouble(0.0);
            double methodology = root.path("methodologyScore").asDouble(0.0);
            double theoretical = root.path("theoreticalScore").asDouble(0.0);
            double citation = root.path("citationScore").asDouble(0.0);

            DocumentInsight insight = new DocumentInsight();
            if (documentId != null) {
                long resolvedDocumentId = documentId.getMostSignificantBits() != 0L
                    ? documentId.getMostSignificantBits()
                    : documentId.getLeastSignificantBits();
                insight.setDocumentId(resolvedDocumentId);
            }

            insight.setGapAlignmentScore(gapAlignment);
            insight.setMethodologyScore(methodology);
            insight.setTheoreticalScore(theoretical);
            insight.setCitationScore(citation);

            double average = (gapAlignment + methodology + theoretical + citation) / 4.0;
            insight.setAverageOverallScore(average);

            List<EvidenceExcerpt> excerpts = new ArrayList<>();
            JsonNode evidenceArray = root.path("evidenceExcerpts");
            if (evidenceArray.isArray()) {
                for (JsonNode node : evidenceArray) {
                    EvidenceExcerpt ex = new EvidenceExcerpt();
                    ex.setQuoteText(node.path("quoteText").asText(null));
                    if (node.hasNonNull("pageNumber")) {
                        ex.setPageNumber(node.path("pageNumber").asInt());
                    }
                    ex.setRelevanceLevel(node.path("relevanceLevel").asText(null));
                    ex.setDocumentInsight(insight);
                    excerpts.add(ex);
                }
            }

            insight.setEvidenceExcerpts(excerpts);
            return insight;
        } catch (JsonProcessingException jpe) {
            logger.error("Failed to parse AI JSON response", jpe);
            throw new RuntimeException("Invalid AI response JSON", jpe);
        } catch (Exception e) {
            logger.error("Unexpected error while parsing AI response", e);
            throw new RuntimeException("Failed to parse AI response", e);
        }
    }
}
