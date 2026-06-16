# internship-admin — GUM operations portal (Next.js, desktop-first)

Sessions 4.1 + core queues done; remainder of 4.2–4.4 pending.

## Run
```bash
npm install && cp .env.local.example .env.local && npm run dev   # http://localhost:3100
```
Staff accounts only (`/api/session` rejects non-staff). Architecture mirrors internship-web (httpOnly cookies + /api/proxy auto-refresh).

## Built & verified live
- RBAC sidebar (role-filtered nav, collapsible) + role badge topbar + audit notice
- DataTable: server pagination, client sort, filters, streaming-CSV export button
- ConfirmDialog (reason templates) + useAuditMutation ("this action is logged")
- Dashboard (stat cards + pending-action deep-links) · KYC queue (approve/reject live) · Refund approvals · Users (search/suspend with session revocation/CSV)
- API gap filled: GET /admin/instructors?kycStatus= listing added to internship-api

## Remaining (one session each)
- 4.2: internship moderation queue UI (decision endpoint live; needs student-view preview + changed-fields diff — diff needs a backend revision-tracking addition), CMS manager with live preview
- 4.3: user detail tabs (enrollments/payments/sessions), enrollment ops wizard (manual enroll + transfer endpoints live), batch fill/at-risk views, tickets workspace (all endpoints live)
- 4.4: orders explorer, settlements screen (endpoints live incl. statement PDF), recharts dashboard charts, date-range report exports
