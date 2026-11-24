package com.websentinel.workspace.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateOrganizationRequest {
    @NotBlank(message = "Name is required")
    private String name;

    private String type = "company"; // personal | company | client
}