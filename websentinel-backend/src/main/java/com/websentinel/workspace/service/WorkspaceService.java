package com.websentinel.workspace.service;

import com.websentinel.auth.entity.User;
import com.websentinel.auth.repository.UserRepository;
import com.websentinel.common.exception.AccessDeniedException;
import com.websentinel.common.exception.ResourceNotFoundException;
import com.websentinel.workspace.dto.*;
import com.websentinel.workspace.entity.Organization;
import com.websentinel.workspace.entity.OrganizationMember;
import com.websentinel.workspace.repository.OrganizationMemberRepository;
import com.websentinel.workspace.repository.OrganizationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class WorkspaceService {

    private final OrganizationRepository organizationRepository;
    private final OrganizationMemberRepository memberRepository;
    private final UserRepository userRepository;

    private static final Set<String> VALID_ROLES = Set.of("OWNER", "ADMIN", "MEMBER", "VIEWER");
    private static final Set<String> VALID_TYPES = Set.of("personal", "company", "client");

    public WorkspaceService(OrganizationRepository organizationRepository,
                            OrganizationMemberRepository memberRepository,
                            UserRepository userRepository) {
        this.organizationRepository = organizationRepository;
        this.memberRepository = memberRepository;
        this.userRepository = userRepository;
    }

    // ---------- helpers ----------

    private Organization getOrgOrThrow(UUID orgId) {
        return organizationRepository.findById(orgId)
            .orElseThrow(() -> new ResourceNotFoundException("Organization not found: " + orgId));
    }

    private OrganizationMember getMembershipOrThrow(UUID orgId, UUID userId) {
        return memberRepository.findByOrganizationIdAndUserId(orgId, userId)
            .orElseThrow(() -> new AccessDeniedException("You are not a member of this organization"));
    }

    private void requireRole(UUID orgId, UUID userId, Set<String> allowed) {
        OrganizationMember m = getMembershipOrThrow(orgId, userId);
        if (!allowed.contains(m.getRole())) {
            throw new AccessDeniedException("Insufficient permissions. Required: " + allowed);
        }
    }

    private boolean isOwnerOrAdmin(OrganizationMember m) {
        return "OWNER".equals(m.getRole()) || "ADMIN".equals(m.getRole());
    }

    private OrganizationResponse toOrgResponse(Organization org) {
        OrganizationResponse r = new OrganizationResponse();
        r.setId(org.getId());
        r.setName(org.getName());
        r.setType(org.getType());
        r.setOwnerId(org.getOwnerId());
        r.setCreatedAt(org.getCreatedAt());
        return r;
    }

    // ---------- create personal workspace (used by AuthService) ----------

    public Organization createPersonalWorkspace(User user) {
        Organization org = new Organization();
        org.setName(user.getFullName() + "'s Workspace");
        org.setType("personal");
        org.setOwnerId(user.getId());
        organizationRepository.save(org);

        OrganizationMember member = new OrganizationMember();
        member.setOrganizationId(org.getId());
        member.setUserId(user.getId());
        member.setRole("OWNER");
        member.setJoinedAt(Instant.now());
        memberRepository.save(member);

        return org;
    }

    // ---------- list workspaces for a user ----------

    public List<OrganizationResponse> listForUser(UUID userId) {
        List<OrganizationMember> memberships = memberRepository.findByUserId(userId);
        return memberships.stream()
            .map(m -> getOrgOrThrow(m.getOrganizationId()))
            .filter(o -> o.getDeletedAt() == null)
            .map(this::toOrgResponse)
            .collect(Collectors.toList());
    }

    // ---------- get one ----------

    public OrganizationResponse get(UUID orgId, UUID userId) {
        getMembershipOrThrow(orgId, userId); // membership check
        return toOrgResponse(getOrgOrThrow(orgId));
    }

    // ---------- create ----------

    public OrganizationResponse create(CreateOrganizationRequest req, UUID ownerId) {
        if (!VALID_TYPES.contains(req.getType())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid type: " + req.getType());
        }
        Organization org = new Organization();
        org.setName(req.getName());
        org.setType(req.getType());
        org.setOwnerId(ownerId);
        organizationRepository.save(org);

        OrganizationMember member = new OrganizationMember();
        member.setOrganizationId(org.getId());
        member.setUserId(ownerId);
        member.setRole("OWNER");
        member.setJoinedAt(Instant.now());
        memberRepository.save(member);

        return toOrgResponse(org);
    }

    // ---------- members ----------

    public List<MemberResponse> listMembers(UUID orgId, UUID userId) {
        getMembershipOrThrow(orgId, userId);
        List<OrganizationMember> members = memberRepository.findByOrganizationId(orgId);

        return members.stream().map(m -> {
            MemberResponse r = new MemberResponse();
            r.setMemberId(m.getId());
            r.setUserId(m.getUserId());
            r.setRole(m.getRole());
            r.setJoinedAt(m.getJoinedAt());
            User u = userRepository.findById(m.getUserId()).orElse(null);
            if (u != null) {
                r.setEmail(u.getEmail());
                r.setFullName(u.getFullName());
            }
            return r;
        }).collect(Collectors.toList());
    }

    public MemberResponse invite(UUID orgId, UUID requesterId, InviteMemberRequest req) {
        requireRole(orgId, requesterId, Set.of("OWNER", "ADMIN"));

        if (!VALID_ROLES.contains(req.getRole())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid role: " + req.getRole());
        }
        // cannot invite as OWNER unless requester is OWNER
        OrganizationMember requester = getMembershipOrThrow(orgId, requesterId);
        if ("OWNER".equals(req.getRole()) && !"OWNER".equals(requester.getRole())) {
            throw new AccessDeniedException("Only OWNER can invite another OWNER");
        }

        User invitee = userRepository.findByEmail(req.getEmail())
            .orElseThrow(() -> new ResourceNotFoundException("No user registered with email: " + req.getEmail()));

        // prevent duplicate
        if (memberRepository.findByOrganizationIdAndUserId(orgId, invitee.getId()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "User is already a member");
        }

        OrganizationMember member = new OrganizationMember();
        member.setOrganizationId(orgId);
        member.setUserId(invitee.getId());
        member.setRole(req.getRole());
        member.setJoinedAt(Instant.now());
        memberRepository.save(member);

        MemberResponse r = new MemberResponse();
        r.setMemberId(member.getId());
        r.setUserId(invitee.getId());
        r.setEmail(invitee.getEmail());
        r.setFullName(invitee.getFullName());
        r.setRole(member.getRole());
        r.setJoinedAt(member.getJoinedAt());
        return r;
    }

    public MemberResponse updateRole(UUID orgId, UUID requesterId, UUID memberId, UpdateMemberRoleRequest req) {
        requireRole(orgId, requesterId, Set.of("OWNER", "ADMIN"));

        if (!VALID_ROLES.contains(req.getRole())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid role: " + req.getRole());
        }

        OrganizationMember target = memberRepository.findById(memberId)
            .orElseThrow(() -> new ResourceNotFoundException("Member not found: " + memberId));
        if (!orgId.equals(target.getOrganizationId())) {
            throw new ResourceNotFoundException("Member not in this organization");
        }

        // cannot demote the owner unless requester is owner
        OrganizationMember requester = getMembershipOrThrow(orgId, requesterId);
        if ("OWNER".equals(target.getRole()) && !"OWNER".equals(requester.getRole())) {
            throw new AccessDeniedException("Only OWNER can change an OWNER's role");
        }
        if ("OWNER".equals(req.getRole()) && !"OWNER".equals(requester.getRole())) {
            throw new AccessDeniedException("Only OWNER can promote to OWNER");
        }

        target.setRole(req.getRole());
        memberRepository.save(target);

        User u = userRepository.findById(target.getUserId()).orElse(null);
        MemberResponse r = new MemberResponse();
        r.setMemberId(target.getId());
        r.setUserId(target.getUserId());
        r.setEmail(u != null ? u.getEmail() : null);
        r.setFullName(u != null ? u.getFullName() : null);
        r.setRole(target.getRole());
        r.setJoinedAt(target.getJoinedAt());
        return r;
    }

    public void removeMember(UUID orgId, UUID requesterId, UUID memberId) {
        requireRole(orgId, requesterId, Set.of("OWNER", "ADMIN"));

        OrganizationMember target = memberRepository.findById(memberId)
            .orElseThrow(() -> new ResourceNotFoundException("Member not found: " + memberId));
        if (!orgId.equals(target.getOrganizationId())) {
            throw new ResourceNotFoundException("Member not in this organization");
        }

        // cannot remove an OWNER
        if ("OWNER".equals(target.getRole())) {
            throw new AccessDeniedException("Cannot remove an OWNER. Transfer ownership first.");
        }

        // cannot remove yourself if you're the last admin? keep simple
        memberRepository.delete(target);
    }
}