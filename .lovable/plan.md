

## Plan: Maximize Muted Text Contrast

### Issue
Despite previous lightening, muted text (credits, descriptions, hints) still reads as gray. User wants near-white in dark mode and near-black in light mode.

### Fix
Single change in `src/index.css` to the `--muted-foreground` token, which cascades to every `text-muted-foreground` usage across the app (Lobby credits, card descriptions, stat labels, settings hints, tab subtitles, etc.).

- **Dark mode**: `210 25% 88%` → `210 20% 96%` (near-white)
- **Light mode**: `215 20% 35%` → `220 20% 12%` (near-black, matches `--foreground`)

No per-component changes needed — one token update affects all muted text globally.

### Files Modified
- `src/index.css` — update `--muted-foreground` HSL values for both `:root` (dark) and `.light` themes

