package com.websentinel.scanner.entity;

import com.websentinel.common.entity.BaseOrgEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "scan_findings")
@Getter
@Setter
@NoArgsConstructor
public class ScanFinding extends BaseOrgEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "scan_id", nullable = false)
    private UUID scanId;

    @Column(name = "website_id", nullable = false)
    private UUID websiteId;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String severity; // CRITICAL | HIGH | MEDIUM | LOW | INFORMATIONAL

    @Column(columnDefinition = "TEXT")
    private String evidence;

    @Column(columnDefinition = "TEXT")
    private String remediation;

    @Column(nullable = false)
    private String status = "OPEN"; // OPEN | IN_PROGRESS | RESOLVED | ACCEPTED_RISK

    @Column(name = "detected_at", nullable = false)
    private Instant detectedAt;

    @Column(name = "resolved_at")
    private Instant resolvedAt;
}