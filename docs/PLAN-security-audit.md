# Security Audit: Manual Code Review + Targeted Fixes

## Problem
After auditing all 49 API route files, 6 vulnerabilities were found: open registration, unprotected debug endpoint, commented-out role checks, missing role gates on invoices, incomplete SUPER_ADMIN permissions on task deletion, and plaintext credential storage.

## Proposed Changes

### 1. Critical Fixes

#### [MODIFY] [route.ts](file:///c:/kurlybrains-dashboard/src/app/api/register/route.ts)
- Add `auth()` check — only ADMIN/SUPER_ADMIN can create users
- Keep STAFF as default role for created users

#### [MODIFY] [route.ts](file:///c:/kurlybrains-dashboard/src/app/api/debug/fix-invoices/route.ts)
- Add `auth()` + SUPER_ADMIN-only check (raw SQL route)

#### [MODIFY] [route.ts](file:///c:/kurlybrains-dashboard/src/app/api/credentials/route.ts)
- Uncomment role check on POST (ADMIN/MANAGER/SUPER_ADMIN only)

#### [MODIFY] [route.ts](file:///c:/kurlybrains-dashboard/src/app/api/invoices/route.ts)
- Add role check on POST (ADMIN/MANAGER/SUPER_ADMIN only)

#### [MODIFY] [route.ts](file:///c:/kurlybrains-dashboard/src/app/api/invoices/[id]/route.ts)
- Add role + ownership checks on PUT/DELETE

#### [MODIFY] [route.ts](file:///c:/kurlybrains-dashboard/src/app/api/tasks/[id]/route.ts)
- Fix DELETE to also allow SUPER_ADMIN

---

### 2. Standardize Auth Checks

Replace `if (!session)` with `if (!session?.user?.id)` in these 21 route occurrences:
- `users/[id]/route.ts` (3 handlers)
- `users/route.ts` (2 handlers)
- `tasks/[id]/route.ts` (3 handlers)
- `payments/[id]/route.ts` (3 handlers)
- `payments/route.ts` (2 handlers)
- `payees/[id]/route.ts` (2 handlers)
- `payees/route.ts` (2 handlers)
- `banks/route.ts` (3 handlers)
- `announcements/route.ts` (1 handler)

---

### 3. Middleware-Level API Auth

#### [MODIFY] [middleware.ts](file:///c:/kurlybrains-dashboard/src/middleware.ts)
- Block unauthenticated API requests at middleware level
- Whitelist: `/api/auth/*`, `/api/register` (now admin-gated internally anyway)

---

### 4. Encrypt Credential Passwords

#### [NEW] [crypto.ts](file:///c:/kurlybrains-dashboard/src/lib/crypto.ts)
- AES-256-GCM encrypt/decrypt using `CREDENTIALS_ENCRYPTION_KEY` env var

#### [MODIFY] [route.ts](file:///c:/kurlybrains-dashboard/src/app/api/credentials/route.ts)
- Encrypt password + apiKey on POST, decrypt on GET

---

## Verification

- `npm run build` — no TypeScript errors
