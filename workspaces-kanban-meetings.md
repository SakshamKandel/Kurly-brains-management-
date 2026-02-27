# Project Workspaces, Kanban Board & Meeting Scheduler

## Goal
Add three major features to Kurly Brains Dashboard:
1. **Project Workspaces** - Group tasks, messages, files by project/client
2. **Kanban Board** - Visual drag-drop task management view
3. **Meeting Scheduler** - Schedule meetings with team members

---

## Tech Stack
- **Existing:** Next.js 16, Prisma, PostgreSQL, NextAuth, Tailwind/CSS
- **New:** `@dnd-kit` for drag-drop (Kanban)
- **Design:** Notion-style, dark theme (existing)

---

## Phase 1: Database Schema

### Tasks
- [ ] **1.1** Add `Project` model to Prisma schema
  ```prisma
  model Project {
    id          String   @id @default(cuid())
    name        String
    description String?
    color       String   @default("#3b82f6")
    clientId    String?
    client      Client?  @relation(fields: [clientId], references: [id])
    createdById String
    createdBy   User     @relation(fields: [createdById], references: [id])
    tasks       Task[]
    members     ProjectMember[]
    createdAt   DateTime @default(now())
  }
  
  model ProjectMember {
    id        String  @id @default(cuid())
    projectId String
    project   Project @relation(fields: [projectId], references: [id])
    userId    String
    user      User    @relation(fields: [userId], references: [id])
    role      String  @default("MEMBER") // OWNER, ADMIN, MEMBER
  }
  ```
  → **Verify:** `npx prisma db push` succeeds

- [ ] **1.2** Add `Meeting` model to Prisma schema
  ```prisma
  model Meeting {
    id          String   @id @default(cuid())
    title       String
    description String?
    startTime   DateTime
    endTime     DateTime
    location    String?  // "Room A" or "Virtual"
    createdById String
    createdBy   User     @relation(fields: [createdById], references: [id])
    attendees   MeetingAttendee[]
    createdAt   DateTime @default(now())
  }
  
  model MeetingAttendee {
    id        String  @id @default(cuid())
    meetingId String
    meeting   Meeting @relation(fields: [meetingId], references: [id])
    userId    String
    user      User    @relation(fields: [userId], references: [id])
    status    String  @default("PENDING") // ACCEPTED, DECLINED, PENDING
  }
  ```
  → **Verify:** `npx prisma generate` succeeds

- [ ] **1.3** Add `projectId` field to existing `Task` model
  → **Verify:** Existing tasks still work

---

## Phase 2: API Routes

### Project APIs
- [ ] **2.1** Create `/api/projects/route.ts` (GET all, POST create)
  → **Verify:** `GET /api/projects` returns `[]`

- [ ] **2.2** Create `/api/projects/[id]/route.ts` (GET one, PUT update, DELETE)
  → **Verify:** CRUD operations work

- [ ] **2.3** Create `/api/projects/[id]/members/route.ts` (add/remove members)
  → **Verify:** Can add team member to project

### Meeting APIs
- [ ] **2.4** Create `/api/meetings/route.ts` (GET all, POST create)
  → **Verify:** Can create a meeting

- [ ] **2.5** Create `/api/meetings/[id]/route.ts` (GET, PUT, DELETE)
  → **Verify:** Can update meeting details

- [ ] **2.6** Create `/api/meetings/[id]/respond/route.ts` (accept/decline)
  → **Verify:** Attendee can respond to invite

---

## Phase 3: Kanban Board

- [ ] **3.1** Install `@dnd-kit/core` and `@dnd-kit/sortable`
  → **Verify:** `npm ls @dnd-kit/core` shows installed

- [ ] **3.2** Create `src/components/tasks/KanbanBoard.tsx`
  - Columns: TODO, IN_PROGRESS, REVIEW, COMPLETED
  - Drag-drop between columns
  - Card shows: title, priority badge, assignee avatar
  → **Verify:** Dev server shows Kanban board

- [ ] **3.3** Create `src/components/tasks/KanbanColumn.tsx`
  - Droppable column container
  - Task count badge
  → **Verify:** Tasks render in correct columns

- [ ] **3.4** Add view toggle to Tasks page (List ↔ Kanban)
  - Persist preference in localStorage
  → **Verify:** Toggle switches between views

---

## Phase 4: Project Workspaces UI

- [ ] **4.1** Create `/dashboard/projects/page.tsx` - Projects list page
  - Grid of project cards
  - Create new project button
  → **Verify:** Page loads at `/dashboard/projects`

- [ ] **4.2** Create `/dashboard/projects/[id]/page.tsx` - Single project view
  - Tabs: Overview, Tasks, Meetings, Files
  - Project settings (members, color)
  → **Verify:** Can view project details

- [ ] **4.3** Create `src/components/projects/ProjectCard.tsx`
  - Color bar, name, member avatars, task count
  → **Verify:** Cards display correctly

- [ ] **4.4** Add "Projects" to sidebar navigation
  → **Verify:** Sidebar shows Projects link

---

## Phase 5: Meeting Scheduler UI

- [ ] **5.1** Create `/dashboard/meetings/page.tsx` - Meetings list
  - Today's meetings highlighted
  - Week view calendar grid
  → **Verify:** Page loads at `/dashboard/meetings`

- [ ] **5.2** Create `src/components/meetings/MeetingModal.tsx`
  - Title, date/time pickers, attendee selector
  - Location field (room or virtual)
  → **Verify:** Modal creates meetings

- [ ] **5.3** Create `src/components/meetings/MeetingCard.tsx`
  - Time, title, attendees, location
  - Quick accept/decline buttons
  → **Verify:** Cards show meeting details

- [ ] **5.4** Integrate with existing Calendar page
  - Show meetings as events
  → **Verify:** Meetings appear on calendar

---

## Phase 6: Integration

- [ ] **6.1** Filter tasks by project in Tasks page
  - Dropdown: "All Projects" or specific project
  → **Verify:** Filter shows only project tasks

- [ ] **6.2** Add project selector when creating tasks
  → **Verify:** New tasks can be assigned to projects

- [ ] **6.3** Add meeting notifications
  - Use existing notification system
  → **Verify:** Meeting invites trigger notifications

---

## Phase X: Verification

- [ ] `npm run build` - No errors
- [ ] `npx prisma db push` - Schema synced
- [ ] Test: Create project → Add task → View in Kanban
- [ ] Test: Schedule meeting → Attendee accepts → Appears on calendar
- [ ] Mobile responsive check

---

## Done When
- [ ] Projects page shows list of workspaces with member management
- [ ] Tasks page has Kanban/List toggle that persists
- [ ] Meetings can be scheduled and appear on calendar
- [ ] All features work together (project tasks in kanban, meetings in calendar)
