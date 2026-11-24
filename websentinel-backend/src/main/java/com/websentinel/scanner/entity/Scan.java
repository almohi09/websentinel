package com.websentinel.scanner.entity;

import com.websentinel.common.entity.BaseOrgEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "scans")
@Getter
@Setter
@NoArgsConstructor
public class Scan extends BaseOrgEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "website_id", nullable = false)
    private UUID websiteId;

    @Column(name = "scan_type", nullable = false)
    private String scanType; // PASSIVE | ACTIVE

    @Column(nullable = false)
    private String status; // PENDING | RUNNING | COMPLETED | FAILED | CANCELLED

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;
}