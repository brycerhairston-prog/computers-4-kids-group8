

## Plan: Apply New CSS + Fix Faded Footer Text

### Changes

**1. `src/index.css`** — replace with the user-provided version:
- Brighten dark-mode `--muted-foreground` to `210 10% 90%`
- Darken light-mode `--muted-foreground` to `220 20% 40%`
- Restore primary to `25 95% 52%` (dark) / `25 95% 42%` (light)
- Add new `.footer-text` utility that force-applies `--muted-foreground` with `!important`
- Preserves existing `font-size: calc(1rem * var(--text-scale, 1))` rule on text elements (the user's snippet drops it — I'll keep it so the accessibility text-scale setting still works)
- Preserves the `.colorblind` block (user's snippet drops it — keeping it so colorblind mode still works)
- Preserves `.glow-primary` utility

**2. Apply `footer-text` class to faded credit/footer text**

Found via search — these use `text-muted-foreground` in a footer/credit context and look washed out:

- **`src/components/Lobby.tsx`** — `<footer>` with "Created By: Bryce Hairston..." and "UVA Engineering Undergraduates" (welcome view, ~line 235)
- Any other `<footer>` element using muted text styling

Add `footer-text` class alongside existing `text-muted-foreground` so the `!important` rule guarantees the brightened color wins over any inherited opacity or cascade issue.

### Notes
- I'll merge the user's CSS into the existing file rather than blind-overwrite, so accessibility features (`--text-scale`, `.colorblind`) and the `.glow-primary` utility aren't lost.
- Only the Lobby welcome footer currently matches the "faded credits" pattern — other muted text (descriptions, hints) will naturally brighten from the variable change alone.

### Files Modified
- `src/index.css`
- `src/components/Lobby.tsx`

