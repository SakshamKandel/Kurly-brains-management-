# Project Plan: UI Architecture Evolution

## Context
The user has requested to explore completely new, "drastically better" UI architectures for the dashboard, moving beyond standard layouts. This plan outlines the multi-phase execution strategy to completely revamp the UI once a core architectural direction is chosen.

## Phase -1 (Context Check)
- **Goal**: Elevate the Kurly Brains dashboard to an elite, bespoke user interface.
- **Constraints**: Must look highly premium, avoid standard SaaS cliches, and utilize the new Obsidian/Orange brand tokens.
- **Current State**: Awaiting user selection from the Brainstorming session (Bento Grid vs. Cinematic HUD vs. Editorial Canvas).

## Phase 0 (Socratic Gate)
- Provide brainstorm options to the user.
- Await selection of target architecture.
- Confirm specific micro-interactions (e.g., hover reveals vs. floating elements).

## Phase 1 (Foundation & Layout)
- Restructure `page.tsx` entirely based on the chosen architecture.
- Re-engineer the grid/flex systems to support the new paradigm (e.g., CSS Grid for Bento, or free-flowing for Editorial).
- Update the global layout shell (`layout.tsx`) if the sidebar needs to be removed or transformed into a floating dock.

## Phase 2 (Component Recreation)
- Discard traditional `Card.tsx` if necessary.
- Build bespoke UI container components (e.g., `BentoCell` or `FloatingDataStream`).
- Integrate the high-contrast Kurly Brains typography hierarchy.

## Phase 3 (Cinematic Motion)
- Inject Framer Motion / GSAP for layout transitions.
- Apply liquid-easing and slow-duration state changes.

## Verification Checklist
- [ ] UI perfectly matches the chosen architectural paradigm.
- [ ] Zero traditional "Notion/SaaS" artifacts remain.
- [ ] Animations run at a smooth 60fps+ without jank.
- [ ] The aesthetic feels rich, expensive, and bespoke.
