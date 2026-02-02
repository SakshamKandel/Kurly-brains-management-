# Infinity Canvas & UX Refinement Plan

> **Goal**: Transform the current "Mood Board" into a true professional "Infinity Canvas" similar to Figma or Miro.
> **Focus**: Aesthetics (Clean), Navigation (Drag-to-Pan), and Interaction (Resizing).

## 1. User Experience (UX) Analysis

### Current Issues identified by User:
- **"Ugly Scrollbars"**: Native browser scrollbars break the immersion of an infinite canvas.
- **"Dots too hard"**: The dotted background pattern is visually distracting or "ugly".
- **"Small Space"**: User feels constrained; needs true infinite feel.
- **"Drag to Expand"**: Navigation should not rely on scrollbars but on "Panning" (dragging the canvas itself).

### Solution: The "Figma Model"
- **Visuals**: Plain, clean background (no dots, or extremely subtle ones if requested later).
- **Navigation**:
    -   **Hide Scrollbars**: completely via CSS.
    -   **Drag-to-Pan**:
        -   Default Left Click on Background = **Pan/Drag Canvas**.
        -   Left Click on Block = **Select/Drag Block**.
        -   *Spacebar + Drag* (Standard) or *Middle Click* = Alternate Pan triggers.
- **Interaction**:
    -   **Resizing**: Corner handles on blocks to resize width/height.

## 2. Technical Implementation Steps

### Phase 1: Canvas Core (The "Viewport")
- [ ] **Container Setup**:
    -   `overflow: hidden` (No scrollbars visible).
    -   `cursor: grab` (for background).
- [ ] **Pan Logic**:
    -   State: `offset: { x: 0, y: 0 }`.
    -   Event: `onPointerDown` on background starts panning.
    -   Update `offset` based on mouse movement `movementX/Y`.
    -   Apply `transform: translate(x, y)` to the **Content Layer**.

### Phase 2: The Content Layer
- [ ] **Infinite Div**:
    -   Instead of a fixed `4000px`, use a transformative layer.
    -   `transform: translate({offset.x}px, {offset.y}px)`
- [ ] **Coordinate System**:
    -   Block X/Y are relative to this origin.
    -   Panning shifts the origin, not the blocks.

### Phase 3: Block Interaction
- [ ] **Selection**: Click on block stops propagation to Canvas Pan.
- [ ] **Resizing**:
    -   Add `<ResizeHandle />` to bottom-right of blocks.
    -   Updates `width` / `height` style.
- [ ] **Drag**: Uses `framer-motion` `drag` (handles local delta).

## 3. Revised File Structure

### `src/components/editor/BlockEditor.tsx`
Refactor into smaller parts for sanity:
1.  **`CanvasViewport`**: Handles panning events and global styling.
2.  **`InfiniteSurface`**: The transformable div moving around.
3.  **`CanvasBlock`**: The individual blocks with Drag/Resize logic.

## 4. Verification Checklist
- [ ] **Visual**: No scrollbars visible. Background is plain.
- [ ] **Pan**: Clicking background & dragging moves the entire view.
- [ ] **Drag Block**: Clicking a block drags *only* the block, not the view.
- [ ] **Resize**: Draping corner handle resizes block.
- [ ] **Infinite**: Panning has no hard limits (or very large ones).

---

## 5. Execution Order
1.  **Refactor**: Simplify `BlockEditor.tsx` to basic Panning state.
2.  **Style**: Apply "No Scrollbar" & "No Dots".
3.  **Interact**: Re-enable Block Dragging on top of Panning.
4.  **Resize**: Add Resize Handles.
