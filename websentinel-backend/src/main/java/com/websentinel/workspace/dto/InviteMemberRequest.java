package com.websentinel.workspace.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class InviteMemberRequest {
    @NotBlank
    @Email
    private String email;

    @NotBlank
    private String role; // OWNER | ADMIN | MEMBER | VIEWER
}