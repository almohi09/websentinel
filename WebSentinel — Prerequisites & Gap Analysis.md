# WebSentinel — Prerequisites & Gap Analysis

*Companion document to the WebSentinel PRD v1.0 — covers what should be in place before development starts, and gaps identified in the original PRD.*

---

## 1. Technical Knowledge Prerequisites

Before starting development, the team should be comfortable with:

- **Core Java + Java 21 features** — records, sealed classes, pattern matching, and virtual threads (useful for scanner concurrency)
- **Spring Boot ecosystem** — Spring Security (JWT/OAuth2), Spring Data JPA, Bean Validation, Spring Scheduler/Async
- **SQL + PostgreSQL** — indexing strategy, transactions, and multi-tenant schema design (row-level isolation via `organization_id`)
- **HTTP/TLS internals** — headers, cookies, certificate chains, DNS resolution — this is the core of the scanning engine
- **React fundamentals** — hooks, routing, API integration, state management (Redux Toolkit / Zustand / Context API)
- **Application security concepts** — SSRF, DNS rebinding, OWASP Top 10 — critical since WebSentinel is itself a security tool and must not become an attack vector

---

## 2. Development Environment Setup

| Tool | Purpose |
| --- | --- |
| JDK 21 | Backend runtime |
| Maven | Build tool |
| IntelliJ IDEA / VS Code | IDE |
| PostgreSQL (via Docker locally) | Database |
| Node.js + npm/yarn | Frontend tooling |
| Docker Desktop | Containerization |
| Postman / Insomnia | API testing |
| Git + GitHub account | Version control |

---

## 3. External Accounts and Services Required

The original PRD references these capabilities but does not name providers. These need to be selected before implementation:

- **Transactional email provider** — AWS SES, SendGrid, or Mailgun (needed for Module 1 email verification, Module 8 certificate-expiry and finding alerts)
- **Payment gateway** — Razorpay or Stripe (Razorpay is a natural fit given INR pricing in the PRD) for Module 9 billing
- **Cloud hosting account** — AWS (EC2/ECS for compute, RDS for PostgreSQL, S3 for storing generated PDF reports)
- **Domain and SSL certificate** — for the platform itself
- **Error tracking/monitoring** — Sentry or equivalent, for application-level error visibility beyond basic logging

---

## 4. Planning Artifacts Needed Before Coding Begins

The PRD defines *what* to build; these artifacts define *how*, and are currently missing:

- **Entity-Relationship (ER) diagram** — Section 7 of the PRD lists entity names only; columns, types, and relationships are not yet defined
- **API contract / OpenAPI spec** — Swagger is named as the documentation tool, but no endpoint list exists yet
- **Multi-tenancy design decision** — row-level isolation (shared schema + `organization_id` filtering) vs. schema-per-tenant must be decided explicitly before the first migration is written
- **Threat model** — especially for the Controlled Active Scanner, since misuse has real legal and safety implications

---

## 5. Gaps Identified in the PRD

| # | Gap | Why it matters | Recommendation |
| --- | --- | --- | --- |
| 1 | No background job infrastructure named | Module 8 requires scheduled scans; Spring alone does not scale this reliably across instances | Add Quartz Scheduler or a message queue (RabbitMQ / Amazon SQS) |
| 2 | No API-level rate limiting | Section 4's scan-level limits don't prevent general API abuse | Add Bucket4j or gateway-level throttling |
| 3 | No secrets management strategy | DB credentials, API keys need secure storage, not `.env` files in production | AWS Secrets Manager or HashiCorp Vault |
| 4 | No caching layer | Dashboard stats (Module 6) and session data will repeatedly hit Postgres | Introduce Redis |
| 5 | No CI/CD pipeline specified | GitHub is named for version control only | Add GitHub Actions for build/test/deploy automation |
| 6 | No formal legal/ToS framework | Users will be scanning websites — authorization claims need a legal record, not just technical verification | Draft Terms of Service, an explicit authorization attestation flow, and an abuse-reporting mechanism |
| 7 | No environment separation strategy | No mention of dev/staging/production separation | Define separate environments with isolated databases and credentials |
| 8 | No observability stack | Logging is mentioned, but not metrics/dashboards | Prometheus + Grafana, or AWS CloudWatch |
| 9 | No frontend testing strategy | JUnit/Mockito cover backend only | Add Jest + React Testing Library |
| 10 | No data retention / deletion policy | Scan evidence and findings may contain sensitive data | Define retention periods and a deletion workflow for closed workspaces |

---

## 6. Suggested Additions to Development Phases

These should slot into the PRD's Phase 9 (Production Readiness) and Phase 10 (SaaS Expansion):

- CI/CD pipeline setup (GitHub Actions)
- Secrets management integration
- Redis caching layer
- Observability stack setup (metrics + dashboards)
- Legal document drafting (ToS, authorization attestation)
- Data retention and deletion policy implementation

---

*This document is intended to be read alongside WebSentinel-PRD.md and does not replace it.*

## 7. Entity-Relationship Diagram (MVP Core Entities)

&#91;embedded content: ER diagram · 6 core entities, MVP scope\]

