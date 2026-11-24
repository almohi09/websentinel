package com.websentinel.scanner.service;

import com.websentinel.common.exception.AccessDeniedException;
import com.websentinel.common.exception.ResourceNotFoundException;
import com.websentinel.scanner.dto.ScanResponse;
import com.websentinel.scanner.entity.Scan;
import com.websentinel.scanner.repository.ScanFindingRepository;
import com.websentinel.scanner.repository.ScanRepository;
import com.websentinel.website.entity.Website;
import com.websentinel.website.repository.WebsiteRepository;
import com.websentinel.workspace.repository.OrganizationMemberRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class ScanService {

    private final WebsiteRepository websiteRepository;
    private final ScanRepository scanRepository;
    private final ScanFindingRepository findingRepository;
    private final OrganizationMemberRepository memberRepository;
    private final ScanRunner scanRunner;

    public ScanService(WebsiteRepository websiteRepository,
                       ScanRepository scanRepository,
                       ScanFindingRepository findingRepository,
                       OrganizationMemberRepository memberRepository,
                       ScanRunner scanRunner) {
        this.websiteRepository = websiteRepository;
        this.scanRepository = scanRepository;
        this.findingRepository = findingRepository;
        this.memberRepository = memberRepository;
        this.scanRunner = scanRunner;
    }

    private void requireMembership(UUID orgId, UUID userId) {
        memberRepository.findByOrganizationIdAndUserId(orgId, userId)
            .orElseThrow(() -> new AccessDeniedException("You are not a member of this organization"));
    }

    public Scan startScan(UUID websiteId, UUID userId) {
        return startScan(websiteId, "PASSIVE", userId);
    }

    public Scan startScan(UUID websiteId, String scanType, UUID userId) {
        Website website = websiteRepository.findById(websiteId)
            .orElseThrow(() -> new ResourceNotFoundException("Website not found: " + websiteId));
        requireMembership(website.getOrganizationId(), userId);

        if (website.getDeletedAt() != null) {
            throw new ResourceNotFoundException("Website not found: " + websiteId);
        }
        if (!website.isVerified()) {
            throw new ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST,
                "Website must be verified before scanning");
        }

        String normalizedType = (scanType != null && scanType.equalsIgnoreCase("ACTIVE")) ? "ACTIVE" : "PASSIVE";

        Scan scan = new Scan();
        scan.setOrganizationId(website.getOrganizationId());
        scan.setWebsiteId(websiteId);
        scan.setScanType(normalizedType);
        scan.setStatus("PENDING");
        scanRepository.save(scan);

        scanRunner.run(scan.getId(), website.getId(), website.getOrganizationId());
        return scan;
    }

    public ScanResponse getScan(UUID scanId, UUID userId) {
        Scan scan = scanRepository.findById(scanId)
            .orElseThrow(() -> new ResourceNotFoundException("Scan not found: " + scanId));
        Website website = websiteRepository.findById(scan.getWebsiteId())
            .orElseThrow(() -> new ResourceNotFoundException("Website not found"));
        requireMembership(website.getOrganizationId(), userId);
        return toResponse(scan);
    }

    public String getStatus(UUID scanId, UUID userId) {
        Scan scan = scanRepository.findById(scanId)
            .orElseThrow(() -> new ResourceNotFoundException("Scan not found: " + scanId));
        Website website = websiteRepository.findById(scan.getWebsiteId())
            .orElseThrow(() -> new ResourceNotFoundException("Website not found"));
        requireMembership(website.getOrganizationId(), userId);
        return scan.getStatus();
    }

    public List<com.websentinel.scanner.dto.FindingResponse> getFindings(UUID scanId, UUID userId) {
        Scan scan = scanRepository.findById(scanId)
            .orElseThrow(() -> new ResourceNotFoundException("Scan not found: " + scanId));
        Website website = websiteRepository.findById(scan.getWebsiteId())
            .orElseThrow(() -> new ResourceNotFoundException("Website not found"));
        requireMembership(website.getOrganizationId(), userId);
        return findingRepository.findByScanId(scanId).stream().map(f -> {
            com.websentinel.scanner.dto.FindingResponse r = new com.websentinel.scanner.dto.FindingResponse();
            r.setId(f.getId());
            r.setScanId(f.getScanId());
            r.setWebsiteId(f.getWebsiteId());
            r.setTitle(f.getTitle());
            r.setDescription(f.getDescription());
            r.setSeverity(f.getSeverity());
            r.setEvidence(f.getEvidence());
            r.setRemediation(f.getRemediation());
            r.setStatus(f.getStatus());
            r.setDetectedAt(f.getDetectedAt());
            return r;
        }).collect(java.util.stream.Collectors.toList());
    }

    public List<ScanResponse> listForWebsite(UUID websiteId, UUID userId) {
        Website website = websiteRepository.findById(websiteId)
            .orElseThrow(() -> new ResourceNotFoundException("Website not found: " + websiteId));
        requireMembership(website.getOrganizationId(), userId);
        return scanRepository.findByWebsiteId(websiteId).stream()
            .map(this::toResponse).collect(java.util.stream.Collectors.toList());
    }

    private ScanResponse toResponse(Scan s) {
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