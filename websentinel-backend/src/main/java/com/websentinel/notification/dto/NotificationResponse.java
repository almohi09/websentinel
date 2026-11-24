package com.websentinel.notification.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
public class NotificationResponse {
    private UUID id;
    private UUID organizationId;
    private UUID userId;
    private String type;
    private String title;
    private String message;
    private boolean read;
    private Instant createdAt;
}
