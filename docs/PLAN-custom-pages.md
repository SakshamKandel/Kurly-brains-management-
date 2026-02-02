# Notion-Like Custom Pages System

## Goal
Build a fully customizable page system with block-based editing and widget dashboard, similar to Notion.

---

## Phase 1: Database Schema

Add models for pages and blocks:
- `CustomPage` - User pages with title, icon, order
- `Block` - Content blocks (text, heading, list, checklist, divider, code)

---

## Phase 2: API Routes

- `/api/pages` - GET/POST user pages
- `/api/pages/[id]` - GET/PATCH/DELETE single page
- `/api/pages/[id]/blocks` - POST/PATCH/DELETE blocks

---

## Phase 3: Block Editor Components

- `BlockEditor.tsx` - Main editor with drag-drop
- Block types: Text, Heading, List, Checklist, Divider, Code
- Slash command (/) to add blocks

---

## Phase 4: Custom Page Route

- `/dashboard/pages/[id]` - Dynamic page route
- Auto-save changes
- Real-time editing

---

## Phase 5: Widget Dashboard

Widgets: Pomodoro Timer, Quick Notes, Calendar, Progress Ring

---

## Phase 6: Sidebar Integration

- Fetch pages from API
- Navigate to page routes
- Drag-drop reordering
- Inline rename
