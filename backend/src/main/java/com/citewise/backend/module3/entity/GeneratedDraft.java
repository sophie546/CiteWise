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

    @Column(name = "content_text", columnDefinition = "LONGTEXT")
    private String contentText;

    @Column(name = "references_text", columnDefinition = "TEXT")
    private String referencesText;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

}