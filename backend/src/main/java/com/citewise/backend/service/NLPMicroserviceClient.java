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
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class NLPMicroserviceClient {
    private static final Logger logger = LoggerFactory.getLogger(NLPMicroserviceClient.class);
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${n8n.webhook.url:http://localhost:5678/webhook-test/citewise-evaluator}")
    private String webhookUrl;
    
    public NLPMicroserviceClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public RawAIResponse evaluateDocument(NlpEvaluationRequest request) {
        try {
            String jsonPayload = objectMapper.writeValueAsString(request);
            
            // ADD THESE LOGS
            logger.info("CRITICAL: Attempting to call N8N at: {}", webhookUrl);
            logger.info("CRITICAL: Payload being sent: {}", jsonPayload);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setConnection("close");

            HttpEntity<String> entity = new HttpEntity<>(jsonPayload, headers);

            String jsonResponse = restTemplate.postForObject(webhookUrl, entity, String.class);
            
            logger.info("CRITICAL: Received response from N8N: {}", jsonResponse);
            
            if (jsonResponse == null || jsonResponse.isBlank()) return null;
            return objectMapper.readValue(jsonResponse, RawAIResponse.class);
        } catch (Exception e) {
            // IMPROVED ERROR LOGGING
            logger.error("CRITICAL: N8N Call FAILED. Check if N8N is running. Error: {}", e.getMessage());
            throw new RuntimeException("Failed to process AI scoring: " + e.getMessage(), e);
        }
    }
}