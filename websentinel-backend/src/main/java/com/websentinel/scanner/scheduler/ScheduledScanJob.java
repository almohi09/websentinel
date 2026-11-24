package com.websentinel.scanner.scheduler;

import com.websentinel.scanner.entity.Scan;
import com.websentinel.scanner.repository.ScanRepository;
import com.websentinel.scanner.service.ScanRunner;
import com.websentinel.website.entity.Website;
import com.websentinel.website.repository.WebsiteRepository;
import org.quartz.DisallowConcurrentExecution;
import org.quartz.Job;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@DisallowConcurrentExecution
public class ScheduledScanJob implements Job {

    private static final Logger log = LoggerFactory.getLogger(ScheduledScanJob.class);

    private final WebsiteRepository websiteRepository;
    private final ScanRepository scanRepository;
    private final ScanRunner scanRunner;

    public ScheduledScanJob(WebsiteRepository websiteRepository,
                            ScanRepository scanRepository,
                            ScanRunner scanRunner) {
        this.websiteRepository = websiteRepository;
        this.scanRepository = scanRepository;
        this.scanRunner = scanRunner;
    }

    @Override
    public void execute(JobExecutionContext context) throws JobExecutionException {
        log.info("Executing Quartz ScheduledScanJob for all active verified fleet targets...");
        try {
            List<Website> targets = websiteRepository.findAll().stream()
                .filter(w -> w.isVerified() && w.getDeletedAt() == null)
                .toList();

            log.info("Found {} verified targets eligible for scheduled security scan", targets.size());

            for (Website website : targets) {
                try {
                    log.info("Launching scheduled automated scan for target: {}", website.getHost());
                    Scan scan = new Scan();
                    scan.setOrganizationId(website.getOrganizationId());
                    scan.setWebsiteId(website.getId());
                    scan.setScanType("PASSIVE");
                    scan.setStatus("PENDING");
                    scanRepository.save(scan);

                    scanRunner.run(scan.getId(), website.getId(), website.getOrganizationId());
                } catch (Exception e) {
                    log.error("Failed to run scheduled scan on target {}: {}", website.getHost(), e.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("Error executing ScheduledScanJob", e);
            throw new JobExecutionException(e);
        }
    }
}
