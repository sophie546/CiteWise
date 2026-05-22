package com.citewise.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.citewise.backend.dto.NlpEvaluationRequest;
import com.citewise.backend.dto.RawAIResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class NLPMicroserviceClient {
    private static final Logger logger = LoggerFactory.getLogger(NLPMicroserviceClient.class);
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${n8n.webhook.url:https://citewise-n8n-1.onrender.com/webhook/citewise-evaluator}")
    private String webhookUrl;
    
    public NLPMicroserviceClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    /** Returns the raw JSON body from the n8n webhook (preferred for parsing). */
  /**
   * Builds a webhook body that works with common n8n Webhook + AI Agent field names.
   */
    private String buildWebhookPayload(NlpEvaluationRequest request) throws com.fasterxml.jackson.core.JsonProcessingException {
        String text = request.getExtractedText();
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("extracted_text", text);
        payload.put("text", text);
        payload.put("chatInput", text);
        payload.put("input", text);
        payload.put("baseline", request.getBaseline());
        return objectMapper.writeValueAsString(payload);
    }

    public String evaluateDocumentRaw(NlpEvaluationRequest request) {
        try {
            String jsonPayload = buildWebhookPayload(request);
            int textLen = request.getExtractedText() != null ? request.getExtractedText().length() : 0;
            logger.info("Calling n8n webhook at: {} (extracted_text chars={})", webhookUrl, textLen);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setConnection("close");

            HttpEntity<String> entity = new HttpEntity<>(jsonPayload, headers);
            String jsonResponse = restTemplate.postForObject(webhookUrl, entity, String.class);
            if (jsonResponse == null || jsonResponse.isBlank()) {
                logger.warn("n8n webhook returned an empty body");
                return null;
            }

            logger.info("n8n webhook response ({} chars): {}", jsonResponse.length(), jsonResponse);

            if (N8nResponseValidator.isPlaceholderRawJson(jsonResponse)) {
                logger.error(
                    "n8n returned placeholder JSON (Sample evidence from test). "
                    + "Fix Respond to Webhook to use ={{ JSON.stringify($json) }}."
                );
                return null;
            }

            return jsonResponse;
        } catch (Exception e) {
            logger.error("n8n webhook call failed: {}", e.getMessage());
            throw new RuntimeException("Failed to process AI scoring: " + e.getMessage(), e);
        }
    }

    public RawAIResponse evaluateDocument(NlpEvaluationRequest request) {
        String jsonResponse = evaluateDocumentRaw(request);
        if (jsonResponse == null) {
            return null;
        }
        try {
            JsonNode root = objectMapper.readTree(jsonResponse);
            if (root.isArray() && root.size() > 0) {
                root = root.get(0);
            }
            for (String field : new String[] { "output", "body", "data", "json", "result" }) {
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
            return objectMapper.treeToValue(root, RawAIResponse.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse n8n response: " + e.getMessage(), e);
        }
    }
}