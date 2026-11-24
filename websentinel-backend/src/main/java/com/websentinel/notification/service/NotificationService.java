package com.websentinel.notification.service;

import com.websentinel.notification.dto.NotificationResponse;
import com.websentinel.notification.entity.Notification;
import com.websentinel.notification.repository.NotificationRepository;
import com.websentinel.scanner.entity.Scan;
import com.websentinel.scanner.entity.ScanFinding;
import com.websentinel.website.entity.Website;
import com.websentinel.workspace.entity.OrganizationMember;
import com.websentinel.workspace.repository.OrganizationMemberRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationRepository notificationRepository;
    private final OrganizationMemberRepository memberRepository;

    @Autowired(required = false)
    private JavaMailSender mailSender;

    public NotificationService(NotificationRepository notificationRepository,
                               OrganizationMemberRepository memberRepository) {
        this.notificationRepository = notificationRepository;
        this.memberRepository = memberRepository;
    }

    @Transactional
    public Notification createNotification(UUID orgId, UUID userId, String type, String title, String message) {
        Notification n = new Notification();
        n.setOrganizationId(orgId);
        n.setUserId(userId);
        n.setType(type);
        n.setTitle(title);
        n.setMessage(message);
        n.setRead(false);
        n.setCreatedAt(Instant.now());
        return notificationRepository.save(n);
    }

    public List<NotificationResponse> getNotificationsForOrg(UUID orgId) {
        return notificationRepository.findByOrganizationIdOrderByCreatedAtDesc(orgId).stream()
            .map(this::toResponse)
            .toList();
    }

    public long getUnreadCount(UUID orgId) {
        return notificationRepository.countByOrganizationIdAndReadFalse(orgId);
    }

    @Transactional
    public boolean markAsRead(UUID id, UUID orgId) {
        Notification n = notificationRepository.findById(id).orElse(null);
        if (n != null && n.getOrganizationId().equals(orgId)) {
            n.setRead(true);
            notificationRepository.save(n);
            return true;
        }
        return false;
    }

    @Transactional
    public int markAllAsRead(UUID orgId) {
        return notificationRepository.markAllAsReadForOrg(orgId);
    }

    /**
     * Dispatches in-app notification and email alert when a security scan finishes.
     */
    @Async
    public void dispatchScanAlert(Website website, Scan scan, List<ScanFinding> findings) {
        try {
            long critical = findings.stream().filter(f -> "CRITICAL".equalsIgnoreCase(f.getSeverity())).count();
            long high = findings.stream().filter(f -> "HIGH".equalsIgnoreCase(f.getSeverity())).count();
            long medium = findings.stream().filter(f -> "MEDIUM".equalsIgnoreCase(f.getSeverity())).count();

            String type;
            String title;
            StringBuilder sb = new StringBuilder();

            if (critical > 0) {
                type = "CRITICAL_ALERT";
                title = "🚨 CRITICAL FINDING: " + website.getHost();
                sb.append(String.format("WebSentinel detected %d CRITICAL vulnerability on target '%s'.\n", critical, website.getHost()));
            } else if (high > 0) {
                type = "SECURITY_ALERT";
                title = "⚠️ High Risk Finding: " + website.getHost();
                sb.append(String.format("Scan detected %d High risk vulnerability on target '%s'.\n", high, website.getHost()));
            } else {
                type = "SCAN_COMPLETED";
                title = "✅ Scan Finalized: " + website.getHost();
                sb.append(String.format("Security scan finalized for '%s'.\n", website.getHost()));
            }

            sb.append(String.format("Summary: %d Critical, %d High, %d Medium, %d Total findings logged.\n",
                critical, high, medium, findings.size()));
            sb.append(String.format("Scan Mode: %s • Scan ID: #%s",
                scan.getScanType(), scan.getId().toString().substring(0, 8)));

            // 1. In-app notification
            createNotification(website.getOrganizationId(), null, type, title, sb.toString());
            log.info("In-app notification created for website: {} ({})", website.getHost(), type);

            // 2. Email alert (MailHog in dev)
            sendEmailSafely("security-alerts@websentinel.io", title, sb.toString());

        } catch (Exception e) {
            log.error("Failed to dispatch scan alert for scan {}: {}", scan.getId(), e.getMessage());
        }
    }

    private void sendEmailSafely(String to, String subject, String body) {
        if (mailSender == null) {
            log.debug("JavaMailSender is not configured; skipping email dispatch.");
            return;
        }
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom("alerts@websentinel.io");
            msg.setTo(to);
            msg.setSubject("[WebSentinel Alert] " + subject);
            msg.setText(body);
            mailSender.send(msg);
            log.info("Email alert dispatched to {}", to);
        } catch (Exception e) {
            log.warn("Could not dispatch email alert (MailHog might be offline): {}", e.getMessage());
        }
    }

    private NotificationResponse toResponse(Notification n) {
        NotificationResponse r = new NotificationResponse();
        r.setId(n.getId());
        r.setOrganizationId(n.getOrganizationId());
        r.setUserId(n.getUserId());
        r.setType(n.getType());
        r.setTitle(n.getTitle());
        r.setMessage(n.getMessage());
        r.setRead(n.isRead());
        r.setCreatedAt(n.getCreatedAt());
        return r;
    }
}
