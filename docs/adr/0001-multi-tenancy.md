# ADR 0001 — Multi-Tenancy Strategy

- **Status:** Accepted (MVP)
- **Date:** 2026-11-24
- **Context:** PRD §3 requires organization-based multi-tenancy with strict tenant isolation.

## Decision

Use **row-level isolation**: a single shared PostgreSQL schema where every organization-owned table carries an `organization_id` column. All repository queries filter by the current request's organization context.

## Alternatives considered

1. **Schema-per-tenant** — strong isolation, but requires dynamic schema management, complicates migrations, connection pooling and backups. Overkill for MVP.
2. **Database-per-tenant** — maximum isolation, highest ops cost. Not justified until enterprise tier.

## Consequences

- (+) Simple migrations (Flyway single schema), one connection pool, easy backups.
- (+) Tenant isolation enforced in code via `BaseOrgEntity` + `TenantContext` filter.
- (-) A bug in filtering can leak data across tenants → mandatory integration tests for isolation.
- (-) Noisy-neighbor risk at scale → revisit when scan volume grows.

## Implementation rules

1. Every org-owned entity extends `BaseOrgEntity` (carries `organizationId`).
2. `TenantContext` (ThreadLocal) holds current `organizationId` extracted from JWT.
3. A Hibernate `@Filter` or Spring Data JPA Specification auto-applies `organization_id = ?` to all queries on org-owned entities.
4. Repositories expose only org-scoped methods; never a global `findAll()`.
5. Integration test: User in Org A cannot read Org B's websites/scans/findings (403/404).
6. Super Admin bypasses filter via an explicit `@WithoutTenantFilter` annotation (audited).

## Revisit trigger

When a customer requires contractual data isolation (enterprise plan) or scan volume exceeds single-DB capacity.