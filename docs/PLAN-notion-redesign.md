# Kurlybrains Dashboard - Notion-Style Complete Redesign

> **Project Type:** WEB (Next.js 16 Dashboard)  
> **Primary Agent:** `frontend-specialist`  
> **Style Direction:** Pure Notion Philosophy  
> **Status:** PLANNING - Awaiting Approval

---

## Overview

Complete UI/UX transformation of the Kurlybrains Staff Dashboard to achieve **true Notion aesthetic**. This is not a styling update—it's a fundamental redesign adopting Notion's design philosophy:

- **Content-first** design with minimal chrome
- **Inter font exclusively** (Notion's choice)
- **900px centered content** (document-like feel)
- **Hover-to-reveal** interactions
- **Borderless components** with subtle shadows
- **Collapsible sidebar** with icon-only mode

---

## Notion Design System Specification

### Color Palette (Dark Mode - Primary)

```css
/* === BACKGROUND LAYERS === */
--notion-bg:               #191919;    /* Main background */
--notion-bg-secondary:     #202020;    /* Sidebar, elevated */
--notion-bg-tertiary:      #2F2F2F;    /* Hover states */
--notion-bg-hover:         #37373733;  /* Subtle hover */

/* === TEXT HIERARCHY === */
--notion-text:             rgba(255, 255, 255, 0.81);  /* Primary */
--notion-text-secondary:   rgba(255, 255, 255, 0.44);  /* Secondary */
--notion-text-muted:       rgba(255, 255, 255, 0.28);  /* Muted */

/* === BORDERS & DIVIDERS === */
--notion-border:           rgba(255, 255, 255, 0.06);
--notion-divider:          rgba(255, 255, 255, 0.04);

/* === ACCENT (Minimal) === */
--notion-blue:             #529CCA;    /* Links, selections */
--notion-red:              #E16F6F;    /* Destructive */
--notion-green:            #4DAB9A;    /* Success */
--notion-yellow:           #CB912F;    /* Warning */
```

### Typography (Inter Only)

```css
/* === FONT === */
--font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

/* === SCALE === */
--text-xs:    11px;     /* Labels, metadata */
--text-sm:    12px;     /* Secondary text */
--text-base:  14px;     /* Body text (Notion default) */
--text-lg:    16px;     /* Important text */
--text-xl:    20px;     /* Section headers */
--text-2xl:   24px;     /* Page titles */
--text-3xl:   40px;     /* Large titles */

/* === WEIGHTS === */
--font-normal:   400;
--font-medium:   500;
--font-semibold: 600;
--font-bold:     700;

/* === LINE HEIGHT === */
--leading-tight:  1.2;
--leading-normal: 1.5;
--leading-relaxed: 1.7;
```

### Spacing (Based on 4px grid)

```css
--space-1:  4px;
--space-2:  8px;
--space-3:  12px;
--space-4:  16px;
--space-5:  20px;
--space-6:  24px;
--space-8:  32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
```

### Effects (Extremely Subtle)

```css
/* === SHADOWS (Hover-only) === */
--shadow-sm:   0 1px 0 rgba(0, 0, 0, 0.05);
--shadow-md:   rgba(15, 15, 15, 0.1) 0px 0px 0px 1px, 
               rgba(15, 15, 15, 0.1) 0px 2px 4px;
--shadow-lg:   rgba(15, 15, 15, 0.1) 0px 0px 0px 1px, 
               rgba(15, 15, 15, 0.2) 0px 3px 6px, 
               rgba(15, 15, 15, 0.4) 0px 9px 24px;

/* === TRANSITIONS === */
--transition-fast:   100ms ease;
--transition-base:   200ms ease;
--transition-slow:   300ms ease;

/* === RADIUS (Very Subtle) === */
--radius-sm:    3px;
--radius-md:    4px;
--radius-lg:    6px;
```

---

## Notion Layout Patterns

### 1. Sidebar Pattern

```
┌─────────────────────────────────────────────────┐
│ [☰]  Kurlybrains ▼                    [◐] [⚙]  │  ← Workspace header
├─────────────────────────────────────────────────┤
│ 🔍 Search                              ⌘K      │  ← Quick search
├─────────────────────────────────────────────────┤
│ Private                                         │
│ ├── 📊 Dashboard                               │
│ ├── ✅ Tasks                                   │
│ ├── 💬 Messages                                │
│ ├── 🕐 Attendance                              │
│ ├── 📅 Leaves                                  │
│ └── 📢 Announcements                           │
├─────────────────────────────────────────────────┤
│ Shared                                          │
│ ├── 👥 Directory                               │
│ └── 🛡️ Admin Panel                            │
├─────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────┐   │
│ │ [Avatar] John Doe                        │   │  ← User section
│ │          john@company.com                │   │
│ └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

**Specs:**
- Width: 240px (expanded), 44px (collapsed)
- Background: `--notion-bg-secondary`
- Hover items: `--notion-bg-tertiary`
- Active item: Same, with left border indicator

### 2. Content Pattern (Notion Document Style)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  [← Back]           Dashboard / Tasks / Task Details     │  │  ← Breadcrumb
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                                                          │  │
│  │  ✅  Tasks                                [+ New Task]   │  │  ← Page header
│  │      ──────────────────────────────────────────────     │  │     with emoji
│  │                                                          │  │
│  │  [Content here - max 900px centered]                     │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Specs:**
- Content max-width: 900px (centered)
- Page title: 40px, font-weight 700
- Padding: 96px horizontal, 32px vertical
- Breadcrumb: 12px, muted color

### 3. Card Pattern (Notion Block Style)

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  [Icon]  Card Title                    [⋮]  ← Hover reveal │
│                                                             │
│  Description text here, minimal styling                     │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Metadata  •  Secondary Info  •  Time                  │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Specs:**
- No borders by default
- Background: transparent or `--notion-bg-secondary`
- Shadow on hover only: `--shadow-md`
- Action buttons: opacity 0 → 1 on hover

---

## Implementation Phases

### Phase 1: Design System Reset ⏱️ ~1 hour

**Goal:** Replace current design tokens with Notion's exact values

| Task | Files | Priority |
|------|-------|----------|
| Replace design-tokens.css | `src/styles/design-tokens.css` | P0 |
| Update typography (Inter only) | `src/styles/typography.css` | P0 |
| Simplify animations | `src/styles/animations.css` | P1 |
| Reset globals.css | `src/app/globals.css` | P0 |

### Phase 2: Layout Overhaul ⏱️ ~1.5 hours

**Goal:** Implement Notion's sidebar and content patterns

| Task | Files | Priority |
|------|-------|----------|
| Collapsible Notion-style sidebar | `Sidebar.tsx` | P0 |
| Centered content layout | `PageContainer.tsx` | P0 |
| Breadcrumb navigation | `Breadcrumb.tsx` [NEW] | P1 |
| Minimal header (or remove) | `Header.tsx` | P1 |

### Phase 3: Component Library Update ⏱️ ~2 hours

**Goal:** Rebuild components with Notion aesthetics

| Component | Notion Style |
|-----------|--------------|
| Button | Ghost default, subtle hover |
| Card | Borderless, hover shadow |
| Input | No visible border until focus |
| Modal | Centered, subtle shadow |
| Badge | Pill-shaped, muted colors |
| Table | Clean rows, no cell borders |
| Dropdown | Shadow popover style |

### Phase 4: Page Redesigns ⏱️ ~3 hours

**Goal:** Apply Notion document pattern to all pages

| Page | Key Changes |
|------|-------------|
| Landing | Full-page centered, minimal |
| Login/Register | Centered card, no borders |
| Dashboard | Stats as Notion database view |
| Tasks | Toggle/list view, inline editing feel |
| Messages | Chat-like Notion comments style |
| Attendance | Database table view |
| Leaves | Status badges, timeline view |
| Announcements | Block-style posts |
| Directory | Gallery/grid of user cards |
| Admin | Settings page style |
| Profile | Notion user profile layout |

### Phase 5: Polish & Verify ⏱️ ~30 mins

| Task | Check |
|------|-------|
| Remove all inline styles | ✓ |
| Verify hover interactions | ✓ |
| Test collapsed sidebar | ✓ |
| Responsive mobile view | ✓ |
| Build verification | ✓ |

---

## File Changes Summary

### New Files
- `src/components/layout/Breadcrumb.tsx`
- `src/styles/notion-theme.css` (optional, if needed)

### Major Modifications
| File | Change Type |
|------|-------------|
| `design-tokens.css` | Complete rewrite |
| `typography.css` | Remove Oswald, Inter only |
| `globals.css` | Simplify, Notion patterns |
| `Sidebar.tsx` | Complete redesign |
| `Header.tsx` | Remove or minimize |
| All page files | Apply Notion layout |

### Deletions
- Remove Oswald font imports
- Remove complex animations
- Remove colored accent patterns

---

## Decision Points (User Input Needed)

> [!IMPORTANT]
> Before implementation, please confirm:

1. **Dark mode or Light mode primary?**
   - A) Dark (Notion default for many users)
   - B) Light (Notion's clean white aesthetic)

2. **Collapsible sidebar?**
   - A) Yes, with icon-only collapsed state
   - B) No, keep always-expanded sidebar

3. **Page emojis?**
   - A) Yes, use emojis as page icons (📊 Dashboard)
   - B) No, use Lucide icons only

4. **Remove Oswald font completely?**
   - A) Yes, Inter only (true Notion style)
   - B) No, keep Oswald for brand (hybrid approach)

---

## Success Metrics

| Metric | Target |
|--------|--------|
| **Visual Recognition** | "This looks like Notion" reaction |
| **Content Focus** | Eyes go to content, not chrome |
| **Clean Code** | Zero inline styles in pages |
| **Performance** | Same or better load time |
| **Consistency** | Single font, 4px grid everywhere |

---

## Verification Checklist

- [ ] No Oswald font remaining
- [ ] All components use design tokens
- [ ] Sidebar collapses correctly
- [ ] Content is 900px centered
- [ ] Hover reveals action buttons
- [ ] No hard borders, shadows on hover only
- [ ] Build passes without errors
- [ ] Mobile responsive layout works

---

**Next Steps:**
1. Review this plan
2. Answer the 4 decision points above
3. Run implementation

