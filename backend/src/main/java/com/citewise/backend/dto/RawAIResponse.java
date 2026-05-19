package com.citewise.backend.dto;

import java.util.List;

public class RawAIResponse {
    private Double gapAlignmentScore;
    private Double methodologyScore;
    private Double theoreticalScore;
    private Double citationScore;
    private List<EvidenceExcerptDto> evidenceExcerpts;

    public RawAIResponse() {}

    public Double getGapAlignmentScore() { return gapAlignmentScore; }
    public void setGapAlignmentScore(Double gapAlignmentScore) { this.gapAlignmentScore = gapAlignmentScore; }

    public Double getMethodologyScore() { return methodologyScore; }
    public void setMethodologyScore(Double methodologyScore) { this.methodologyScore = methodologyScore; }

    public Double getTheoreticalScore() { return theoreticalScore; }
    public void setTheoreticalScore(Double theoreticalScore) { this.theoreticalScore = theoreticalScore; }

    public Double getCitationScore() { return citationScore; }
    public void setCitationScore(Double citationScore) { this.citationScore = citationScore; }

    public List<EvidenceExcerptDto> getEvidenceExcerpts() { return evidenceExcerpts; }
    public void setEvidenceExcerpts(List<EvidenceExcerptDto> evidenceExcerpts) { this.evidenceExcerpts = evidenceExcerpts; }

    public static class EvidenceExcerptDto {
        private String quoteText;
        private Integer pageNumber;
        private String relevanceLevel;

        public EvidenceExcerptDto() {}

        public String getQuoteText() { return quoteText; }
        public void setQuoteText(String quoteText) { this.quoteText = quoteText; }

        public Integer getPageNumber() { return pageNumber; }
        public void setPageNumber(Integer pageNumber) { this.pageNumber = pageNumber; }

        public String getRelevanceLevel() { return relevanceLevel; }
        public void setRelevanceLevel(String relevanceLevel) { this.relevanceLevel = relevanceLevel; }
    }
}
