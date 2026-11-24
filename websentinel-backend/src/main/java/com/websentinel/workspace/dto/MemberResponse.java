package com.websentinel.workspace.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
public class MemberResponse {
    private UUID memberId;
    private UUID userId;
    private String email;
    private String fullName;
    private String role;
    private Instant joinedAt;
}