package com.citewise.backend.controller;

import com.citewise.backend.dto.ApiResponse;
import com.citewise.backend.dto.CatalystPayload;
import com.citewise.backend.service.CatalystClient;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClientException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/catalyst")
public class CatalystController {
    private final CatalystClient catalystClient;

    public CatalystController(CatalystClient catalystClient) {
        this.catalystClient = catalystClient;
    }

    // Existing GET endpoint
    @GetMapping("/{groupId}")
    public ResponseEntity<ApiResponse<CatalystPayload>> getCatalystData(@PathVariable String groupId) {
        if (groupId == null || groupId.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, "Workspace ID is required", null));
        }

        try {
            CatalystPayload payload = catalystClient.fetchCatalystData(groupId.trim());
            return ResponseEntity.ok(new ApiResponse<>(true, "CATalyst data loaded", payload));
        } catch (RestClientException ex) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                .body(new ApiResponse<>(false, "Failed to reach CATalyst", null));
        }
    }

    // NEW ENDPOINT: Create session ID from workspace ID and return full data
    @PostMapping("/import")
    public ResponseEntity<ApiResponse<Map<String, Object>>> importWorkspace(@RequestBody Map<String, String> request) {
        String workspaceId = request.get("workspaceId");
        
        if (workspaceId == null || workspaceId.trim().isEmpty()) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, "Workspace ID is required", null));
        }
        
        try {
            // Fetch the CATalyst data
            CatalystPayload payload = catalystClient.fetchCatalystData(workspaceId.trim());
            
            if (payload == null || payload.title() == null) {
                return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "Invalid workspace ID or no data found", null));
            }
            
            // Generate a NEW session ID (NOT the workspace ID)
            String sessionId = UUID.randomUUID().toString();
            
            System.out.println("✅ Created new session for workspace: " + workspaceId);
            System.out.println("   Session ID: " + sessionId);
            System.out.println("   Title: " + payload.title());
            System.out.println("   Rationale: " + (payload.rationale() != null ? payload.rationale().substring(0, Math.min(50, payload.rationale().length())) + "..." : "null"));
            System.out.println("   Gaps count: " + (payload.gaps() != null ? payload.gaps().size() : 0));
            
            // Build response with ALL data
            Map<String, Object> responseData = new HashMap<>();
            responseData.put("sessionId", sessionId);
            responseData.put("title", payload.title());
            responseData.put("rationale", payload.rationale() != null ? payload.rationale() : "");
            responseData.put("gaps", payload.gaps() != null ? payload.gaps() : List.of());
            
            return ResponseEntity.ok(new ApiResponse<>(true, "Workspace imported successfully", responseData));
                
        } catch (RestClientException ex) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                .body(new ApiResponse<>(false, "Failed to reach CATalyst service", null));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse<>(false, "Failed to import workspace: " + ex.getMessage(), null));
        }
    }
}