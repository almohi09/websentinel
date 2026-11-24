package com.websentinel.workspace.entity;

import com.websentinel.common.entity.BaseOrgEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "organization_members")
@Getter
@Setter
@NoArgsConstructor
public class OrganizationMember extends BaseOrgEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false)
    private String role; // OWNER | ADMIN | MEMBER | VIEWER

    @Column(name = "invited_at", nullable = false, updatable = false)
    private Instant invitedAt;

    @Column(name = "joined_at")
    private Instant joinedAt;

    @PrePersist
    protected void onCreate() {
        super.onCreate();
        if (this.invitedAt == null) this.invitedAt = Instant.now();
    }
}