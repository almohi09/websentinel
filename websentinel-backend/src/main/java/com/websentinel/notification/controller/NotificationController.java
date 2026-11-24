package com.websentinel.notification.controller;

import com.websentinel.common.exception.AccessDeniedException;
import com.websentinel.notification.dto.NotificationResponse;
import com.websentinel.notification.service.NotificationService;
import com.websentinel.workspace.repository.OrganizationMemberRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/organizations/{orgId}/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final OrganizationMemberRepository memberRepository;

    public NotificationController(NotificationService notificationService,
                                  OrganizationMemberRepository memberRepository) {
        this.notificationService = notificationService;
        this.memberRepository = memberRepository;
    }

    private UUID currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (UUID) auth.getPrincipal();
    }

    private void requireMembership(UUID orgId) {
        UUID userId = currentUserId();
        memberRepository.findByOrganizationIdAndUserId(orgId, userId)
            .orElseThrow(() -> new AccessDeniedException("You are not a member of this organization"));
    }

    @GetMapping
    public List<NotificationResponse> list(@PathVariable UUID orgId) {
        requireMembership(orgId);
        return notificationService.getNotificationsForOrg(orgId);
    }

    @GetMapping("/unread-count")
    public Map<String, Long> unreadCount(@PathVariable UUID orgId) {
        requireMembership(orgId);
        return Map.of("unreadCount", notificationService.getUnreadCount(orgId));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markRead(@PathVariable UUID orgId, @PathVariable UUID id) {
        requireMembership(orgId);
        boolean updated = notificationService.markAsRead(id, orgId);
        return updated ? ResponseEntity.ok().build() : ResponseEntity.notFound().build();
    }

    @PutMapping("/read-all")
    public Map<String, Integer> markAllRead(@PathVariable UUID orgId) {
        requireMembership(orgId);
        int updated = notificationService.markAllAsRead(orgId);
        return Map.of("updatedCount", updated);
    }
}
