package com.citewise.backend.controller;

import com.citewise.backend.dto.DocumentSummaryDto;
import com.citewise.backend.dto.ApiResponse;
import com.citewise.backend.entity.DocumentInsight;
import com.citewise.backend.entity.UploadedDocument;
import com.citewise.backend.repository.DocumentInsightRepository;
import com.citewise.backend.repository.UploadedDocumentRepository;
import com.citewise.backend.service.DocumentUploadService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/documents")
@CrossOrigin(origins = "*")
public class DocumentAnalysisController {

    private final DocumentInsightRepository documentInsightRepository;
    private final UploadedDocumentRepository uploadedDocumentRepository;
    private final DocumentUploadService documentUploadService;

    public DocumentAnalysisController(
        DocumentInsightRepository documentInsightRepository,
        UploadedDocumentRepository uploadedDocumentRepository,
        DocumentUploadService documentUploadService
    ) {
        this.documentInsightRepository = documentInsightRepository;
        this.uploadedDocumentRepository = uploadedDocumentRepository;
        this.documentUploadService = documentUploadService;
    }

    @GetMapping("/{id}/insights")
    public ResponseEntity<DocumentInsight> getDocumentInsights(@PathVariable Long id) {
        return documentInsightRepository.findByDocumentId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Returns all documents for a session with their insight scores.
     * Used by the frontend sidebar to display uploaded RRLs with relevancy scores.
     */
    @GetMapping("/session/{sessionId}")
    public ResponseEntity<List<DocumentSummaryDto>> getSessionDocuments(@PathVariable String sessionId) {
        List<UploadedDocument> documents = uploadedDocumentRepository.findBySessionId(sessionId);
        List<DocumentSummaryDto> summaries = new ArrayList<>();

        for (UploadedDocument doc : documents) {
            Optional<DocumentInsight> insightOpt = documentInsightRepository.findByDocumentId(doc.getId());

            if (insightOpt.isPresent()) {
                DocumentInsight insight = insightOpt.get();
                double gap = insight.getGapAlignmentScore() != null ? insight.getGapAlignmentScore() : 0;
                double method = insight.getMethodologyScore() != null ? insight.getMethodologyScore() : 0;
                double theory = insight.getTheoreticalScore() != null ? insight.getTheoreticalScore() : 0;
                double citation = insight.getCitationScore() != null ? insight.getCitationScore() : 0;
                double relevancy = (gap + method + theory + citation) / 4.0;

                summaries.add(new DocumentSummaryDto(
                        doc.getId(), doc.getFileName(), doc.getSizeBytes(),
                        "complete", relevancy, gap, method, theory, citation
                ));
            } else {
                summaries.add(new DocumentSummaryDto(
                        doc.getId(), doc.getFileName(), doc.getSizeBytes(),
                        "processing", null, null, null, null, null
                ));
            }
        }

        return ResponseEntity.ok(summaries);
    }

    @PostMapping("/{id}/assess")
    public ResponseEntity<ApiResponse<String>> assessDocument(@PathVariable Long id) {
        UploadedDocument document = uploadedDocumentRepository.findById(id).orElse(null);
        if (document == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ApiResponse<>(false, "Document not found", null));
        }

        String parsedText = document.getParsedText();
        if (parsedText == null || parsedText.isBlank()) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, "Document text is empty", null));
        }

        documentUploadService.analyzeDocumentAsync(document);
        return ResponseEntity.ok(new ApiResponse<>(true, "Assessment queued", "queued"));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> deleteDocument(@PathVariable Long id) {
        if (!uploadedDocumentRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        
        documentInsightRepository.findByDocumentId(id).ifPresent(documentInsightRepository::delete);
        
        uploadedDocumentRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
