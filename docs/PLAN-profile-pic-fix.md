
# PLAN-profile-pic-fix

> **Task**: Fix profile picture visibility and persistence across the application.
> **Status**: Planning
> **Owner**: Antigravity

## Context
The user reports that the profile picture is only visible in the "Settings" page but not elsewhere (Sidebar, Team Directory, Messages), despite previous fixes.

## Root Cause Analysis
1.  **Sidebar**:
    -   Rerendering issue?
    -   Session update delay? `useSession` might not be triggering a re-render even if the cookie updates.
    -   `Avatar` component styling issues (fixed locally, need to verify build).
2.  **Directory/Messages**:
    -   Data fetching: Is the API returning `null` for `avatar` intermittently?
    -   Caching: Is Next.js caching the API response?
    -   Database: Are we using the correct field? (Verified `avatar` exists in DB).

## Implementation Plan

### Phase 1: Verification & Debugging
- [ ] Verify `Avatar` component behavior with explicit width/height.
- [ ] Verify `useSession` hook updates in `Sidebar`.
- [ ] Verify `auth.ts` session callback logic.

### Phase 2: Code Adjustments
- [ ] **Sidebar.tsx**: Force a session update/reload if the image is missing but present in DB.
- [ ] **Avatar.tsx**: Ensure fallback logic is robust.
- [ ] **globals.css**: Add global `.avatar` class as a safety net.

### Phase 3: Deployment Prep
- [ ] Run `npm run build` to check for compilation errors.
- [ ] Verify strict mode behavior.

## Agents
- `frontend-specialist`: For React components and CSS.
- `backend-specialist`: For Auth keys and API.

## Verification Checklist
- [ ] Profile picture shows in Sidebar immediately after login.
- [ ] Profile picture shows in Team Directory.
- [ ] Profile picture shows in Messages (chats and list).
