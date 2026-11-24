package com.websentinel.scanner.repository;

import com.websentinel.scanner.entity.ScanFinding;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ScanFindingRepository extends JpaRepository<ScanFinding, UUID> {
    List<ScanFinding> findByScanId(UUID scanId);
    List<ScanFinding> findByWebsiteId(UUID websiteId);
}