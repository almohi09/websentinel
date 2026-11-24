package com.websentinel.auth.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
public class UserResponse {
    private UUID id;
    private String email;
    private String fullName;
    private boolean emailVerified;
    private Instant createdAt;
}