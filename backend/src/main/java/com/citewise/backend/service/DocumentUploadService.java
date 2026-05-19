package com.citewise.backend.service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.encryption.InvalidPasswordException;
import org.apache.pdfbox.text.PDFTextStripper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.citewise.backend.dto.CatalystPayload;
import com.citewise.backend.dto.DocumentUploadResponse;
import com.citewise.backend.dto.DocumentUploadResult;
import com.citewise.backend.entity.DocumentInsight;
import com.citewise.backend.entity.EvidenceExcerpt;
import com.citewise.backend.entity.SemanticBaseline;
import com.citewise.backend.entity.UploadedDocument;
import com.citewise.backend.repository.DocumentInsightRepository;
import com.citewise.backend.repository.UploadedDocumentRepository;

@Service
public class DocumentUploadService {
    private static final Logger logger = LoggerFactory.getLogger(DocumentUploadService.class);
    private final long maxFileSizeBytes;
    private final UploadedDocumentRepository uploadedDocumentRepository;
    private final DocumentInsightRepository documentInsightRepository;
    private final CatalystClient catalystClient;
    private final NLPMicroserviceClient nlpClient;
    private final RubricScoringEngine scoringEngine;
    private final DocumentUploadService selfProxy;

    public DocumentUploadService(
            @Value("${rrl.max-file-size-mb:20}") int maxFileSizeMb,
            UploadedDocumentRepository uploadedDocumentRepository,
            DocumentInsightRepository documentInsightRepository,
            CatalystClient catalystClient,
            NLPMicroserviceClient nlpClient,
            RubricScoringEngine scoringEngine,
            @Lazy DocumentUploadService selfProxy) {
        this.maxFileSizeBytes = maxFileSizeMb * 1024L * 1024L;
        this.uploadedDocumentRepository = uploadedDocumentRepository;
        this.documentInsightRepository = documentInsightRepository;
        this.catalystClient = catalystClient;
        this.nlpClient = nlpClient;
        this.scoringEngine = scoringEngine;
        this.selfProxy = selfProxy;
    }

    public DocumentUploadResponse processUploads(String sessionId, List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            return new DocumentUploadResponse(0, 0, 0, List.of());
        }

        List<DocumentUploadResult> results = new ArrayList<>();
        Set<String> seenHashes = new HashSet<>();
        int accepted = 0;

        for (MultipartFile file : files) {
            String fileName = safeFileName(file);
            long sizeBytes = file.getSize();

            if (file.isEmpty()) {
                results.add(new DocumentUploadResult(fileName, sizeBytes, false, "File is empty", 0));
                continue;
            }

            if (!isPdf(file, fileName)) {
                results.add(new DocumentUploadResult(fileName, sizeBytes, false, "Unsupported file type", 0));
                continue;
            }

            if (sizeBytes > maxFileSizeBytes) {
                results.add(new DocumentUploadResult(
                    fileName,
                    sizeBytes,
                    false,
                    "File exceeds the size limit",
                    0
                ));
                continue;
            }

            byte[] data;
            try {
                data = file.getBytes();
            } catch (IOException ex) {
                results.add(new DocumentUploadResult(fileName, sizeBytes, false, "Failed to read file", 0));
                continue;
            }

            String hash = hashFile(data);
            if (!seenHashes.add(hash)) {
                results.add(new DocumentUploadResult(fileName, sizeBytes, false, "Duplicate file detected", 0));
                continue;
            }

            try (PDDocument document = Loader.loadPDF(data)) {
                PDFTextStripper stripper = new PDFTextStripper();
                String text = stripper.getText(document);
                int charCount = text == null ? 0 : text.trim().length();

                if (charCount == 0) {
                    results.add(new DocumentUploadResult(
                        fileName,
                        sizeBytes,
                        false,
                        "No extractable text found",
                        0
                    ));
                    continue;
                }

                UploadedDocument entity = new UploadedDocument();
                entity.setSessionId(sessionId);
                entity.setFileName(fileName);
                entity.setFileHash(hash);
                entity.setSizeBytes(sizeBytes);
                entity.setCharacterCount(charCount);
                entity.setUploadedAt(LocalDateTime.now());
                entity.setParsedText(text);
                UploadedDocument savedDocument = uploadedDocumentRepository.save(entity);

                selfProxy.processAiScoringAsync(savedDocument.getId(), sessionId, text);

                results.add(new DocumentUploadResult(
                    fileName,
                    sizeBytes,
                    true,
                    "Parsed successfully; AI scoring queued",
                    charCount
                ));
                accepted += 1;
            } catch (InvalidPasswordException ex) {
                results.add(new DocumentUploadResult(
                    fileName,
                    sizeBytes,
                    false,
                    "Encrypted PDFs are not supported",
                    0
                ));
            } catch (IOException ex) {
                results.add(new DocumentUploadResult(
                    fileName,
                    sizeBytes,
                    false,
                    "Unable to extract text",
                    0
                ));
            }
        }

