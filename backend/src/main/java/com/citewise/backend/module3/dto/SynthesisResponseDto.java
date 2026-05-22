package com.citewise.backend.module3.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class SynthesisResponseDto {
    private UUID draftId;
    private UUID sessionId;
    private String contentText;
    private String referencesText;
    private JsonNode sections;
    private List<String> references;
    private List<String> citationsUsed;
    private String validationStatus;
    private List<String> validationFlags;
    private JsonNode unsupportedClaimFlags;
    private JsonNode metrics;
    private LocalDateTime createdAt;
    private Boolean success;
    private String message;
    private String status;
    private Boolean retryRecommended;
    private String errorMessage;
    private Map<String, Object> meta;
    private Map<String, Object> placeholders;
    private JsonNode sectionsPreview;
}