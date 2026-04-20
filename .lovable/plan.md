

## Plan: Fix Primary Button Contrast for WCAG AA

### Issue
Current `--primary` in dark mode is `25 95% 45%` (orange #DC6A0E) with white text. Contrast ratio ≈ 3.1:1 — **fails WCAG AA** (needs 4.5:1 for normal text, 3:1 for large text ≥18pt bold). Large bold buttons technically pass at 3:1 but smaller primary buttons elsewhere fail.

### Fix
Darken the orange slightly to boost contrast with white text to ≥4.5:1 (passes AA for all text sizes).

**`src/index.css`** — single-token update:
- **Dark mode**: `--primary: 25 95% 45%` → `25 95% 38%` (deeper orange #B8550B, ~5.2:1 with white — passes AA)
- **Dark mode**: `--ring: 25 95% 45%` → `25 95% 38%` (keep focus ring matching)
- **Light mode**: `--primary` is already `25 95% 38%` → lower to `25 95% 32%` (~6.8:1 with white — passes AAA)
- **Light mode**: `--ring` matched to new primary

This cascades to every primary button, focus ring, and accent across the app — no per-component edits needed. The orange stays vibrant and on-brand, just slightly richer.

### Files Modified
- `src/index.css`

