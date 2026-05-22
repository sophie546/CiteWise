package com.citewise.backend.module3.service;

import com.citewise.backend.entity.SemanticBaseline;
import com.citewise.backend.entity.UploadedDocument;
import com.citewise.backend.module3.dto.SynthesisResponseDto;
import com.citewise.backend.module3.entity.GeneratedDraft;
import com.citewise.backend.module3.repository.GeneratedDraftRepository;
import com.citewise.backend.repository.SemanticBaselineRepository;
import com.citewise.backend.repository.UploadedDocumentRepository;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class RAGSynthesisService {

    private final GeneratedDraftRepository draftRepository;
    private final UploadedDocumentRepository documentRepository;
    private final SemanticBaselineRepository baselineRepository;
    private final SynthesisN8nClient synthesisN8nClient;

    @Transactional
    public SynthesisResponseDto orchestrateDrafting(UUID sessionId) {
        log.info("RAGSynthesisService orchestrating drafting for session: {}", sessionId);

        SemanticBaseline baseline = baselineRepository
            .findFirstBySessionIdOrderByCreatedAtDesc(sessionId)
            .orElse(null);

        if (baseline == null) {
            log.warn("No semantic baseline found for session {}", sessionId);
        }

        List<UploadedDocument> allDocs = documentRepository.findBySessionId(sessionId.toString());
        List<UploadedDocument> docsWithText = allDocs.stream()
            .filter(d -> d.getParsedText() != null && !d.getParsedText().isBlank())
            .toList();

        if (docsWithText.isEmpty()) {
            return SynthesisResponseDto.builder()
                .sessionId(sessionId)
                .success(false)
                .message("No documents with parsed text found for session " + sessionId)
                .build();
        }

        JsonNode n8nResponse = synthesisN8nClient.callSynthesisWebhook(sessionId, baseline, docsWithText);

        String contentText = n8nResponse.path("contentText").asText("");
        String referencesText = n8nResponse.path("referencesText").asText("");
        boolean success = n8nResponse.path("success").asBoolean(true);
        String message = n8nResponse.path("message").asText("Draft generated successfully");

        // Replace any existing draft for this session
        draftRepository.deleteBySessionId(sessionId);

        GeneratedDraft draft = GeneratedDraft.builder()
            .sessionId(sessionId)
            .contentText(contentText)
            .referencesText(referencesText)
            .build();

        draft = draftRepository.save(draft);

        return SynthesisResponseDto.builder()
            .draftId(draft.getId())
            .sessionId(sessionId)
            .contentText(contentText)
            .referencesText(referencesText)
            .createdAt(draft.getCreatedAt())
            .success(success)
            .message(message)
            .build();
    }

    public ResponseEntity<byte[]> exportDraft(UUID draftId, String format) {
        Optional<GeneratedDraft> draftOpt = draftRepository.findById(draftId);
        if (draftOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        GeneratedDraft draft = draftOpt.get();
        String fullContent = draft.getContentText() != null ? draft.getContentText() : "";
        if (draft.getReferencesText() != null && !draft.getReferencesText().isBlank()) {
            fullContent += "\n\nReferences\n" + draft.getReferencesText();
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        headers.setContentDispositionFormData("attachment", "draft_" + draftId + "." + format.toLowerCase());

        return ResponseEntity.ok().headers(headers).body(fullContent.getBytes());
    }
}
