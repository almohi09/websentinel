package com.websentinel.workspace.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateMemberRoleRequest {
    @NotBlank
    private String role; // OWNER | ADMIN | MEMBER | VIEWER
}