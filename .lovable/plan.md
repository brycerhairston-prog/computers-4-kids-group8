

## Plan: Fix Accessibility Issues

### 1. Landmark Structure
Wrap top-level layouts in semantic HTML5 tags across key screens:
- **`src/components/Lobby.tsx`** — change root `<div>` containers to `<main>`, wrap header section (logo, title, settings) in `<header>`, wrap creator credits in `<footer>`.
- **`src/pages/Index.tsx`** — wrap main game view in `<main>` with appropriate `<header>` for the top nav/logo area.
- **`src/components/GameSummary.tsx`** — wrap content in `<main>` and the title/logo area in `<header>`.
- **`src/components/GameSetup.tsx`** — wrap in `<main>` with `<header>` for title section.

### 2. Text Contrast on Primary Buttons
Current `--primary: 25 95% 55%` (orange) with white foreground may fail 4.5:1. Fix in **`src/index.css`**:
- Darken `--primary` in dark mode to `25 95% 45%` (or similar) so white text on it passes WCAG AA.
- Verify light mode `--primary: 25 95% 50%` against white — likely also needs darkening to ~`25 95% 40%`.
- Keep `--primary-foreground: 0 0% 100%` (white) for clear contrast.

### 3. ARIA Labels on Icon-Only Buttons & Decorative Icons
Two-pronged fix:

**A. Decorative icons (icon + visible text)** — add `aria-hidden="true"` to the Lucide icon:
- `src/components/Lobby.tsx`: Plus, LogIn, ArrowLeft, Loader2, Copy, Users, DoorOpen, Trash2, UserMinus icons that sit next to text labels
- `src/components/SettingsPanel.tsx`: any icons paired with labels
- `src/components/GameSummary.tsx`, `src/components/GameSetup.tsx`, `src/components/ShotTracker.tsx`: decorative icons with text

**B. Icon-only buttons** — add `aria-label` to the `<Button>`:
- Settings gear button in `SettingsPanel.tsx` → `aria-label="Open settings"`
- Copy code button in `Lobby.tsx` → `aria-label="Copy game code"`
- Back arrow buttons in Lobby create/join views → `aria-label="Go back"`
- Remove player buttons (Trash2/UserMinus icon-only) → `aria-label="Remove {playerName}"`
- Remove name field button in Lobby → `aria-label="Remove player field"`

### Files Modified
- `src/index.css` — darken `--primary` for WCAG contrast
- `src/components/Lobby.tsx` — semantic tags + aria attributes
- `src/components/SettingsPanel.tsx` — aria-label on gear button + aria-hidden on icons
- `src/components/GameSummary.tsx` — semantic tags + aria-hidden on icons
- `src/components/GameSetup.tsx` — semantic tags + aria-hidden on icons
- `src/components/ShotTracker.tsx` — aria-hidden on decorative icons, aria-label on icon-only buttons
- `src/pages/Index.tsx` — `<main>` wrapper + `<header>` for top area

