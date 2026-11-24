package com.websentinel.scanner.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
public class FindingResponse {
    private UUID id;
    private UUID scanId;
    private UUID websiteId;
    private String title;
    private String description;
    private String severity;
    private String evidence;
    private String remediation;
    private String status;
    private Instant detectedAt;
}