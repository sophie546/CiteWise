package com.citewise.backend.controller;

import com.citewise.backend.entity.DocumentInsight;
import com.citewise.backend.repository.DocumentInsightRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/documents")
@CrossOrigin(origins = "*")
public class DocumentAnalysisController {

    private final DocumentInsightRepository documentInsightRepository;

    public DocumentAnalysisController(DocumentInsightRepository documentInsightRepository) {
        this.documentInsightRepository = documentInsightRepository;
    }

    @GetMapping("/{id}/insights")
    public ResponseEntity<DocumentInsight> getDocumentInsights(@PathVariable Long id) {
        return documentInsightRepository.findByDocumentId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
