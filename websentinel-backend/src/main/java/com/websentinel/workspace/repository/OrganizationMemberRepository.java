package com.websentinel.workspace.repository;

import com.websentinel.workspace.entity.OrganizationMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrganizationMemberRepository extends JpaRepository<OrganizationMember, UUID> {
    List<OrganizationMember> findByUserId(UUID userId);
    Optional<OrganizationMember> findByOrganizationIdAndUserId(UUID organizationId, UUID userId);
}