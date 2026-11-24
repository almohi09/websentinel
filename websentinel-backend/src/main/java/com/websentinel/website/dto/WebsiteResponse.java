package com.websentinel.website.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
public class WebsiteResponse {
    private UUID id;
    private String url;
    private String host;
    private String verificationMethod;
    private boolean verified;
    private Instant verifiedAt;
    private String verificationToken;
    private boolean authorizationAttested;
    private Instant createdAt;
}