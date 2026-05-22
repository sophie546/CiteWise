package com.citewise.backend.module3.controller;

import com.citewise.backend.module3.entity.GeneratedDraft;
import com.citewise.backend.module3.service.RAGSynthesisService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/synthesis")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class DraftGenerationController {

    private final RAGSynthesisService raqSynthesisService;

    @PostMapping("/generate")
    public ResponseEntity<GeneratedDraft> generateIntroduction(@RequestParam UUID sessionId) {
        GeneratedDraft draft = raqSynthesisService.orchestrateDrafting(sessionId);
        return ResponseEntity.ok(draft);
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportDraft(@RequestParam UUID draftId, @RequestParam String format) {
        return raqSynthesisService.exportDraft(draftId, format);
    }
}