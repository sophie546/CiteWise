package com.citewise.backend.service;

import com.citewise.backend.dto.DocumentUploadResponse;
import com.citewise.backend.dto.DocumentUploadResult;
import java.io.IOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.encryption.InvalidPasswordException;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import com.citewise.backend.entity.UploadedDocument;
import com.citewise.backend.repository.UploadedDocumentRepository;
import java.time.LocalDateTime;

@Service
public class DocumentUploadService {
    private final long maxFileSizeBytes;
    private final UploadedDocumentRepository uploadedDocumentRepository;

    public DocumentUploadService(
            @Value("${rrl.max-file-size-mb:20}") int maxFileSizeMb,
            UploadedDocumentRepository uploadedDocumentRepository) {
        this.maxFileSizeBytes = maxFileSizeMb * 1024L * 1024L;
        this.uploadedDocumentRepository = uploadedDocumentRepository;
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
                uploadedDocumentRepository.save(entity);

                results.add(new DocumentUploadResult(
                    fileName,
                    sizeBytes,
                    true,
                    "Parsed successfully",
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
