package com.citewise.backend.dto;

public class NlpEvaluationRequest {
    private String extractedText;
    private String semanticBaseline;

    public NlpEvaluationRequest() {}

    public NlpEvaluationRequest(String extractedText, String semanticBaseline) {
        this.extractedText = extractedText;
        this.semanticBaseline = semanticBaseline;
    }

    public String getExtractedText() { return extractedText; }
    public void setExtractedText(String extractedText) { this.extractedText = extractedText; }

    public String getSemanticBaseline() { return semanticBaseline; }
    public void setSemanticBaseline(String semanticBaseline) { this.semanticBaseline = semanticBaseline; }
}
