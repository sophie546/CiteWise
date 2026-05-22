package com.citewise.backend.module3.service;

import com.citewise.backend.module3.dto.Document;
import com.citewise.backend.module3.entity.GeneratedDraft;
import com.citewise.backend.module3.repository.GeneratedDraftRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class RAGSynthesisService {

    private final GeneratedDraftRepository draftRepository;
    private final DeterministicCitationEngine citationEngine;

    /**
     * Core orchestrator - fetches approved documents, builds RAG prompt,
     * generates draft with placeholders, then applies APA citations
     */
    @Transactional
    public GeneratedDraft orchestrateDrafting(UUID sessionId) {
        log.info("RAGSynthesisService orchestrating drafting for session: {}", sessionId);

        // 1. Fetch approved texts
        List<String> approvedTexts = fetchApprovedTexts(sessionId);
        
        // 2. Fetch document metadata for citations
        List<Document> approvedDocuments = fetchApprovedDocuments(sessionId);
        
        // 3. Build RAG prompt and get AI response with placeholders
        String rawAiText = callAiApi(approvedTexts);
        
        // 4. Inject APA citations using DeterministicCitationEngine
        String finalText = citationEngine.injectAPACitations(rawAiText, approvedDocuments);
        
        // 5. Create and save draft
        GeneratedDraft draft = GeneratedDraft.builder()
            .id(UUID.randomUUID())
            .sessionId(sessionId)
            .contentText(finalText)
            .createdAt(LocalDateTime.now())
            .build();
        
        draft.saveToDatabase();
        
        return draftRepository.save(draft);
    }

    /**
     * Fetches the text of all 'APPROVED' documents
     */
    private List<String> fetchApprovedTexts(UUID sessionId) {
        List<String> approvedTexts = new ArrayList<>();
        
        try {
            // Call Module 2 API to get approved documents
            String url = "http://localhost:8080/api/v1/documents/session/" + sessionId;
            // In real implementation, fetch actual document texts
            approvedTexts.add("Sample approved document text 1");
            approvedTexts.add("Sample approved document text 2");
            approvedTexts.add("Sample approved document text 3");
        } catch (Exception e) {
            log.warn("Could not fetch approved documents, using mock data", e);
            approvedTexts.addAll(getMockApprovedTexts());
        }
        
        return approvedTexts;
    }

    /**
     * Fetches approved documents with metadata for citation engine
     */
    private List<Document> fetchApprovedDocuments(UUID sessionId) {
        List<Document> documents = new ArrayList<>();
        
        // Mock documents with proper metadata for APA citations
        documents.add(Document.builder()
            .id(UUID.randomUUID())
            .author("Vaswani, A.")
            .year(2017)
            .title("Attention is All You Need")
            .build());
        
        documents.add(Document.builder()
            .id(UUID.randomUUID())
            .author("Smith, J. & Jones, M.")
            .year(2022)
            .title("Mapping High-Density Corpora")
            .build());
        
        documents.add(Document.builder()
            .id(UUID.randomUUID())
            .author("Brown, A.")
            .year(2023)
            .title("Contextual Grounding in Document Parsing")
            .build());
        
        return documents;
    }

    /**
     * Calls AI API to generate text with [DocX] placeholders
     */
    private String callAiApi(List<String> approvedTexts) {
        // Build RAG prompt with approved texts
        StringBuilder prompt = new StringBuilder();
        prompt.append("SOURCE DOCUMENTS:\n");
        for (int i = 0; i < approvedTexts.size(); i++) {
            prompt.append("[").append(i + 1).append("] ").append(approvedTexts.get(i)).append("\n\n");
        }
        prompt.append("Generate a literature review introduction using [Doc1], [Doc2], etc. as citation placeholders.\n");
        
        // Mock AI response with placeholders
        return getMockAiResponseWithPlaceholders();
    }

    private String getMockAiResponseWithPlaceholders() {
        return "In recent years, the intersection of advanced artificial intelligence and research synthesis " +
               "has emerged as a cornerstone of modern digital scholarship [Doc1]. Standard methods of literature " +
               "evaluation often suffer from cognitive overload, forcing researchers to manually reconcile disparate " +
               "data sources, statistical tables, and thematic findings [Doc2].\n\n" +
               "By utilizing semantic embedding matrices and large language models (LLMs), automated tools can now " +
               "systematically map connections across high-density research corpora [Doc3]. This synthesis demonstrates " +
               "that automated validation pipelines not only accelerate the initial review phase but also enhance the " +
               "reliability of subsequent literature reviews by establishing rigorous verification metrics.";
    }

    public ResponseEntity<byte[]> exportDraft(UUID draftId, String format) {
        Optional<GeneratedDraft> draftOpt = draftRepository.findById(draftId);
        if (draftOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        GeneratedDraft draft = draftOpt.get();
        byte[] content = draft.getContentText().getBytes();
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        headers.setContentDispositionFormData("attachment", "draft_" + draftId + "." + format.toLowerCase());
        
        return ResponseEntity.ok().headers(headers).body(content);
    }

    private List<String> getMockApprovedTexts() {
        return List.of(
            "Attention mechanisms in transformer architectures revolutionized NLP by enabling parallel processing.",
            "Literature review automation reduces cognitive load and improves research efficiency significantly.",
            "Semantic embedding matrices allow for contextual understanding of academic texts across multiple domains."
        );
    }
}