        int failed = results.size() - accepted;
        return new DocumentUploadResponse(results.size(), accepted, failed, results);
    }

    @Async
    public CompletableFuture<Void> processAiScoringAsync(Long documentId, String sessionId, String extractedText) {
        try {
            SemanticBaseline baseline = buildSemanticBaseline(sessionId);
            if (baseline == null) {
                logger.warn("Skipping AI scoring because semantic baseline could not be built for session {}", sessionId);
                return CompletableFuture.completedFuture(null);
            }

            String rawJsonResponse = nlpClient.evaluateDocument(
                extractedText,
                baseline.getProjectTitle(),
                baseline.getRationale(),
                baseline.getResearchGaps()
            );

            if (rawJsonResponse == null || rawJsonResponse.isBlank()) {
                logger.warn("NLP microservice returned an empty response for document {}", documentId);
                return CompletableFuture.completedFuture(null);
            }

            UUID documentUuid = documentId == null ? UUID.randomUUID() : new UUID(0L, documentId);
            UUID sessionUuid = safeUuid(sessionId);
            DocumentInsight insight = scoringEngine.parseAIResponse(rawJsonResponse, documentUuid, sessionUuid);

            if (insight != null) {
                insight.setDocumentId(documentId);
                linkEvidenceExcerpts(insight);
                documentInsightRepository.save(insight);
            }

            return CompletableFuture.completedFuture(null);
        } catch (Exception ex) {
            logger.error("AI scoring pipeline failed for document {}", documentId, ex);
            return CompletableFuture.completedFuture(null);
        }
    }

    private SemanticBaseline buildSemanticBaseline(String sessionId) {
        try {
            CatalystPayload payload = catalystClient.fetchCatalystData(sessionId);
            SemanticBaseline baseline = new SemanticBaseline();
            baseline.setCatalystWorkspaceId(sessionId);
            baseline.setSessionId(safeUuid(sessionId));
            baseline.setProjectTitle(payload == null ? null : payload.title());
            baseline.setRationale(payload == null ? null : payload.rationale());
            baseline.setResearchGaps(payload == null || payload.gaps() == null ? null : String.join("\n", payload.gaps()));
            return baseline;
        } catch (Exception ex) {
            logger.error("Failed to build semantic baseline for session {}", sessionId, ex);
            return null;
        }
    }

    private UUID safeUuid(String value) {
        try {
            return value == null || value.isBlank() ? null : UUID.fromString(value.trim());
        } catch (IllegalArgumentException ex) {
            return UUID.nameUUIDFromBytes(value.getBytes(StandardCharsets.UTF_8));
        }
    }

    private void linkEvidenceExcerpts(DocumentInsight insight) {
        if (insight.getEvidenceExcerpts() == null) {
            return;
        }
        for (EvidenceExcerpt excerpt : insight.getEvidenceExcerpts()) {
            excerpt.setDocumentInsight(insight);
        }
    }

    private boolean isPdf(MultipartFile file, String fileName) {
        String contentType = file.getContentType();
        if (contentType != null && contentType.equalsIgnoreCase("application/pdf")) {
            return true;
        }
        return fileName.toLowerCase(Locale.ROOT).endsWith(".pdf");
    }

    private String safeFileName(MultipartFile file) {
        String fileName = file.getOriginalFilename();
        return fileName == null || fileName.isBlank() ? "unnamed.pdf" : fileName;
    }

    private String hashFile(byte[] data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data);
            StringBuilder builder = new StringBuilder(hash.length * 2);
            for (byte value : hash) {
                builder.append(String.format(Locale.ROOT, "%02x", value));
            }
            return builder.toString();
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("Unable to hash file", ex);
        }
    }
}
