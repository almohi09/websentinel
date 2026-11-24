package com.websentinel.scanner.service;

import com.websentinel.common.util.TenantContext;
import com.websentinel.scanner.entity.Scan;
import com.websentinel.scanner.entity.ScanFinding;
import com.websentinel.scanner.repository.ScanFindingRepository;
import com.websentinel.scanner.repository.ScanRepository;
import com.websentinel.website.entity.Website;
import com.websentinel.website.repository.WebsiteRepository;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Component
public class ScanRunner {

    private final ScanRepository scanRepository;
    private final ScanFindingRepository findingRepository;
    private final WebsiteRepository websiteRepository;
    private final PassiveScannerService passiveScanner;
    private final ActiveScannerService activeScanner;
    private final com.websentinel.notification.service.NotificationService notificationService;

    public ScanRunner(ScanRepository scanRepository,
                      ScanFindingRepository findingRepository,
                      WebsiteRepository websiteRepository,
                      PassiveScannerService passiveScanner,
                      ActiveScannerService activeScanner,
                      com.websentinel.notification.service.NotificationService notificationService) {
        this.scanRepository = scanRepository;
        this.findingRepository = findingRepository;
        this.websiteRepository = websiteRepository;
        this.passiveScanner = passiveScanner;
        this.activeScanner = activeScanner;
        this.notificationService = notificationService;
    }

    @Async
    public void run(UUID scanId, UUID websiteId, UUID orgId) {
        TenantContext.set(orgId);
        try {
            Scan scan = scanRepository.findById(scanId).orElse(null);
            Website website = websiteRepository.findById(websiteId).orElse(null);
            if (scan == null || website == null) return;

            scan.setStatus("RUNNING");
            scan.setStartedAt(Instant.now());
            scanRepository.save(scan);

            List<PassiveScannerService.FindingDraft> drafts = new ArrayList<>(passiveScanner.scan(website));

            // If scan type is ACTIVE, also run the controlled active scanner checks
            if ("ACTIVE".equalsIgnoreCase(scan.getScanType())) {
                drafts.addAll(activeScanner.scan(website));
            }

            List<ScanFinding> savedFindings = new ArrayList<>();
            for (PassiveScannerService.FindingDraft d : drafts) {
                ScanFinding f = new ScanFinding();
                f.setOrganizationId(orgId);
                f.setScanId(scan.getId());
                f.setWebsiteId(website.getId());
                f.setTitle(d.title);
                f.setDescription(d.description);
                f.setSeverity(d.severity);
                f.setEvidence(d.evidence);
                f.setRemediation(d.remediation);
                f.setStatus("OPEN");
                f.setDetectedAt(Instant.now());
                savedFindings.add(findingRepository.save(f));
            }

            scan.setStatus("COMPLETED");
            scan.setCompletedAt(Instant.now());
            scanRepository.save(scan);

            // Dispatch in-app notification & alert
            notificationService.dispatchScanAlert(website, scan, savedFindings);
        } catch (Exception e) {
            try {
                Scan scan = scanRepository.findById(scanId).orElse(null);
                if (scan != null) {
                    scan.setStatus("FAILED");
                    scan.setErrorMessage(e.getMessage());
                    scan.setCompletedAt(Instant.now());
                    scanRepository.save(scan);
                }
            } catch (Exception ignored) {}
        } finally {
            TenantContext.clear();
        }
    }
}
