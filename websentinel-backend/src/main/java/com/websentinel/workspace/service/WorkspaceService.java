package com.websentinel.workspace.service;

import com.websentinel.auth.entity.User;
import com.websentinel.workspace.entity.Organization;
import com.websentinel.workspace.entity.OrganizationMember;
import com.websentinel.workspace.repository.OrganizationMemberRepository;
import com.websentinel.workspace.repository.OrganizationRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Service
public class WorkspaceService {

    private final OrganizationRepository organizationRepository;
    private final OrganizationMemberRepository memberRepository;

    public WorkspaceService(OrganizationRepository organizationRepository,
                            OrganizationMemberRepository memberRepository) {
        this.organizationRepository = organizationRepository;
        this.memberRepository = memberRepository;
    }

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
}