package com.citewise.backend.service;

import com.citewise.backend.dto.RawAIResponse;
import com.citewise.backend.entity.DocumentInsight;
import com.citewise.backend.entity.EvidenceExcerpt;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class RubricScoringEngine {
    
    public DocumentInsight mapToEntity(RawAIResponse response, Long documentId) {
        if (response == null) {
            return null;
        }

        DocumentInsight insight = new DocumentInsight();
        insight.setDocumentId(documentId);
        insight.setGapAlignmentScore(response.getGapAlignmentScore());
        insight.setMethodologyScore(response.getMethodologyScore());
        insight.setTheoreticalScore(response.getTheoreticalScore());
        insight.setCitationScore(response.getCitationScore());
        
        if (response.getEvidenceExcerpts() != null) {
            insight.setEvidenceExcerpts(response.getEvidenceExcerpts().stream().map(dto -> {
                EvidenceExcerpt excerpt = new EvidenceExcerpt();
                excerpt.setQuoteText(dto.getQuoteText());
                excerpt.setPageNumber(dto.getPageNumber());
                excerpt.setRelevanceLevel(dto.getRelevanceLevel());
                excerpt.setDocumentInsight(insight); // Maintain bidirectional relationship
                return excerpt;
            }).collect(Collectors.toList()));
        }
        
        return insight;
    }
}
