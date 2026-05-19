package com.citewise.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

@Service
public class NLPMicroserviceClient {
    private static final Logger logger = LoggerFactory.getLogger(NLPMicroserviceClient.class);
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper(); // Add this

    @Value("${CITEWISE_NLP_MICROSERVICE_URL:http://localhost:5678/webhook-test/citewise-evaluator}")
    private String webhookUrl;

    public NLPMicroserviceClient() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000); 
        factory.setReadTimeout(30000); // Increased for large PDF processing
        this.restTemplate = new RestTemplate(factory);
    }

    public String evaluateDocument(String extractedText, String projectTitle, String rationale, String researchGaps) {
        try {
            // 1. Use Jackson ObjectNode to build JSON safely
            ObjectNode payload = objectMapper.createObjectNode();
            payload.put("extractedText", extractedText != null ? extractedText : "");
            payload.put("projectTitle", projectTitle != null ? projectTitle : "");
            payload.put("rationale", rationale != null ? rationale : "");
            payload.put("researchGaps", researchGaps != null ? researchGaps : "");

            String jsonPayload = objectMapper.writeValueAsString(payload);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setConnection("close");

            HttpEntity<String> entity = new HttpEntity<>(jsonPayload, headers);

            logger.info("Triggering NLP microservice...");
            return restTemplate.postForObject(webhookUrl, entity, String.class);
        } catch (Exception e) {
            logger.error("Error building or sending JSON to n8n", e);
            throw new RuntimeException("Failed to process AI scoring: " + e.getMessage(), e);
        }
    }
}