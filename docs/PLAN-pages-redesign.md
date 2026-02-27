# PLAN: Dashboard Pages Redesign — Command Center Aesthetic

## Overview

Redesign all 14 dashboard sub-pages to match the new command-center aesthetic established in the main `dashboard/page.tsx`. The current pages use Notion-inspired flat layouts with generic stat cards, basic tables, and standard modals. This plan brings them all to the same premium level with consistent design language.

**Project Type:** WEB (Next.js)
**Primary Agent:** `frontend-specialist`
**Skills:** `clean-code`, `react-best-practices`, `frontend-design`

---

## Success Criteria

- [ ] All 14 pages use the new design language (section headers, grey backgrounds, orange accents)
- [ ] No Notion-style bracket notation remains
- [ ] All pages compile cleanly (`tsc --noEmit` exit 0)
- [ ] No functionality is lost (CRUD, modals, drag-and-drop all preserved)
- [ ] Consistent visual rhythm across all pages

---

## Design System Reference (from `dashboard/page.tsx`)

These patterns are already established and must be applied consistently:

| Pattern | Implementation |
|---------|---------------|
| **Section Headers** | Orange dot + `10px` bold uppercase + hairline divider |
| **Card Panels** | `--notion-bg-tertiary` bg, `1px solid --notion-border`, `2px` radius |
| **Orange Top Accent** | `2px` solid `--brand-orange` on top of key panels |
| **Orange Left Accent** | `2px` left border on admin/action items |
| **Stat Metrics** | Large `5xl`+ numbers, `9px` uppercase labels, vertical dividers |
| **Table Rows** | `--notion-divider` borders, hover `--notion-bg-tertiary`, transition animations |
| **Action Links** | `9px` uppercase tracking, orange hover, arrow icon |
| **Empty States** | Centered icon + `11px` uppercase text |
| **Dot-grid Texture** | Subtle radial-gradient dots on hero sections |

---

## Task Breakdown

### Phase 1: Core Pages (High Impact, Most Used)

---

#### T1: Tasks Page
- **File:** `src/app/dashboard/tasks/page.tsx` (688 lines)
- **Agent:** `frontend-specialist`
- **Changes:** Replace Kanban card styles with command-center cards. Update stat row to metric strip. Restyle table with orange hover accents. Update filter bar with new section header pattern.
- **INPUT:** Current Notion-style task board
- **OUTPUT:** Command-center styled task management
- **VERIFY:** `tsc --noEmit`, CRUD operations work, drag-and-drop preserved

#### T2: Messages Page
- **File:** `src/app/dashboard/messages/page.tsx` (258 lines)
- **Agent:** `frontend-specialist`
- **Changes:** Restyle conversation sidebar and chat area with grey panels. Update message bubbles. Add orange accents to active conversation.
- **INPUT:** Current basic chat layout
- **OUTPUT:** Sleek messaging interface with grey panels
- **VERIFY:** `tsc --noEmit`, real-time messaging works, typing indicators visible

#### T3: Projects Page
- **File:** `src/app/dashboard/projects/page.tsx` (777 lines)
- **Agent:** `frontend-specialist`
- **Changes:** Project cards → command-center panels with color accent bars. Stat row → metric strip. Grid layout upgraded. Modal forms restyled.
- **INPUT:** Current flat project cards
- **OUTPUT:** Premium project dashboard
- **VERIFY:** `tsc --noEmit`, CRUD, project detail links work

#### T4: Admin Page
- **File:** `src/app/dashboard/admin/page.tsx` (574 lines)
- **Agent:** `frontend-specialist`
- **Changes:** Stats grid → metric strip. User list → styled table with hover effects. Action menu restyled. Modals updated.
- **INPUT:** Current basic admin panel
- **OUTPUT:** Premium admin control center
- **VERIFY:** `tsc --noEmit`, user management CRUD works

---

### Phase 2: Business Pages (Invoices, Payees, Calendar)

---

#### T5: Invoices Page
- **File:** `src/app/dashboard/invoices/page.tsx` (377 lines)
- **Agent:** `frontend-specialist`
- **Changes:** `StatCard` component → metric strip pattern. Invoice table restyled. Status badges updated. `StatusBadge` component restyled.
- **INPUT:** Current `DashboardHeader` + stat cards
- **OUTPUT:** Metric strip + styled invoice table
- **VERIFY:** `tsc --noEmit`, invoice CRUD works

#### T6: Payees Page
- **File:** `src/app/dashboard/payees/page.tsx` (457 lines)
- **Agent:** `frontend-specialist`
- **Changes:** `StatCard` → metric strip. Custom table with `thStyle`/`tdStyle` → unified table styling. Status badges restyled.
- **INPUT:** Current inline-styled table
- **OUTPUT:** Command-center payee management
- **VERIFY:** `tsc --noEmit`, bank/salary/payment modals work

