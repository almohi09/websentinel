package com.websentinel.scanner.controller;

import com.websentinel.common.exception.AccessDeniedException;
import com.websentinel.scanner.entity.Scan;
import com.websentinel.scanner.repository.ScanRepository;
import com.websentinel.scanner.service.ScanRunner;
import com.websentinel.website.entity.Website;
import com.websentinel.website.repository.WebsiteRepository;
import com.websentinel.workspace.repository.OrganizationMemberRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/organizations/{orgId}/monitoring")
public class MonitoringController {

    private final WebsiteRepository websiteRepository;
    private final ScanRepository scanRepository;
    private final ScanRunner scanRunner;
    private final OrganizationMemberRepository memberRepository;

    public MonitoringController(WebsiteRepository websiteRepository,
                                ScanRepository scanRepository,
                                ScanRunner scanRunner,
                                OrganizationMemberRepository memberRepository) {
        this.websiteRepository = websiteRepository;
        this.scanRepository = scanRepository;
        this.scanRunner = scanRunner;
        this.memberRepository = memberRepository;
    }

    private UUID currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (UUID) auth.getPrincipal();
    }

    private void requireMembership(UUID orgId) {
        UUID userId = currentUserId();
        memberRepository.findByOrganizationIdAndUserId(orgId, userId)
            .orElseThrow(() -> new AccessDeniedException("You are not a member of this organization"));
    }

    @PostMapping("/trigger-now")
    public Map<String, Object> triggerBatchMonitoring(@PathVariable UUID orgId) {
        requireMembership(orgId);

        List<Website> verified = websiteRepository.findAll().stream()
            .filter(w -> w.getOrganizationId().equals(orgId) && w.isVerified() && w.getDeletedAt() == null)
            .toList();

        List<String> triggeredScanIds = new ArrayList<>();

        for (Website w : verified) {
            Scan scan = new Scan();
            scan.setOrganizationId(orgId);
            scan.setWebsiteId(w.getId());
            scan.setScanType("PASSIVE");
            scan.setStatus("PENDING");
            scanRepository.save(scan);

            scanRunner.run(scan.getId(), w.getId(), orgId);
            triggeredScanIds.add(scan.getId().toString());
        }

        return Map.of(
            "status", "DISPATCHED",
            "triggeredCount", triggeredScanIds.size(),
            "scanIds", triggeredScanIds,
            "message", String.format("Automated monitoring triggered for %d verified targets in workspace.", triggeredScanIds.size())
        );
    }

    @GetMapping("/status")
    public Map<String, Object> getMonitoringStatus(@PathVariable UUID orgId) {
        requireMembership(orgId);

        List<Website> websites = websiteRepository.findAll().stream()
            .filter(w -> w.getOrganizationId().equals(orgId) && w.getDeletedAt() == null)
            .toList();

        long verifiedCount = websites.stream().filter(Website::isVerified).count();

        return Map.of(
            "organizationId", orgId,
            "totalTargets", websites.size(),
            "verifiedTargets", verifiedCount,
            "cadence", "DAILY_0200_UTC",
            "engine", "QUARTZ_JDBC_CLUSTER"
        );
    }
}
