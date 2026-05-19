package com.citewise.backend.service;

import com.citewise.backend.dto.NlpEvaluationRequest;
import com.citewise.backend.dto.RawAIResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class NLPMicroserviceClient {
    private static final Logger logger = LoggerFactory.getLogger(NLPMicroserviceClient.class);
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${n8n.webhook.url:http://localhost:5678/webhook/citewise-evaluator}")
    private String webhookUrl;

    public NLPMicroserviceClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public RawAIResponse evaluateDocument(NlpEvaluationRequest request) {
        try {
            logger.info("Sending document analysis request to n8n webhook: {}", webhookUrl);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setConnection("close");

            String jsonPayload = objectMapper.writeValueAsString(request);
            HttpEntity<String> entity = new HttpEntity<>(jsonPayload, headers);

            String jsonResponse = restTemplate.postForObject(webhookUrl, entity, String.class);
            
            if (jsonResponse == null || jsonResponse.isBlank()) return null;
            
            return objectMapper.readValue(jsonResponse, RawAIResponse.class);
        } catch (Exception e) {
            logger.error("Error communicating with n8n", e);
            throw new RuntimeException("Failed to process AI scoring: " + e.getMessage(), e);
        }
    }
}