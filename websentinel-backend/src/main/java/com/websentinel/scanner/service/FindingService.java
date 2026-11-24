package com.websentinel.scanner.service;

import com.websentinel.common.exception.AccessDeniedException;
import com.websentinel.common.exception.ResourceNotFoundException;
import com.websentinel.scanner.dto.FindingResponse;
import com.websentinel.scanner.entity.Scan;
import com.websentinel.scanner.entity.ScanFinding;
import com.websentinel.scanner.repository.ScanFindingRepository;
import com.websentinel.scanner.repository.ScanRepository;
import com.websentinel.website.entity.Website;
import com.websentinel.website.repository.WebsiteRepository;
import com.websentinel.workspace.repository.OrganizationMemberRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Set;
import java.util.UUID;

@Service
public class FindingService {

    private final ScanFindingRepository findingRepository;
    private final ScanRepository scanRepository;
    private final WebsiteRepository websiteRepository;
    private final OrganizationMemberRepository memberRepository;

    private static final Set<String> VALID_STATUSES = Set.of("OPEN", "IN_PROGRESS", "RESOLVED", "ACCEPTED_RISK");

    public FindingService(ScanFindingRepository findingRepository,
                          ScanRepository scanRepository,
                          WebsiteRepository websiteRepository,
                          OrganizationMemberRepository memberRepository) {
        this.findingRepository = findingRepository;
        this.scanRepository = scanRepository;
        this.websiteRepository = websiteRepository;
        this.memberRepository = memberRepository;
    }

    public FindingResponse updateStatus(UUID findingId, UUID userId, String status) {
        if (!VALID_STATUSES.contains(status)) {
            throw new ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST,
                "Invalid status: " + status + ". Allowed: " + VALID_STATUSES);
        }

        ScanFinding finding = findingRepository.findById(findingId)
            .orElseThrow(() -> new ResourceNotFoundException("Finding not found: " + findingId));

        Scan scan = scanRepository.findById(finding.getScanId())
            .orElseThrow(() -> new ResourceNotFoundException("Scan not found"));
        Website website = websiteRepository.findById(scan.getWebsiteId())
            .orElseThrow(() -> new ResourceNotFoundException("Website not found"));

        memberRepository.findByOrganizationIdAndUserId(website.getOrganizationId(), userId)
            .orElseThrow(() -> new AccessDeniedException("You are not a member of this organization"));

        finding.setStatus(status);
        if ("RESOLVED".equals(status) || "ACCEPTED_RISK".equals(status)) {
            finding.setResolvedAt(java.time.Instant.now());
        } else {
            finding.setResolvedAt(null);
        }
        findingRepository.save(finding);

        FindingResponse r = new FindingResponse();
        r.setId(finding.getId());
        r.setScanId(finding.getScanId());
        r.setWebsiteId(finding.getWebsiteId());
        r.setTitle(finding.getTitle());
        r.setDescription(finding.getDescription());
        r.setSeverity(finding.getSeverity());
        r.setEvidence(finding.getEvidence());
        r.setRemediation(finding.getRemediation());
        r.setStatus(finding.getStatus());
        r.setDetectedAt(finding.getDetectedAt());
        return r;
    }

    public FindingResponse get(UUID findingId, UUID userId) {
        ScanFinding finding = findingRepository.findById(findingId)
            .orElseThrow(() -> new ResourceNotFoundException("Finding not found: " + findingId));
        Scan scan = scanRepository.findById(finding.getScanId())
            .orElseThrow(() -> new ResourceNotFoundException("Scan not found"));
        Website website = websiteRepository.findById(scan.getWebsiteId())
            .orElseThrow(() -> new ResourceNotFoundException("Website not found"));
        memberRepository.findByOrganizationIdAndUserId(website.getOrganizationId(), userId)
            .orElseThrow(() -> new AccessDeniedException("You are not a member of this organization"));

        FindingResponse r = new FindingResponse();
        r.setId(finding.getId());
        r.setScanId(finding.getScanId());
        r.setWebsiteId(finding.getWebsiteId());
        r.setTitle(finding.getTitle());
        r.setDescription(finding.getDescription());
        r.setSeverity(finding.getSeverity());
        r.setEvidence(finding.getEvidence());
        r.setRemediation(finding.getRemediation());
        r.setStatus(finding.getStatus());
        r.setDetectedAt(finding.getDetectedAt());
        return r;
    }
}