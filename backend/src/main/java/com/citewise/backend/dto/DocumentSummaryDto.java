package com.citewise.backend.dto;

public class DocumentSummaryDto {
    private Long id;
    private String fileName;
    private Long sizeBytes;
    private String status; // "processing", "complete", "no_insights"
    private Double relevancyScore; // Average of all 4 rubric scores
    private Double gapAlignmentScore;
    private Double methodologyScore;
    private Double theoreticalScore;
    private Double citationScore;

    public DocumentSummaryDto() {}

    public DocumentSummaryDto(Long id, String fileName, Long sizeBytes, String status,
                              Double relevancyScore, Double gapAlignmentScore,
                              Double methodologyScore, Double theoreticalScore,
                              Double citationScore) {
        this.id = id;
        this.fileName = fileName;
        this.sizeBytes = sizeBytes;
        this.status = status;
        this.relevancyScore = relevancyScore;
        this.gapAlignmentScore = gapAlignmentScore;
        this.methodologyScore = methodologyScore;
        this.theoreticalScore = theoreticalScore;
        this.citationScore = citationScore;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public Long getSizeBytes() { return sizeBytes; }
    public void setSizeBytes(Long sizeBytes) { this.sizeBytes = sizeBytes; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Double getRelevancyScore() { return relevancyScore; }
    public void setRelevancyScore(Double relevancyScore) { this.relevancyScore = relevancyScore; }

    public Double getGapAlignmentScore() { return gapAlignmentScore; }
    public void setGapAlignmentScore(Double gapAlignmentScore) { this.gapAlignmentScore = gapAlignmentScore; }

    public Double getMethodologyScore() { return methodologyScore; }
    public void setMethodologyScore(Double methodologyScore) { this.methodologyScore = methodologyScore; }

    public Double getTheoreticalScore() { return theoreticalScore; }
    public void setTheoreticalScore(Double theoreticalScore) { this.theoreticalScore = theoreticalScore; }

    public Double getCitationScore() { return citationScore; }
    public void setCitationScore(Double citationScore) { this.citationScore = citationScore; }
}
