package com.websentinel.scanner.controller;

import com.websentinel.scanner.dto.FindingResponse;
import com.websentinel.scanner.dto.ScanResponse;
import com.websentinel.scanner.service.ScanService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
public class ScannerController {

    private final ScanService scanService;

    public ScannerController(ScanService scanService) {
        this.scanService = scanService;
    }

    private UUID currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (UUID) auth.getPrincipal();
    }

    @PostMapping("/api/websites/{websiteId}/scans")
    public ScanResponse startScan(@PathVariable UUID websiteId,
                                  @RequestParam(value = "type", required = false, defaultValue = "PASSIVE") String type) {
        return toResponse(scanService.startScan(websiteId, type, currentUserId()));
    }

    @GetMapping("/api/scans/{scanId}")
    public ScanResponse getScan(@PathVariable UUID scanId) {
        return scanService.getScan(scanId, currentUserId());
    }

    @GetMapping("/api/scans/{scanId}/status")
    public String getStatus(@PathVariable UUID scanId) {
        return scanService.getStatus(scanId, currentUserId());
    }

    @GetMapping("/api/scans/{scanId}/findings")
    public List<FindingResponse> getFindings(@PathVariable UUID scanId) {
        return scanService.getFindings(scanId, currentUserId());
    }

    private ScanResponse toResponse(com.websentinel.scanner.entity.Scan s) {
        ScanResponse r = new ScanResponse();
        r.setId(s.getId());
        r.setWebsiteId(s.getWebsiteId());
        r.setScanType(s.getScanType());
        r.setStatus(s.getStatus());
        r.setStartedAt(s.getStartedAt());
        r.setCompletedAt(s.getCompletedAt());
        r.setErrorMessage(s.getErrorMessage());
        return r;
    }
}