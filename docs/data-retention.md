# WebSentinel — Data Retention & Deletion Policy

## Retention periods

| Data type | Retention | Notes |
|-----------|-----------|-------|
| User account | Until deletion requested | Soft-delete, hard-delete after 30 days |
| Organization & memberships | Until org deleted | Cascade soft-delete |
| Websites | Until removed by user | Soft-delete (`deleted_at`) |
| Scans & findings | While website active | Hard-delete 30 days after website removal |
| Audit logs | 1 year | Then hard-delete |
| Notifications | 90 days after read | Then hard-delete |
| Payment records | 7 years | Legal/accounting requirement |
| Generated PDF reports | 30 days | Then delete from S3 |

## Deletion workflow

1. User requests account/org deletion → set `deleted_at = now()` (soft delete).
2. Grace period: 30 days (user can restore).
3. Scheduled cleanup job (Quartz, daily 02:00 UTC) hard-deletes records past grace period.
4. Cascade: deleting an organization hard-deletes its websites, scans, findings, subscriptions (except payments retained 7 yrs).

## User data export (GDPR-style)

- `GET /api/users/me/export` → ZIP containing: profile, organizations, websites, scans, findings.
- Rate-limited: 1 request per 24h per user.

## Implementation notes

- Add `deleted_at timestamp` to org-owned entities (already in ER diagram).
- All list queries filter `deleted_at IS NULL`.
- Super Admin can view soft-deleted records for support.