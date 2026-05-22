package com.citewise.backend.module3.service;

import com.citewise.backend.entity.SemanticBaseline;
import com.citewise.backend.entity.UploadedDocument;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
public class SynthesisN8nClient {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${n8n.synthesis.webhook.url:http://localhost:5678/webhook/citewise-synthesizer-v2}")
    private String synthesisWebhookUrl;

    public SynthesisN8nClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
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

            // Build approvedDocuments array — prefer canonical fields required by the v2 workflow
            ArrayNode docsArray = objectMapper.createArrayNode();
            for (UploadedDocument doc : documents) {
                if (doc == null || doc.getParsedText() == null || doc.getParsedText().isBlank()) continue;
                ObjectNode docNode = objectMapper.createObjectNode();
                // documentId as string
                if (doc.getId() != null) docNode.put("documentId", String.valueOf(doc.getId()));
                docNode.put("filename", doc.getFileName() != null ? doc.getFileName() : "");
                docNode.put("extracted_text", doc.getParsedText());

                ObjectNode meta = objectMapper.createObjectNode();
                meta.put("author", "");
                meta.putNull("year");
                meta.put("title", doc.getFileName() != null ? doc.getFileName() : "");
                meta.put("journal", "");
                meta.put("volume", "");
                meta.put("issue", "");
                meta.put("pages", "");
                meta.put("doi", "");
                meta.put("url", "");
                meta.put("publisher", "");

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
