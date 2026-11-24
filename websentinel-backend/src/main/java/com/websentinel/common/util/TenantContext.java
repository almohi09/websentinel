package com.websentinel.common.util;

import java.util.UUID;

/**
 * Holds the current request's organization (tenant) id in a ThreadLocal.
 * Set by JwtAuthFilter, cleared after request. Used by TenantFilterAspect
 * to apply Hibernate tenant filter on the EntityManager.
 */
public final class TenantContext {

    private static final ThreadLocal<UUID> CURRENT_ORG = new ThreadLocal<>();

    private TenantContext() {}

    public static void set(UUID organizationId) {
        CURRENT_ORG.set(organizationId);
    }

    public static UUID get() {
        return CURRENT_ORG.get();
    }

    public static void clear() {
        CURRENT_ORG.remove();
    }

    public static boolean isSet() {
        return CURRENT_ORG.get() != null;
    }
}