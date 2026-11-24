# WebSentinel — Product Requirements Document

| | |
|---|---|
| **Version** | 1.0 |
| **Status** | Finalized for initial development |
| **Product Type** | Multi-tenant SaaS Web Application |
| **Backend** | Java 21 + Spring Boot |
| **Frontend** | React |
| **Database** | PostgreSQL |

---

## 1. Product Overview

WebSentinel is a SaaS-based website security assessment and monitoring platform.

It allows individuals, freelancers, developers and companies to register websites they own or are authorized to assess, run security scans, identify potential vulnerabilities, understand security risks and receive remediation recommendations.

The platform will support both passive and controlled active security assessments.

### Product Vision

Make website security assessment accessible to individuals and organizations through a centralized, easy-to-use platform.

### Core Value Proposition

- Identify website security weaknesses.
- Monitor security configuration.
- Detect potential vulnerabilities.
- Track findings and remediation.
- Generate security reports.
- Manage multiple websites from one workspace.

---

## 2. Target Audience

WebSentinel will support three primary customer groups.

| Audience | Primary use case |
|---|---|
| Individuals and developers | Assess personal and portfolio websites |
| Freelancers and agencies | Manage and assess client websites |
| Companies | Manage website security across teams and projects |

The architecture must support both individual customers and larger organizations without requiring separate applications.

---

## 3. Account and Workspace Architecture

WebSentinel will use an organization-based multi-tenant architecture.

Every customer operates within a workspace.

An individual customer receives a personal workspace automatically during registration. Freelancers can create additional workspaces for clients, while companies can create workspaces for their teams.

### Roles

- Owner
- Admin
- Member
- Viewer
- Platform Super Admin

### Requirements

- Users can belong to multiple organizations.
- Each organization manages its own websites and scans.
- Organization members receive role-based permissions.
- Customer data must remain isolated between organizations.
- All organization-owned resources must enforce tenant authorization.

---

## 4. Scanning Strategy

WebSentinel will support two scanning categories.

### A. Passive Security Scanning

Passive scanning analyzes normal HTTP responses, TLS information and DNS configuration without attempting to exploit vulnerabilities.

**Initial checks:**

- HTTPS availability.
- SSL/TLS certificate validity.
- Certificate expiry.
- HTTP security headers.
- Content Security Policy.
- HSTS configuration.
- X-Content-Type-Options.
- X-Frame-Options.
- Cookie security attributes.
- Server information disclosure.
- Basic DNS configuration checks.
- HTTP response configuration.

### B. Controlled Active Security Scanning

Active scanning will perform explicitly authorized, non-destructive tests to identify additional weaknesses.

**Potential future checks:**

- Safe HTTP method testing.
- Non-destructive endpoint and resource checks.
- Security misconfiguration validation.
- Controlled authentication and access-control checks where test accounts are explicitly supplied.
- Carefully rate-limited input-validation checks using harmless test values.

Active scanning must not include destructive actions, denial-of-service testing, credential attacks, arbitrary code execution, or exploitation of third-party systems.

Advanced penetration-testing functionality is outside the initial product scope.

### Scanning Safety Requirements

Before any scan:

1. The user must establish authorization over the target.
2. The target URL must be validated.
3. Private, loopback, link-local and reserved IP ranges must be blocked.
4. Cloud metadata endpoints must be blocked.
5. DNS resolution and DNS rebinding protections must be implemented.
6. Every redirect destination must be revalidated.
7. Connection and response timeouts must be enforced.
8. Request rates, response sizes and scan duration must be limited.
9. Scan activity must be logged.
10. Users must not be able to use WebSentinel as an unrestricted network proxy.

> **Active scanning must remain disabled until its safety controls have been implemented and tested.**

---

## 5. Functional Modules

### Module 1 — Authentication

- Registration.
- Login and logout.
- Email verification.
- Password reset.
- Profile management.
- Secure authentication.
- Role-based authorization.

### Module 2 — Workspace Management

- Automatic personal workspace creation.
- Create company or client workspaces.
- Invite members.
- Manage roles.
- Switch workspaces.
- Remove members.

### Module 3 — Website Management

- Add website.
- Validate URL.
- Verify ownership using DNS TXT, HTML file or meta tag.
- View website details.
- Remove website.
- View scan history.

### Module 4 — Security Scanner

- Passive scanning.
- Controlled active scanning.
- TLS assessment.
- HTTP header analysis.
- Cookie analysis.
- DNS configuration checks.
- Scan status and execution history.

### Module 5 — Findings Management

Each finding must contain:

- Title.
- Description.
- Severity.
- Affected website.
- Detection date.
- Evidence.
- Remediation instructions.
- Finding status.

**Severity levels:**

- Critical
- High
- Medium
- Low
- Informational

**Finding statuses:**

- Open
- In Progress
- Resolved
- Accepted Risk

### Module 6 — Dashboard

