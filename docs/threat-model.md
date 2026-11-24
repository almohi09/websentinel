# WebSentinel — Threat Model (Draft)

Focus: prevent WebSentinel itself from becoming an attack vector. Companion to PRD §4 (Scanning Safety).

## Assets
- User accounts & credentials
- Organization & membership data
- Website inventory & scan results (may contain sensitive headers/cookies)
- Stored scan credentials (test accounts for active scanning)
- Platform infrastructure (DB, secrets, compute)

## Threats & Mitigations

| # | Threat | Impact | Mitigation |
|---|--------|--------|------------|
| T1 | SSRF via scanner (user supplies internal URL) | Access to internal networks/metadata | Block private, loopback, link-local, reserved IP ranges; block cloud metadata endpoints (169.254.169.254); validate URL scheme (http/https only); revalidate every redirect destination |
| T2 | DNS rebinding | Bypass IP block by resolving to internal IP later | Resolve DNS once, pin resolved IP, re-resolve on each redirect and revalidate |
| T3 | Unauthorized scanning (user scans sites they don't own) | Legal liability, abuse | Ownership verification (DNS TXT / HTML file / meta tag) + explicit authorization attestation with timestamp + IP; ToS acceptance |
| T4 | Tenant data leakage | Cross-org data exposure | Row-level isolation + TenantContext filter + integration tests |
| T5 | Credential theft (stored test accounts) | Account takeover on target sites | Encrypt at rest (AES-256 via KMS), never log, rotate, least-privilege access |
| T6 | DoS via scan abuse | Resource exhaustion | Rate limits (per user/org), scan duration caps, response size caps, concurrency limits, queue-based execution |
| T7 | Scanner used as open proxy | Bandwidth abuse, IP reputation | Outbound requests only to verified website hosts; no arbitrary proxying |
| T8 | Injection in stored findings/evidence | XSS when rendered in UI | Sanitize/escape on render; treat evidence as untrusted text |
| T9 | Privilege escalation | Unauthorized admin actions | RBAC enforced server-side; never trust client role claims |
| T10 | Secret leakage | Full compromise | Secrets manager in prod; .env gitignored; pre-commit secret scanning |

## Active Scanner Gate
Active scanning MUST remain disabled until:
- [ ] Threat model reviewed & signed off
- [ ] Safety controls implemented & unit-tested
- [ ] Legal ToS + authorization attestation flow live
- [ ] Abuse reporting mechanism live
- [ ] Penetration test of scanner safety controls passed

## Out of scope (initial)
Destructive actions, DoS testing, credential stuffing, arbitrary code execution, third-party exploitation.