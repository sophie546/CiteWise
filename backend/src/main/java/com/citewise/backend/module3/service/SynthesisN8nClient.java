package com.citewise.backend.module3.service;

import com.citewise.backend.entity.SemanticBaseline;
import com.citewise.backend.entity.UploadedDocument;
import com.citewise.backend.module3.dto.CitationMetadata;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.UUID;

@Service
public class SynthesisN8nClient {

    private static final Logger log = LoggerFactory.getLogger(SynthesisN8nClient.class);

    private final RestTemplate restTemplate;
    private final CitationMetadataExtractor citationMetadataExtractor;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${n8n.synthesis.webhook.url:http://localhost:5678/webhook/citewise-synthesizer-v2}")
    private String synthesisWebhookUrl;

    public SynthesisN8nClient(RestTemplate restTemplate, CitationMetadataExtractor citationMetadataExtractor) {
        this.restTemplate = restTemplate;
        this.citationMetadataExtractor = citationMetadataExtractor;
    }

    public JsonNode callSynthesisWebhook(UUID sessionId, SemanticBaseline baseline, List<UploadedDocument> documents) {
        try {
            ObjectNode payload = objectMapper.createObjectNode();
            payload.put("sessionId", sessionId.toString());

            // Build baseline node
            ObjectNode baselineNode = objectMapper.createObjectNode();
            if (baseline != null) {
                baselineNode.put("title", baseline.getProjectTitle() != null ? baseline.getProjectTitle() : "");
                baselineNode.put("rationale", baseline.getRationale() != null ? baseline.getRationale() : "");
                ArrayNode gapsArray = baselineNode.putArray("gaps");
                if (baseline.getResearchGaps() != null && !baseline.getResearchGaps().isBlank()) {
                    try {
                        JsonNode gapsNode = objectMapper.readTree(baseline.getResearchGaps());
                        if (gapsNode.isArray()) {
                            for (JsonNode gap : gapsNode) {
                                if (gap.isTextual()) {
                                    gapsArray.add(gap.asText());
                                } else if (gap.isObject()) {
                                    String text = gap.path("description").asText(
                                        gap.path("gap").asText(gap.path("text").asText(gap.toString()))
                                    );
                                    gapsArray.add(text);
                                }
                            }
                        } else {
                            gapsArray.add(baseline.getResearchGaps());
                        }
                    } catch (Exception e) {
                        log.warn("Could not parse researchGaps JSON, using raw string: {}", e.getMessage());
                        gapsArray.add(baseline.getResearchGaps());
                    }
                }
            }
            payload.set("baseline", baselineNode);

            // Build approvedDocuments array - prefer canonical fields required by the v2 workflow
            ArrayNode docsArray = objectMapper.createArrayNode();
            for (UploadedDocument doc : documents) {
                if (doc == null || doc.getParsedText() == null || doc.getParsedText().isBlank()) continue;
                ObjectNode docNode = objectMapper.createObjectNode();
                // documentId as string
                if (doc.getId() != null) docNode.put("documentId", String.valueOf(doc.getId()));
                docNode.put("filename", doc.getFileName() != null ? doc.getFileName() : "");
                docNode.put("extracted_text", doc.getParsedText());

                CitationMetadata citation = citationMetadataExtractor.extract(doc.getFileName(), doc.getParsedText());
                log.info(
                    "Citation metadata extracted for documentId={} filename={} arxivId={} doi={} authorDisplay={} authors={} year={} title={} source={} reliable={} warnings={}",
                    doc.getId(),
                    doc.getFileName(),
                    citation.getArxivId(),
                    citation.getDoi(),
                    citation.getAuthorDisplay(),
                    citation.getAuthors(),
                    citation.getYear(),
                    citation.getTitle(),
                    citation.getJournal(),
                    citation.isMetadataReliable(),
                    citation.getWarnings()
                );

                ObjectNode meta = objectMapper.createObjectNode();
                if (citation.getAuthorDisplay() != null && !citation.getAuthorDisplay().isBlank()) {
                    meta.put("author", citation.getAuthorDisplay());
                    meta.put("authorDisplay", citation.getAuthorDisplay());
                } else {
                    meta.putNull("author");
                    meta.putNull("authorDisplay");
                }
                meta.set("authors", objectMapper.valueToTree(citation.getAuthors() != null ? citation.getAuthors() : List.of()));
                if (citation.getYear() != null) {
                    meta.put("year", citation.getYear());
                } else {
                    meta.putNull("year");
                }
                if (citation.getTitle() != null && !citation.getTitle().isBlank()) {
                    meta.put("title", citation.getTitle());
                } else {
                    meta.putNull("title");
                }
                meta.put("journal", citation.getJournal() != null ? citation.getJournal() : "");
                meta.put("volume", citation.getVolume() != null ? citation.getVolume() : "");
                meta.put("issue", citation.getIssue() != null ? citation.getIssue() : "");
                meta.put("pages", citation.getPages() != null ? citation.getPages() : "");
                meta.put("doi", citation.getDoi() != null ? citation.getDoi() : "");
                meta.put("url", citation.getUrl() != null ? citation.getUrl() : "");
                meta.put("arxivId", citation.getArxivId() != null ? citation.getArxivId() : "");
                meta.put("publisher", citation.getPublisher() != null ? citation.getPublisher() : "");
                meta.put("sourceType", citation.getSourceType() != null ? citation.getSourceType() : "");
                meta.put("metadataReliable", citation.isMetadataReliable());
                meta.set("warnings", objectMapper.valueToTree(citation.getWarnings() != null ? citation.getWarnings() : List.of()));

                docNode.set("metadata", meta);
                docsArray.add(docNode);
            }
            payload.set("approvedDocuments", docsArray);

            String jsonPayload = objectMapper.writeValueAsString(payload);
            log.info("Calling synthesis webhook: {} (sessionId={}, docs={})", synthesisWebhookUrl, sessionId, docsArray.size());

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setConnection("close");
            HttpEntity<String> entity = new HttpEntity<>(jsonPayload, headers);

            String jsonResponse = restTemplate.postForObject(synthesisWebhookUrl, entity, String.class);
            if (jsonResponse == null || jsonResponse.isBlank()) {
                throw new RuntimeException("Synthesis webhook returned empty response");
            }

            log.info("Synthesis webhook response received ({} chars)", jsonResponse.length());
            JsonNode root = objectMapper.readTree(jsonResponse);
            if (root.isArray() && !root.isEmpty()) {
                root = root.get(0);
            }
            for (String field : new String[]{"output", "body", "data", "json", "result"}) {
                JsonNode nested = root.path(field);
                if (nested.isObject()) {
                    root = nested;
                    break;
                }
                if (nested.isTextual()) {
                    root = objectMapper.readTree(nested.asText());
                    break;
                }
            }
            return root;
        } catch (Exception e) {
            log.error("Synthesis webhook call failed: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to call synthesis webhook: " + e.getMessage(), e);
        }
    }
}