- Total websites.
- Total scans.
- Scan success and failure statistics.
- Overall security overview.
- Risk distribution.
- Latest findings.
- Websites requiring attention.

### Module 7 — Reports

- PDF report generation.
- Website information.
- Scan date.
- Security score.
- Findings.
- Remediation recommendations.
- Report download.

### Module 8 — Monitoring and Notifications

- Scheduled scans.
- Certificate expiry notifications.
- New finding alerts.
- Resolved finding notifications.
- Email notifications.

### Module 9 — Subscription and Billing

- Free and paid plans.
- Website limits.
- Scan quotas.
- Subscription management.
- Payment integration.
- Billing history.
- Plan upgrades and downgrades.

### Module 10 — Super Admin

- Manage users.
- Manage organizations.
- Manage plans.
- Monitor scan activity.
- View platform-level statistics.
- Manage platform settings.
- Review audit logs.

---

## 6. Technology Stack

| Layer | Technology |
|---|---|
| Programming language | Java 21 |
| Backend | Spring Boot 3.x |
| Security | Spring Security |
| Database | PostgreSQL |
| ORM | Hibernate / Spring Data JPA |
| Build tool | Maven |
| Frontend | React |
| Frontend language | JavaScript initially |
| API | REST |
| API documentation | Swagger / OpenAPI |
| Testing | JUnit 5 and Mockito |
| Version control | Git and GitHub |
| Containerization | Docker |
| Cloud hosting | AWS or equivalent |

### Architecture Decision

Start with a **modular monolith**.

The scanner can initially operate as a controlled backend component. It can later become a separate background worker when scan volume or isolation requirements justify it.

Microservices are not required for the MVP.

---

## 7. Initial Database Entities

- `users`
- `organizations`
- `organization_members`
- `websites`
- `scans`
- `scan_findings`
- `subscriptions`
- `plans`
- `payments`
- `notifications`
- `audit_logs`

All organization-owned records must enforce organization-level authorization.

---

## 8. Non-Functional Requirements

- Secure authentication and authorization.
- Strict tenant isolation.
- Safe outbound network requests.
- Reliable scan execution.
- Input validation.
- Consistent error handling.
- Audit logging.
- Automated testing.
- Maintainable modular architecture.
- Scalable background processing.
- Protection of user and organization data.

---

## 9. Development Phases

### Phase 1 — Programming Fundamentals

- Core Java.
- OOP.
- Collections.
- Exception handling.
- HTTP fundamentals.

### Phase 2 — Database Fundamentals

- SQL.
- Relationships.
- Joins.
- Indexes.
- Database design.

### Phase 3 — Spring Boot Foundation

- Project creation.
- REST controllers.
- Services.
- Repositories.
- DTOs.
- Validation.
- Exception handling.

### Phase 4 — Authentication and SaaS Foundation

- Spring Security.
- Registration and login.
- Organization management.
- Multi-tenant authorization.
- Role management.

### Phase 5 — Website Management

- Add websites.
- Domain verification.
- Website management APIs.

### Phase 6 — Passive Scanner

- HTTP client.
- TLS assessment.
- Security headers.
- Cookie checks.
- DNS checks.

### Phase 7 — Controlled Active Scanner

- Safe active checks.
- Authorization enforcement.
- Network restrictions.
- Rate limits.
- Scan isolation.
- Security testing.

### Phase 8 — React Frontend

- Authentication pages.
- Dashboard.
- Workspace management.
- Website management.
- Scan results.
- Findings.

### Phase 9 — Production Readiness

- Testing.
- Docker.
- Deployment.
- Logging.
- Monitoring.

### Phase 10 — SaaS Expansion

- Scheduled monitoring.
- Reports.
- Notifications.
- Subscription management.
- Payment integration.

---

## 10. MVP Release Criteria

The first public MVP should allow a user to:

1. Register and log in.
2. Create a personal or company workspace.
3. Add an authorized website.
4. Verify website ownership.
5. Run passive security scans.
6. View scan results.
7. Review findings and remediation recommendations.
8. View scan history.
9. Manage multiple websites.
10. Access only authorized organization data.

Controlled active scanning will be introduced only after its security requirements are satisfied.

---

## 11. Future Business Model

Potential plans:

| Plan | Websites | Indicative price |
|---|---|---|
| Free | 2 | ₹0 |
| Starter | 5 | ₹499/month |
| Professional | 20 | ₹1,499/month |
| Business | 100 | ₹3,999/month |

> Pricing is provisional and must be validated with potential customers.

---

## 12. Project Success Criteria

WebSentinel will be considered technically successful when:

- Its MVP works end to end.
- Passive scans produce repeatable results.
- Active scans operate only within approved safety boundaries.
- Multi-tenant data isolation is verified.
- Authentication and authorization are tested.
- The application is deployed and accessible online.
- Users can manage websites and understand security findings.

---

> **Development principle:** Build one module at a time, understand the code, test every feature and maintain production-quality security practices from the beginning.
