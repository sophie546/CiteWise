package com.citewise.backend.service;

import com.citewise.backend.dto.NlpEvaluationRequest;
import com.citewise.backend.dto.RawAIResponse;
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
    
    @Value("${n8n.webhook.url:http://localhost:5678/webhook/analyze}")
    private String webhookUrl;

    public NLPMicroserviceClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public RawAIResponse evaluateDocument(NlpEvaluationRequest request) {
        try {
            logger.info("Sending document analysis request to n8n webhook: {}", webhookUrl);
            ResponseEntity<RawAIResponse> response = restTemplate.postForEntity(webhookUrl, request, RawAIResponse.class);
            return response.getBody();
        } catch (Exception e) {
            logger.error("Error communicating with n8n webhook", e);
            throw new RuntimeException("Failed to evaluate document through NLP microservice", e);
        }
    }
}
