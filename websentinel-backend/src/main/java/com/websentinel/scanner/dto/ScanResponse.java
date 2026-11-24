package com.websentinel.scanner.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
public class ScanResponse {
    private UUID id;
    private UUID websiteId;
    private String scanType;
    private String status;
    private Instant startedAt;
    private Instant completedAt;
    private String errorMessage;
}