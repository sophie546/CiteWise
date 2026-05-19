package com.citewise.backend.service;

import com.citewise.backend.dto.NlpEvaluationRequest;
import com.citewise.backend.dto.RawAIResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class NLPMicroserviceClient {
    private static final Logger logger = LoggerFactory.getLogger(NLPMicroserviceClient.class);
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    
    @Value("${n8n.webhook.url:http://localhost:5678/webhook/citewise-evaluator}")
    private String webhookUrl;

    public NLPMicroserviceClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
        this.objectMapper = new ObjectMapper();
    }

    public RawAIResponse evaluateDocument(NlpEvaluationRequest request) {
        try {
            logger.info("Sending document analysis request to n8n webhook: {}", webhookUrl);
            
            // n8n webhook returns the raw Gemini API response envelope
            ResponseEntity<String> response = restTemplate.postForEntity(webhookUrl, request, String.class);
            String responseBody = response.getBody();
            
            if (responseBody == null || responseBody.isBlank()) {
                logger.error("Empty response from n8n webhook");
                return null;
            }
            
            logger.debug("Raw n8n response: {}", responseBody);
            
            JsonNode root = objectMapper.readTree(responseBody);

            if (root.isArray() && root.size() > 0) {
                root = root.get(0);
            }

            if (root.has("gapAlignmentScore")) {
                RawAIResponse result = objectMapper.treeToValue(root, RawAIResponse.class);
                logger.info("Successfully parsed AI response: gap={}, method={}, theory={}, citation={}",
                        result.getGapAlignmentScore(), result.getMethodologyScore(),
                        result.getTheoreticalScore(), result.getCitationScore());
                return result;
            }

            String aiJsonText = null;

            if (root.has("output") && root.get("output").isTextual()) {
                aiJsonText = root.get("output").asText();
            }

            // Parse the Gemini API response envelope:
            // { "candidates": [{ "content": { "parts": [{ "text": "{...}" }] } }] }
            if (aiJsonText == null) {
                JsonNode candidates = root.path("candidates");
                if (candidates.isArray() && candidates.size() > 0) {
                    JsonNode parts = candidates.get(0).path("content").path("parts");
                    if (parts.isArray() && parts.size() > 0) {
                        aiJsonText = parts.get(0).path("text").asText(null);
                    }
                }
            }

            if (aiJsonText == null || aiJsonText.isBlank()) {
                logger.error("Unrecognized response format from n8n webhook");
                return null;
            }

            // Parse the inner AI-generated JSON into RawAIResponse
            RawAIResponse result = objectMapper.readValue(aiJsonText, RawAIResponse.class);
            logger.info("Successfully parsed AI response: gap={}, method={}, theory={}, citation={}",
                    result.getGapAlignmentScore(), result.getMethodologyScore(),
                    result.getTheoreticalScore(), result.getCitationScore());
            return result;
            
        } catch (Exception e) {
            logger.error("Error communicating with n8n webhook", e);
            throw new RuntimeException("Failed to evaluate document through NLP microservice", e);
        }
    }
}
