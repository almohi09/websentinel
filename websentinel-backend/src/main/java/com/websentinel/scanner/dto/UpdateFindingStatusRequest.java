package com.websentinel.scanner.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateFindingStatusRequest {
    @NotBlank
    private String status; // OPEN | IN_PROGRESS | RESOLVED | ACCEPTED_RISK
}