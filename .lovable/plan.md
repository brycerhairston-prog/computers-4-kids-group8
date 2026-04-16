

## Plan: Improve Muted Text Contrast

### Issue
The "Created By" credits and similar low-contrast text use `text-muted-foreground`, which is currently `215 15% 55%` in dark mode. Against the dark background (`220 20% 10%`), this gives a contrast ratio around 4:1 — borderline and hard to read.

### Fix
Single change in `src/index.css`: lighten `--muted-foreground` in dark mode so all text using this token (credits, descriptions, subtitles, hints across the app) becomes more readable.

- **Dark mode**: `--muted-foreground: 215 15% 55%` → `215 20% 75%` (passes WCAG AA at ~7:1)
- **Light mode**: `--muted-foreground: 215 15% 45%` → `215 20% 35%` (darker for better contrast on light bg)

This single token update cascades to every muted text usage across Lobby credits, card descriptions, stat labels, settings descriptions, and tab hints — no per-component changes needed.

### Files Modified
- `src/index.css` — update `--muted-foreground` HSL values for both themes

