package com.citewise.backend.dto;

import java.util.List;

public class RawAIResponse {
    private String documentId;
    private String filename;

    private Double gapAlignmentScore;
    private Double methodologyScore;
    private Double theoreticalScore;
    private Double citationScore;
    private Double overallScore;

    private String recommendationStatus;
    private String confidenceLevel;
    private String relevanceLevel;

    private List<String> mismatchFlags;
    private List<String> weaknessFlags;
    private List<String> validationFlags;

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

    public Double getOverallScore() { return overallScore; }
    public void setOverallScore(Double overallScore) { this.overallScore = overallScore; }

    public String getRecommendationStatus() { return recommendationStatus; }
    public void setRecommendationStatus(String recommendationStatus) { this.recommendationStatus = recommendationStatus; }

    public String getConfidenceLevel() { return confidenceLevel; }
    public void setConfidenceLevel(String confidenceLevel) { this.confidenceLevel = confidenceLevel; }

    public String getRelevanceLevel() { return relevanceLevel; }
    public void setRelevanceLevel(String relevanceLevel) { this.relevanceLevel = relevanceLevel; }

    public List<String> getMismatchFlags() { return mismatchFlags; }
    public void setMismatchFlags(List<String> mismatchFlags) { this.mismatchFlags = mismatchFlags; }

    public List<String> getWeaknessFlags() { return weaknessFlags; }
    public void setWeaknessFlags(List<String> weaknessFlags) { this.weaknessFlags = weaknessFlags; }

    public List<String> getValidationFlags() { return validationFlags; }
    public void setValidationFlags(List<String> validationFlags) { this.validationFlags = validationFlags; }

    public List<EvidenceExcerptDto> getEvidenceExcerpts() { return evidenceExcerpts; }
    public void setEvidenceExcerpts(List<EvidenceExcerptDto> evidenceExcerpts) { this.evidenceExcerpts = evidenceExcerpts; }

    public String getDocumentId() { return documentId; }
    public void setDocumentId(String documentId) { this.documentId = documentId; }

    public String getFilename() { return filename; }
    public void setFilename(String filename) { this.filename = filename; }

    public static class EvidenceExcerptDto {
        private String criterion;
        private String quoteText;
        private Integer pageNumber;
        private String relevanceLevel;
        private String evidenceType;
        private Integer displayOrder;

        public EvidenceExcerptDto() {}

        public String getCriterion() { return criterion; }
        public void setCriterion(String criterion) { this.criterion = criterion; }

        public String getQuoteText() { return quoteText; }
        public void setQuoteText(String quoteText) { this.quoteText = quoteText; }

        public Integer getPageNumber() { return pageNumber; }
        public void setPageNumber(Integer pageNumber) { this.pageNumber = pageNumber; }

        public String getRelevanceLevel() { return relevanceLevel; }
        public void setRelevanceLevel(String relevanceLevel) { this.relevanceLevel = relevanceLevel; }

        public String getEvidenceType() { return evidenceType; }
        public void setEvidenceType(String evidenceType) { this.evidenceType = evidenceType; }

        public Integer getDisplayOrder() { return displayOrder; }
        public void setDisplayOrder(Integer displayOrder) { this.displayOrder = displayOrder; }
    }
}