#### T7: Calendar Page
- **File:** `src/app/dashboard/calendar/page.tsx` (989 lines)
- **Agent:** `frontend-specialist`
- **Changes:** Calendar grid restyled with grey cells. Event cards get orange left accents. Filter bar restyled. Quick-add modal updated.
- **INPUT:** Current calendar with Notion-style events
- **OUTPUT:** Premium calendar with command-center styling
- **VERIFY:** `tsc --noEmit`, event creation, month/week/day views work

---

### Phase 3: HR & People Pages

---

#### T8: Directory Page
- **File:** `src/app/dashboard/directory/page.tsx` (374 lines)
- **Agent:** `frontend-specialist`
- **Changes:** User cards restyled with grey panels and orange accents. Search bar updated. Filter area restyled.
- **INPUT:** Current flat user cards
- **OUTPUT:** Premium team directory
- **VERIFY:** `tsc --noEmit`, search, filter, delete work

#### T9: Attendance Page
- **File:** `src/app/dashboard/attendance/page.tsx` (176 lines)
- **Agent:** `frontend-specialist`
- **Changes:** Clock-in card → command-center panel with orange accent. History table restyled.
- **INPUT:** Current `Card` component with rounded UI
- **OUTPUT:** Sleek attendance tracker
- **VERIFY:** `tsc --noEmit`, clock-in/out works

#### T10: Leaves Page
- **File:** `src/app/dashboard/leaves/page.tsx` (405 lines)
- **Agent:** `frontend-specialist`
- **Changes:** Stats cards → metric strip. Table restyled. Leave request modal updated.
- **INPUT:** Current flat table layout
- **OUTPUT:** Premium leave management
- **VERIFY:** `tsc --noEmit`, leave CRUD and approval actions work

#### T11: Profile Page
- **File:** `src/app/dashboard/profile/page.tsx` (863 lines)
- **Agent:** `frontend-specialist`
- **Changes:** Profile header with avatar → cinematic header. Stats grid → metric strip. Activity feed → timeline stream. Form sections restyled with section headers.
- **INPUT:** Current profile with inline styles
- **OUTPUT:** Premium profile page
- **VERIFY:** `tsc --noEmit`, profile edit, avatar upload, password change work

---

### Phase 4: Supporting Pages

---

#### T12: Meetings Page
- **File:** `src/app/dashboard/meetings/page.tsx` (641 lines)
- **Agent:** `frontend-specialist`
- **Changes:** Meeting cards → grey panels with time accent bars. RSVP buttons restyled. Timeline grouping improved.
- **INPUT:** Current meeting cards
- **OUTPUT:** Premium meeting scheduler
- **VERIFY:** `tsc --noEmit`, meeting CRUD and RSVP work

#### T13: Announcements Page
- **File:** `src/app/dashboard/announcements/page.tsx` (236 lines)
- **Agent:** `frontend-specialist`
- **Changes:** Announcement cards → grey panels with priority color left-accents. Create modal restyled.
- **INPUT:** Current flat announcement list
- **OUTPUT:** Command-center announcements
- **VERIFY:** `tsc --noEmit`, announcement CRUD works

#### T14: Credentials Page
- **File:** `src/app/dashboard/credentials/page.tsx` (373 lines)
- **Agent:** `frontend-specialist`
- **Changes:** Credential cards → grey panels with lock icon accents. Password reveal toggle restyled. Create modal updated.
- **INPUT:** Current flat credential vault
- **OUTPUT:** Premium credential manager
- **VERIFY:** `tsc --noEmit`, CRUD and password visibility toggle work

---

## Dependency Graph

```
Phase 1 (Core):    T1 → T2 → T3 → T4    (serial, most impactful)
Phase 2 (Business): T5 → T6 → T7          (serial)
Phase 3 (HR):       T8 → T9 → T10 → T11   (serial)
Phase 4 (Support):  T12 → T13 → T14        (serial)
```

All phases are independent and can run in parallel. Tasks within each phase are serial (build patterns incrementally).

---

## Phase X: Verification

- [ ] `npx tsc --noEmit` — zero errors across all files
- [ ] `npm run build` — production build succeeds
- [ ] All 14 pages load without console errors
- [ ] All CRUD operations functional on every page
- [ ] Visual consistency check — all pages match dashboard aesthetic
- [ ] Mobile responsiveness verified
- [ ] No Notion bracket notation `[ ]` remaining in UI text
