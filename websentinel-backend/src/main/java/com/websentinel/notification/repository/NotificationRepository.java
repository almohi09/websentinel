package com.websentinel.notification.repository;

import com.websentinel.notification.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    List<Notification> findByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);

    List<Notification> findByUserIdOrderByCreatedAtDesc(UUID userId);

    long countByOrganizationIdAndReadFalse(UUID organizationId);

    long countByUserIdAndReadFalse(UUID userId);

    @Modifying
    @Query("UPDATE Notification n SET n.read = true WHERE n.organizationId = :orgId AND n.read = false")
    int markAllAsReadForOrg(@Param("orgId") UUID orgId);
}
