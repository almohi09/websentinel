package com.websentinel.website.repository;

import com.websentinel.website.entity.Website;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface WebsiteRepository extends JpaRepository<Website, UUID> {
    List<Website> findByOrganizationId(UUID organizationId);
    List<Website> findByOrganizationIdAndDeletedAtIsNull(UUID organizationId);
}