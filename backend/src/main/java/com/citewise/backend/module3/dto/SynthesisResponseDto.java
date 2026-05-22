package com.citewise.backend.module3.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SynthesisResponseDto {
    private UUID draftId;
    private UUID sessionId;
    private String contentText;
    private String referencesText;
    private LocalDateTime createdAt;
    private boolean success;
    private String message;
}