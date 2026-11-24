package com.websentinel.workspace.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
public class OrganizationResponse {
    private UUID id;
    private String name;
    private String type;
    private UUID ownerId;
    private Instant createdAt;
}