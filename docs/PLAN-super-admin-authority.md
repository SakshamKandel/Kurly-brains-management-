# PLAN-super-admin-authority

**Goal**: Ensure `SUPER_ADMIN` has full authority across the system, specifically fixing the inability to create credentials and ensuring granular access controls work as expected.

## Phase 1: Context & Analysis
- **Problem**: The user receives "Only admins/managers can create credentials" error when attempting to create credentials as a `SUPER_ADMIN`.
- **Root Cause**: The logic `role === "ADMIN" || role === "MANAGER"` excludes `SUPER_ADMIN` in `src/app/api/credentials/route.ts` and likely other files.
- **Affected Areas**:
    - Backend: API Routes (`credentials`, `users`, `leaves`, `attendance`, `tasks`).
    - Frontend: `GlobalActionMenu.tsx`, `AdminDashboardPage`, `Header.tsx`.

## Phase 2: Implementation Plan

### 1. Backend Updates (API Routes)
- [ ] **Audit & Fix `src/app/api/credentials/route.ts`**
    - Update `POST` and `DELETE` checks to include `SUPER_ADMIN`.
    - Ensure `GET` visibility logic includes `SUPER_ADMIN` (view all).
- [ ] **Audit `src/app/api/users/route.ts`**
    - Ensure `SUPER_ADMIN` can create/edit any user (including other Admins).
- [ ] **Audit `src/app/api/leaves/route.ts`** and **`src/app/api/attendance/route.ts`**
    - Ensure `SUPER_ADMIN` is treated as a high-level approver/viewer.

### 2. Frontend Updates
- [ ] **`src/components/layout/GlobalActionMenu.tsx`**
    - Update `isAdminOrManager` check to include `SUPER_ADMIN`.
    - Ensure "Client Credential" and "Staff Member" options are visible.
- [ ] **`src/app/dashboard/admin/page.tsx`**
    - Update role badges or permission checks if any are client-side restricted.

### 3. Verification
- [ ] **Manual Test**: Login as `SUPER_ADMIN` and try to:
    1. Create a Client Credential (public/private).
    2. Create a User.
    3. View all Attendance records.

## Phase 3: Agent Assignments
- **Backend Specialist**: Update API routes.
- **Frontend Specialist**: Update `GlobalActionMenu` and Dashboard logic.

## Phase 4: Verification Checklist
- [ ] `SUPER_ADMIN` can create credentials.
- [ ] `SUPER_ADMIN` sees all admin action buttons.
- [ ] No regression for `ADMIN` or `MANAGER` roles.
