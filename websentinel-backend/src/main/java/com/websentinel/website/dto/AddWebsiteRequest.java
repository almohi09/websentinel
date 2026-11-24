package com.websentinel.website.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AddWebsiteRequest {
    @NotBlank(message = "URL is required")
    private String url;

    private String verificationMethod = "DNS_TXT"; // DNS_TXT | HTML_FILE | META_TAG

    // User must attest authorization over the target (PRD safety requirement)
    private boolean attestAuthorization = false;
}