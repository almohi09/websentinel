package com.websentinel.workspace.controller;

import com.websentinel.workspace.dto.*;
import com.websentinel.workspace.service.WorkspaceService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/organizations")
public class WorkspaceController {

    private final WorkspaceService workspaceService;

    public WorkspaceController(WorkspaceService workspaceService) {
        this.workspaceService = workspaceService;
    }

    private UUID currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (UUID) auth.getPrincipal();
    }

    @GetMapping
    public List<OrganizationResponse> list() {
        return workspaceService.listForUser(currentUserId());
    }

    @PostMapping
    public OrganizationResponse create(@Valid @RequestBody CreateOrganizationRequest req) {
        return workspaceService.create(req, currentUserId());
    }

    @GetMapping("/{orgId}")
    public OrganizationResponse get(@PathVariable UUID orgId) {
        return workspaceService.get(orgId, currentUserId());
    }

    @GetMapping("/{orgId}/members")
    public List<MemberResponse> listMembers(@PathVariable UUID orgId) {
        return workspaceService.listMembers(orgId, currentUserId());
    }

    @PostMapping("/{orgId}/invite")
    public MemberResponse invite(@PathVariable UUID orgId, @Valid @RequestBody InviteMemberRequest req) {
        return workspaceService.invite(orgId, currentUserId(), req);
    }

    @PutMapping("/{orgId}/members/{memberId}")
    public MemberResponse updateRole(@PathVariable UUID orgId,
                                    @PathVariable UUID memberId,
                                    @Valid @RequestBody UpdateMemberRoleRequest req) {
        return workspaceService.updateRole(orgId, currentUserId(), memberId, req);
    }

    @DeleteMapping("/{orgId}/members/{memberId}")
    public void removeMember(@PathVariable UUID orgId, @PathVariable UUID memberId) {
        workspaceService.removeMember(orgId, currentUserId(), memberId);
    }
}