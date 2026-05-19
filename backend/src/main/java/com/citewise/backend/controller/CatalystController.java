package com.citewise.backend.controller;

import com.citewise.backend.dto.ApiResponse;
import com.citewise.backend.dto.CatalystPayload;
import com.citewise.backend.service.CatalystClient;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClientException;

@RestController
@RequestMapping("/api/catalyst")
public class CatalystController {
    private final CatalystClient catalystClient;

    public CatalystController(CatalystClient catalystClient) {
        this.catalystClient = catalystClient;
    }

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
}
