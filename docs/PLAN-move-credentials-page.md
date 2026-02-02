# PLAN-move-credentials-page

**Goal**: Relocate "Client Credentials" from the Admin Dashboard to a dedicated `/dashboard/credentials` page accessible to all staff (with permission filtering), and fix the "Staff accessing Admin Portal" security issue.

## Phase 1: Context & Analysis
- **Current State**: Credentials are embedded in `AdminDashboardPage.tsx`. Staff cannot see this page properly (and shouldn't). This prevents Staff from seeing "Public" credentials unless they are admins.
- **Requirement**: "CHANGE CLIENT CREDENTIALS TO PRIVATE SECTION NOT IN ADMIN SECTION".
- **Security Issue**: Staff users are currently viewing the Admin Portal because the client-side redirect was flaky.

## Phase 2: Implementation Plan

### 1. Create Dedicated Credentials Page
- [ ] **Create `src/app/dashboard/credentials/page.tsx`**
    - Copy credential fetching and display logic from Admin page.
    - Implement "Visibility" logic: Staff see assigned/public, Admins see all.
    - Add "Add Credential" button (visible to Admin/Manager/Super Admin).

### 2. Update Admin Dashboard
- [ ] **Remove Credentials Section** from `src/app/dashboard/admin/page.tsx`.
- [ ] **Fix Access Control**: Re-apply the strict "Loading/Access Denied" block to `AdminDashboardPage` (my previous edit failed due to target mismatch).

### 3. Navigation Update
- [ ] **Update Sidebar**: Add "Credentials" link to `src/components/layout/Sidebar.tsx` (or verify it's accessible via Global Menu).

## Phase 3: Agent Assignments
- **Frontend Specialist**: Move UI components and logic.
- **Security Specialist**: Fix the access control block.

## Phase 4: Verification Checklist
- [ ] Staff user cannot access `/dashboard/admin`.
- [ ] Staff user CAN access `/dashboard/credentials`.
- [ ] Staff user sees Public/Assigned credentials.
- [ ] Admin user sees All credentials.