This diagram covers the core entities most relevant to the MVP (Users, Organizations, Org\_Members, Websites, Scans, Scan\_Findings). Billing and notification tables are omitted here for clarity but remain listed separately in the base PRD.

## 8. API Endpoint List (Draft)

A first-pass REST endpoint list to formalize as an OpenAPI/Swagger spec before coding begins.

### Authentication

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | /api/auth/register | Register a new user |
| POST | /api/auth/login | Authenticate and issue tokens |
| POST | /api/auth/logout | Invalidate session/tokens |
| POST | /api/auth/verify-email | Confirm email verification token |
| POST | /api/auth/forgot-password | Request password reset |
| POST | /api/auth/reset-password | Reset password with token |
| GET | /api/users/me | Get current user profile |
| PUT | /api/users/me | Update current user profile |

### Workspace Management

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | /api/organizations | Create a new organization/workspace |
| GET | /api/organizations | List organizations the user belongs to |
| GET | /api/organizations/{orgId} | Get organization details |
| PUT | /api/organizations/{orgId} | Update organization details |
| POST | /api/organizations/{orgId}/invite | Invite a member |
| GET | /api/organizations/{orgId}/members | List members |
| PUT | /api/organizations/{orgId}/members/{memberId} | Update a member's role |
| DELETE | /api/organizations/{orgId}/members/{memberId} | Remove a member |

### Website Management

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | /api/organizations/{orgId}/websites | Add a website to an organization |
| GET | /api/organizations/{orgId}/websites | List an organization's websites |
| GET | /api/websites/{websiteId} | Get website details |
| DELETE | /api/websites/{websiteId} | Remove a website |
| POST | /api/websites/{websiteId}/verify | Trigger ownership verification |
| GET | /api/websites/{websiteId}/scans | List scan history for a website |

### Security Scanner

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | /api/websites/{websiteId}/scans | Start a new scan |
| GET | /api/scans/{scanId} | Get scan details and results |
| GET | /api/scans/{scanId}/status | Get scan execution status |

### Findings Management

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | /api/scans/{scanId}/findings | List findings for a scan |
| GET | /api/findings/{findingId} | Get a single finding's details |
| PUT | /api/findings/{findingId}/status | Update a finding's status |

## 9. Recommended Project Structure (Backend)

Following the PRD's architecture decision (Section 6: modular monolith, not microservices), the backend should be organized by feature module rather than by technical layer, so each module stays self-contained and could later be peeled off into its own service if needed.

```
websentinel-backend/
├── pom.xml
├── src/main/java/com/websentinel/
│   ├── WebSentinelApplication.java
│   │
│   ├── common/                 # shared utilities, base entities, exceptions
│   │   ├── exception/
│   │   ├── dto/
│   │   └── util/
│   │
│   ├── config/                 # Spring configuration beans
│   │   ├── SecurityConfig.java
│   │   ├── SwaggerConfig.java
│   │   └── WebClientConfig.java
│   │
│   ├── auth/                   # Module 1 — Authentication
│   │   ├── controller/
│   │   ├── service/
│   │   ├── repository/
│   │   ├── entity/
│   │   └── dto/
│   │
│   ├── workspace/               # Module 2 — Workspace Management
│   │   ├── controller/
│   │   ├── service/
│   │   ├── repository/
│   │   ├── entity/              # Organization, OrganizationMember
│   │   └── dto/
│   │
│   ├── website/                 # Module 3 — Website Management
│   │   ├── controller/
│   │   ├── service/
│   │   ├── repository/
│   │   ├── entity/
│   │   └── dto/
│   │
│   ├── scanner/                 # Module 4 — Security Scanner
│   │   ├── controller/
│   │   ├── service/
│   │   │   ├── passive/         # TLS, headers, cookies, DNS checks
│   │   │   └── active/          # disabled until safety controls pass
│   │   ├── repository/
│   │   ├── entity/
│   │   └── dto/
│   │
│   ├── finding/                 # Module 5 — Findings Management
│   │   ├── controller/
│   │   ├── service/
│   │   ├── repository/
│   │   ├── entity/
│   │   └── dto/
│   │
│   ├── dashboard/                # Module 6 — Dashboard
│   ├── report/                   # Module 7 — Reports (PDF generation)
│   ├── notification/             # Module 8 — Monitoring and Notifications
│   ├── billing/                  # Module 9 — Subscription and Billing
│   └── superadmin/               # Module 10 — Super Admin
│
└── src/test/java/com/websentinel/   # mirrors main structure, one test package per module
```

### Why module-first, not layer-first

A layer-first structure (one giant `controller/`, one giant `service/` package for the whole app) gets harder to navigate as modules grow and makes it unclear which code belongs to which feature. Module-first keeps each feature's controller, service, repository and entities together, and sets up the codebase to be split into separate services later (Section 6 of the PRD notes the scanner may become a background worker eventually) without a large restructuring effort.

### Cross-module rule

Every entity that belongs to an organization (websites, scans, findings, etc.) should extend a common base entity carrying `organizationId`, and every repository query touching such an entity must filter by the current request's organization context — this is where tenant isolation (PRD Section 3) actually gets enforced in code, not just assumed at the API layer.
