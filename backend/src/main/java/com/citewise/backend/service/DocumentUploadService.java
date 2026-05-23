package com.citewise.backend.service;

import java.io.IOException;
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
import java.util.concurrent.Executor;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.encryption.InvalidPasswordException;
import org.apache.pdfbox.text.PDFTextStripper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.citewise.backend.dto.DocumentUploadResponse;
import com.citewise.backend.dto.DocumentUploadResult;
import com.citewise.backend.dto.NlpEvaluationRequest;
import com.citewise.backend.entity.DocumentInsight;
import com.citewise.backend.entity.SemanticBaseline;
import com.citewise.backend.entity.UploadedDocument;
import com.citewise.backend.repository.DocumentInsightRepository;
import com.citewise.backend.repository.SemanticBaselineRepository;
import com.citewise.backend.repository.UploadedDocumentRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class DocumentUploadService {
    private static final Logger logger = LoggerFactory.getLogger(DocumentUploadService.class);
    
    private final long maxFileSizeBytes;
    private final UploadedDocumentRepository uploadedDocumentRepository;
    private final DocumentInsightRepository documentInsightRepository;
    private final SemanticBaselineRepository semanticBaselineRepository;
    private final NLPMicroserviceClient nlpMicroserviceClient;
    private final RubricScoringEngine rubricScoringEngine;
    private final Executor aiScoringExecutor;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public DocumentUploadService(
            @Value("${rrl.max-file-size-mb:20}") int maxFileSizeMb,
            UploadedDocumentRepository uploadedDocumentRepository,
            DocumentInsightRepository documentInsightRepository,
            SemanticBaselineRepository semanticBaselineRepository,
            NLPMicroserviceClient nlpMicroserviceClient,
            RubricScoringEngine rubricScoringEngine,
            @Qualifier("aiScoringExecutor") Executor aiScoringExecutor) {
        this.maxFileSizeBytes = maxFileSizeMb * 1024L * 1024L;
        this.uploadedDocumentRepository = uploadedDocumentRepository;
        this.documentInsightRepository = documentInsightRepository;
        this.semanticBaselineRepository = semanticBaselineRepository;
        this.nlpMicroserviceClient = nlpMicroserviceClient;
        this.rubricScoringEngine = rubricScoringEngine;
        this.aiScoringExecutor = aiScoringExecutor;
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
                results.add(new DocumentUploadResult(null, fileName, sizeBytes, false, "File is empty", 0));
                continue;
            }

            if (!isPdf(file, fileName)) {
                results.add(new DocumentUploadResult(null, fileName, sizeBytes, false, "Unsupported file type", 0));
                continue;
            }

            if (sizeBytes > maxFileSizeBytes) {
                results.add(new DocumentUploadResult(null, fileName, sizeBytes, false, "File exceeds size limit", 0));
                continue;
            }

            // Check if a file with the same name was already uploaded in this session
            if (uploadedDocumentRepository.existsBySessionIdAndFileName(sessionId, fileName)) {
                results.add(new DocumentUploadResult(null, fileName, sizeBytes, false, "File already uploaded previously", 0));
                continue;
            }

            byte[] data;
            try {
                data = file.getBytes();
            } catch (IOException ex) {
                results.add(new DocumentUploadResult(null, fileName, sizeBytes, false, "Failed to read file", 0));
                continue;
            }

            String hash = hashFile(data);
            if (!seenHashes.add(hash)) {
                results.add(new DocumentUploadResult(null, fileName, sizeBytes, false, "Duplicate file in batch", 0));
                continue;
            }

            // Check against previously uploaded documents in the database
            if (uploadedDocumentRepository.existsBySessionIdAndFileHash(sessionId, hash)) {
                results.add(new DocumentUploadResult(null, fileName, sizeBytes, false, "File already uploaded previously", 0));
                continue;
            }

            try (PDDocument document = Loader.loadPDF(data)) {
                PDFTextStripper stripper = new PDFTextStripper();
                String text = stripper.getText(document);
                int charCount = text == null ? 0 : text.trim().length();

                if (charCount == 0) {
                    results.add(new DocumentUploadResult(null, fileName, sizeBytes, false, "No extractable text", 0));
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

                entity = uploadedDocumentRepository.save(entity);
                analyzeDocumentAsync(entity);

                results.add(new DocumentUploadResult(entity.getId(), fileName, sizeBytes, true, "Parsed successfully; AI scoring queued", charCount));
                accepted += 1;
            } catch (InvalidPasswordException ex) {
                results.add(new DocumentUploadResult(null, fileName, sizeBytes, false, "Encrypted PDF", 0));
            } catch (IOException ex) {
                results.add(new DocumentUploadResult(null, fileName, sizeBytes, false, "Unable to extract text", 0));
            }
        }
        return new DocumentUploadResponse(results.size(), accepted, results.size() - accepted, results);
    }

    public void analyzeDocumentAsync(UploadedDocument document) {
        CompletableFuture.runAsync(() -> {
            try {
                logger.info("Starting AI scoring pipeline for document ID: {}", document.getId());

                SemanticBaseline baseline = loadBaseline(document.getSessionId());
                if (baseline == null) {
                    logger.warn(
                        "No research baseline found for session {} — skipping AI scoring for document {}. "
                        + "Import a CATalyst workspace for this session first.",
                        document.getSessionId(), document.getId());
                    return;
                }

                NlpEvaluationRequest request = new NlpEvaluationRequest(
                    document.getParsedText(),
                    baseline.getProjectTitle() != null ? baseline.getProjectTitle() : "",
                    baseline.getRationale() != null ? baseline.getRationale() : "",
                    parseGapsToString(baseline.getResearchGaps())
                );

                logger.info("Calling n8n for document ID: {}", document.getId());
                String rawResponse = nlpMicroserviceClient.evaluateDocumentRaw(request);

                if (rawResponse != null) {
                    DocumentInsight insight = rubricScoringEngine.parseAIResponse(rawResponse, document.getId());
                    if (insight != null) {
                        // If n8n provided an explicit overall score, prefer it over any recomputed average.
                        try {
                            JsonNode rootNode = objectMapper.readTree(rawResponse);
                            // look for overall in common names and nested containers
                            Double providedOverall = null;
                            for (String name : new String[]{"overall", "overallScore", "overall_score"}) {
                                JsonNode n = rootNode.path(name);
                                if (!n.isMissingNode() && !n.isNull() && (n.isNumber() || n.isTextual())) {
                                    try {
                                        double v = n.isNumber() ? n.asDouble() : Double.parseDouble(n.asText());
                                        providedOverall = v;
                                        break;
                                    } catch (NumberFormatException ex) {
                                        // ignore and continue
                                    }
                                }
                            }
                            if (providedOverall == null) {
                                for (String container : new String[]{"scores", "meta", "analysis", "result", "data"}) {
                                    JsonNode containerNode = rootNode.path(container);
                                    if (containerNode != null && containerNode.isObject()) {
                                        for (String name : new String[]{"overall", "overallScore", "overall_score"}) {
                                            JsonNode n = containerNode.path(name);
                                            if (!n.isMissingNode() && !n.isNull() && (n.isNumber() || n.isTextual())) {
                                                try {
                                                    double v = n.isNumber() ? n.asDouble() : Double.parseDouble(n.asText());
                                                    providedOverall = v;
                                                    break;
                                                } catch (NumberFormatException ex) {
                                                    // ignore
                                                }
                                            }
                                        }
                                    }
                                    if (providedOverall != null) break;
                                }
                            }

                            if (providedOverall != null) {
                                // normalize 0-1 to 0-100
                                double normalized = providedOverall;
                                if (normalized > 0 && normalized <= 1.0) normalized = normalized * 100.0;
                                if (Double.isNaN(normalized) || normalized < 0) normalized = 0.0;
                                if (normalized > 100) normalized = 100.0;
                                insight.setOverallScore(normalized);
                                // avoid exposing the previously computed unweighted average
                                insight.setAverageOverallScore(null);
                            }
                        } catch (Exception ex) {
                            logger.debug("Could not extract provided overall score from n8n response", ex);
                        }
                        documentInsightRepository.findByDocumentId(document.getId())
                            .ifPresent(documentInsightRepository::delete);
                        documentInsightRepository.save(insight);
                        int excerptCount = insight.getEvidenceExcerpts() != null
                            ? insight.getEvidenceExcerpts().size() : 0;
                        logger.info(
                            "Saved n8n insights for document {} — gap={}, methodology={}, theoretical={}, citation={}, overall={}, recommendation={}, confidence={}, relevance={}, excerpts={}",
                            document.getId(),
                            insight.getGapAlignmentScore(),
                            insight.getMethodologyScore(),
                            insight.getTheoreticalScore(),
                            insight.getCitationScore(),
                            insight.getOverallScore(),
                            insight.getRecommendationStatus(),
                            insight.getConfidenceLevel(),
                            insight.getRelevanceLevel(),
                            excerptCount
                        );
                    }
                } else {
                    logger.warn(
                        "No insights saved for document {} — n8n response was empty, placeholder, or Code node returned {{}}. "
                        + "In Code node use: const raw = item.output ?? item.text; and Respond: ={{ JSON.stringify($json) }}",
                        document.getId()
                    );
                }
            } catch (Exception e) {
                logger.error("AI scoring pipeline failed for document {}: {}", document.getId(), e.getMessage(), e);
            }
        }, aiScoringExecutor);
    }

    private SemanticBaseline loadBaseline(String sessionId) {
        if (sessionId == null || sessionId.isBlank()) {
            return null;
        }
        try {
            return semanticBaselineRepository
                .findFirstBySessionIdOrderByCreatedAtDesc(UUID.fromString(sessionId))
                .orElse(null);
        } catch (IllegalArgumentException ex) {
            logger.warn("Session ID '{}' is not a valid UUID", sessionId);
            return null;
        }
    }

    private String parseGapsToString(String researchGapsJson) {
        if (researchGapsJson == null || researchGapsJson.isBlank()) {
            return "";
        }
        try {
            JsonNode node = objectMapper.readTree(researchGapsJson);
            if (node.isArray()) {
                List<String> gaps = new ArrayList<>();
                for (JsonNode gap : node) {
                    if (gap.isTextual()) {
                        gaps.add(gap.asText());
                    } else if (gap.isObject()) {
                        String text = gap.path("gap").asText(
                            gap.path("description").asText(gap.path("text").asText("")));
                        if (!text.isBlank()) {
                            gaps.add(text);
                        }
                    }
                }
                return String.join("; ", gaps);
            }
            return researchGapsJson;
        } catch (Exception ex) {
            return researchGapsJson;
        }
    }

    private boolean isPdf(MultipartFile file, String fileName) {
        String contentType = file.getContentType();
        return (contentType != null && contentType.equalsIgnoreCase("application/pdf")) || 
               fileName.toLowerCase(Locale.ROOT).endsWith(".pdf");
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
            for (byte b : hash) builder.append(String.format(Locale.ROOT, "%02x", b));
            return builder.toString();
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("Hashing failed", ex);
        }
    }
}