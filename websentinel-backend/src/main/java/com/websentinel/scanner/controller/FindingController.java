package com.websentinel.scanner.controller;

import com.websentinel.scanner.dto.FindingResponse;
import com.websentinel.scanner.dto.UpdateFindingStatusRequest;
import com.websentinel.scanner.service.FindingService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
public class FindingController {

    private final FindingService findingService;

    public FindingController(FindingService findingService) {
        this.findingService = findingService;
    }

    private UUID currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (UUID) auth.getPrincipal();
    }

    @GetMapping("/api/findings/{id}")
    public FindingResponse get(@PathVariable UUID id) {
        return findingService.get(id, currentUserId());
    }

    @PutMapping("/api/findings/{id}/status")
    public FindingResponse updateStatus(@PathVariable UUID id,
                                       @Valid @RequestBody UpdateFindingStatusRequest req) {
        return findingService.updateStatus(id, currentUserId(), req.getStatus());
    }
}