

## Plan: Fix Text Scaling — Scale Only Text, Not Layout

### Problem
Setting `document.documentElement.style.fontSize` changes the root font-size, which affects **all** `rem`-based values — not just text, but also padding, margins, widths, heights, gaps, and border-radius. This makes the entire UI zoom in/out rather than just changing text size.

### Solution
Instead of changing the root font-size, use a CSS custom property (`--text-scale`) and apply it only to text-bearing elements via a targeted CSS rule. To avoid the old compounding issue with `em`, we'll use `rem` as the base unit in the calculation.

### Changes

**1. `src/context/SettingsContext.tsx`**
- Replace `document.documentElement.style.fontSize = ...` with setting a CSS variable: `document.documentElement.style.setProperty('--text-scale', String(fontSize / 16))`
- Remove the direct fontSize override so layout `rem` values stay at browser default (16px)

**2. `src/index.css`**
- Add a rule targeting text elements using the CSS variable with `rem` (not `em`) to prevent compounding:
```css
p, span, label, h1, h2, h3, h4, h5, h6, li, td, th, a, button, input, select, textarea {
  font-size: calc(1rem * var(--text-scale, 1));
}
```
- Using `1rem` means every element calculates from the unchanged root (16px), so nesting doesn't compound

### Why This Works
- `rem` is always relative to the root, so nested elements won't multiply the scale
- Layout properties (padding, margin, width, gap) remain unaffected since the root font-size stays at 16px
- All text across every screen scales uniformly

### Files Modified
- `src/context/SettingsContext.tsx` — set `--text-scale` CSS variable instead of root font-size
- `src/index.css` — add targeted text-scaling rule using `rem`

