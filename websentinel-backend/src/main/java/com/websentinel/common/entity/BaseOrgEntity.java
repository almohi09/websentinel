package com.websentinel.common.entity;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.FilterDef;
import org.hibernate.annotations.ParamDef;

import java.time.Instant;
import java.util.UUID;

/**
 * Base class for every organization-owned entity.
 * Carries organizationId (tenant key) + audit timestamps + soft-delete.
 * Tenant isolation is enforced via Hibernate @Filter (see TenantFilterConfig).
 */
@Getter
@Setter
@MappedSuperclass
@FilterDef(name = "tenantFilter", parameters = @ParamDef(name = "organizationId", type = UUID.class))
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
public abstract class BaseOrgEntity {

    @Column(name = "organization_id", nullable = false, updatable = false)
    private UUID organizationId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public boolean isDeleted() {
        return this.deletedAt != null;
    }
}