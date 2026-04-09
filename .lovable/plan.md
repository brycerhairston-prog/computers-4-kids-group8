

## Plan: Fix Text Scaling Across All Screens

### Problem
The current CSS rule uses `1em` for scaling, which is relative to the parent element. This causes **compounding** — nested text elements (e.g. a `span` inside a `button` inside a `div`) get scaled multiple times. Additionally, Tailwind utility classes like `text-xs`, `text-sm` set font-size in `rem`, but the CSS override replaces them with an `em`-based calculation, breaking expected sizes on some elements.

### Solution
Instead of overriding `font-size` on individual elements, scale the root `<html>` font-size directly. Since Tailwind classes use `rem` (relative to root), changing the root font-size will naturally scale **all** text across every screen — Lobby, GameSetup, GameSummary, and the main UI — without compounding issues.

### Changes

**1. `src/index.css`** — Remove the per-element font-size override
- Delete the selector block (lines 109-112) that applies `font-size: calc(1em * var(--text-scale))` to p, span, button, etc.
- Keep the `--text-scale` variable on `:root`

**2. `src/context/SettingsContext.tsx`** — Scale root font-size directly
- In the `fontSize` effect, instead of setting `--text-scale`, set `document.documentElement.style.fontSize` to `${fontSize}px`
- This makes all `rem`-based Tailwind classes scale automatically across every component and screen

### Why This Fixes It
- No more compounding from nested `em` calculations
- Every Tailwind text class (`text-xs`, `text-sm`, `text-2xl`, etc.) uses `rem`, so they all respond to root font-size changes
- Works universally across Lobby, GameSetup, Summary, and main game — no per-component changes needed

### Files Modified
- `src/index.css` — remove per-element font-size rule
- `src/context/SettingsContext.tsx` — change effect to set root font-size

