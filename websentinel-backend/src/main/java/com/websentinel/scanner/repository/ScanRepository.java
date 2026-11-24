package com.websentinel.scanner.repository;

import com.websentinel.scanner.entity.Scan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ScanRepository extends JpaRepository<Scan, UUID> {
    List<Scan> findByWebsiteId(UUID websiteId);
    List<Scan> findByOrganizationId(UUID organizationId);
}