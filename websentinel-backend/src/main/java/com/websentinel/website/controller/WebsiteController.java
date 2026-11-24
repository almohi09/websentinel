package com.websentinel.website.controller;

import com.websentinel.website.dto.*;
import com.websentinel.website.service.WebsiteService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
public class WebsiteController {

    private final WebsiteService websiteService;

    public WebsiteController(WebsiteService websiteService) {
        this.websiteService = websiteService;
    }

    private UUID currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (UUID) auth.getPrincipal();
    }

    private String clientIp(HttpServletRequest req) {
        String xff = req.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) return xff.split(",")[0].trim();
        return req.getRemoteAddr();
    }

    @PostMapping("/api/organizations/{orgId}/websites")
    public WebsiteResponse add(@PathVariable UUID orgId,
                              @Valid @RequestBody AddWebsiteRequest req,
                              HttpServletRequest httpReq) {
        return websiteService.add(orgId, currentUserId(), req, clientIp(httpReq));
    }

    @GetMapping("/api/organizations/{orgId}/websites")
    public List<WebsiteResponse> list(@PathVariable UUID orgId) {
        return websiteService.list(orgId, currentUserId());
    }

    @GetMapping("/api/websites/{id}")
    public WebsiteResponse get(@PathVariable UUID id) {
        return websiteService.get(id, currentUserId());
    }

    @DeleteMapping("/api/websites/{id}")
    public void remove(@PathVariable UUID id) {
        websiteService.remove(id, currentUserId());
    }

    @PostMapping("/api/websites/{id}/verify")
    public WebsiteResponse verify(@PathVariable UUID id) {
        return websiteService.verify(id, currentUserId());
    }

    @GetMapping("/api/websites/{id}/scans")
    public List<com.websentinel.scanner.dto.ScanResponse> scanHistory(@PathVariable UUID id) {
        return websiteService.scanHistory(id, currentUserId());
    }
}