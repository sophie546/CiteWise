package com.citewise.backend.controller;

import com.citewise.backend.entity.DocumentInsight;
import com.citewise.backend.entity.SemanticBaseline;
import com.citewise.backend.service.NLPMicroserviceClient;
import com.citewise.backend.service.RubricScoringEngine;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/test")
public class TestN8nController {

    @Autowired
    private NLPMicroserviceClient nlpClient;

    @Autowired
    private RubricScoringEngine scoringEngine;

    @GetMapping("/fire-n8n")
    public ResponseEntity<?> testN8nConnection() {
        try {
            // 1. Mock the baseline
            SemanticBaseline fakeBaseline = new SemanticBaseline();
            fakeBaseline.setProjectTitle("Decentralized Compute Evaluation");
            fakeBaseline.setRationale("We need to evaluate network latency.");
            fakeBaseline.setResearchGaps("Lack of standard validation methodologies.");

            // 2. Mock the text
            String fakePdfText = "This study addresses the critical gap in decentralized compute networks by introducing a novel validation methodology.";

            // 3. Fire request using the updated client
            System.out.println("Firing request to n8n...");
            String rawJsonResponse = nlpClient.evaluateDocument(fakePdfText, 
                                                                fakeBaseline.getProjectTitle(), 
                                                                fakeBaseline.getRationale(), 
                                                                fakeBaseline.getResearchGaps());

            // 4. Guard against hanging/empty responses
            if (rawJsonResponse == null || rawJsonResponse.isEmpty()) {
                return ResponseEntity.internalServerError().body("Test Failed: n8n returned an empty response.");
            }

            System.out.println("Received from n8n: " + rawJsonResponse);

            // 5. Parse and return
            DocumentInsight insight = scoringEngine.parseAIResponse(rawJsonResponse, UUID.randomUUID(), UUID.randomUUID());
            return ResponseEntity.ok(insight);

        } catch (Exception e) {
            System.err.println("Test Failed: " + e.getMessage());
            return ResponseEntity.internalServerError().body("Test Failed: " + e.getMessage());
        }
    }
}