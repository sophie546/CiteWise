package com.citewise.backend.entity;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

@Entity
@Table(name = "document_insights")
public class DocumentInsight {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long documentId;

    private Double gapAlignmentScore;
    private Double methodologyScore;
    private Double theoreticalScore;
    private Double citationScore;
    private Double averageOverallScore;

    @OneToMany(mappedBy = "documentInsight", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<EvidenceExcerpt> evidenceExcerpts = new ArrayList<>();

    public DocumentInsight() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getDocumentId() { return documentId; }
    public void setDocumentId(Long documentId) { this.documentId = documentId; }

    public Double getGapAlignmentScore() { return gapAlignmentScore; }
    public void setGapAlignmentScore(Double gapAlignmentScore) { this.gapAlignmentScore = gapAlignmentScore; }

    public Double getMethodologyScore() { return methodologyScore; }
    public void setMethodologyScore(Double methodologyScore) { this.methodologyScore = methodologyScore; }

    public Double getTheoreticalScore() { return theoreticalScore; }
    public void setTheoreticalScore(Double theoreticalScore) { this.theoreticalScore = theoreticalScore; }

    public Double getCitationScore() { return citationScore; }
    public void setCitationScore(Double citationScore) { this.citationScore = citationScore; }

    public Double getAverageOverallScore() { return averageOverallScore; }
    public void setAverageOverallScore(Double averageOverallScore) { this.averageOverallScore = averageOverallScore; }

    public List<EvidenceExcerpt> getEvidenceExcerpts() { return evidenceExcerpts; }
    public void setEvidenceExcerpts(List<EvidenceExcerpt> evidenceExcerpts) { this.evidenceExcerpts = evidenceExcerpts; }
}
