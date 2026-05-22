package com.citewise.backend.module3.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "generated_draft")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GeneratedDraft {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "session_id", nullable = false)
    private UUID sessionId;

    @Lob
    @Column(name = "content_text", columnDefinition = "text")
    private String contentText;

    @Column(name = "references_text", columnDefinition = "TEXT")
    private String referencesText;

    @Lob
    @Column(name = "background_text", columnDefinition = "text")
    private String backgroundText;

    @Lob
    @Column(name = "rationale_text", columnDefinition = "text")
    private String rationaleText;

    @Lob
    @Column(name = "gap_text", columnDefinition = "text")
    private String gapText;

    @Column(name = "citations_used_json", columnDefinition = "TEXT")
    private String citationsUsedJson;

    @Column(name = "validation_status")
    private String validationStatus;

    @Column(name = "validation_flags_json", columnDefinition = "TEXT")
    private String validationFlagsJson;

    @Column(name = "unsupported_claim_flags_json", columnDefinition = "TEXT")
    private String unsupportedClaimFlagsJson;

    @Column(name = "metrics_json", columnDefinition = "TEXT")
    private String metricsJson;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

}