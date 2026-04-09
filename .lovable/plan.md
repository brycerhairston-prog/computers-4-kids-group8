

## Plan: Add Settings, Feedback, and Game Rules to Main UI

### Overview
Four additions: (1) a Settings panel with light/dark mode, colorblind toggle, and text size control; (2) a Feedback button; (3) a Game Rules breakdown card next to the Data Science Tips on the playing screen.

### Changes

**1. New file: `src/context/SettingsContext.tsx`**
- Create a React context that manages and persists (localStorage) three settings:
  - `theme`: "dark" | "light" — toggles `dark` class on `<html>`
  - `colorblindMode`: boolean — adds a `colorblind` class on `<html>` for CSS overrides
  - `textSize`: "sm" | "md" | "lg" — adds a data attribute `data-text-size` on `<html>`
- Provider wraps the app in `App.tsx`

**2. New file: `src/components/SettingsPanel.tsx`**
- A sheet/drawer triggered by a gear icon button in the header
- Contains:
  - Light/Dark mode toggle (Switch component)
  - Colorblind mode toggle (Switch) — adjusts shot made/missed colors to blue/yellow
  - Text size selector (3 radio buttons: Small, Medium, Large)

**3. New file: `src/components/FeedbackDialog.tsx`**
- A dialog triggered by a message icon button in the header
- Simple form: rating (1-5 stars or emoji), text area for comments, submit button
- On submit, saves to a `feedback` table in the database (or just shows a toast confirmation if no backend needed)

**4. `src/index.css` — Add light mode and accessibility variants**
- Add `.light` (or remove `dark` class) `:root` overrides with light background/foreground/card colors
- Add `.colorblind` overrides for `--shot-made` (blue) and `--shot-missed` (yellow)
- Add `[data-text-size="sm"]`, `[data-text-size="lg"]` rules scaling base font size

**5. `src/pages/Index.tsx` — Header + Game Rules card**
- Add Settings gear button and Feedback button to the header (next to New Game/Reset)
- Add a "Game Rules" card below the Data Science Tips card (lines 102-115), styled similarly:
  - 📋 Game Rules heading
  - Individual Mode: 20 shots per player, no same zone twice in a row
  - Team Mode: 30 shots per team, teams can block 2 zones on opponents' boards
  - Scoring: Zone 1 = 1pt, Zones 2-3 = 2pts, Zones 4-6 = 3pts
  - Practice: 5 bonus shots, any zone allowed

**6. `src/App.tsx`**
- Wrap app with `SettingsProvider`

### Files Modified/Created
- `src/context/SettingsContext.tsx` — new (theme, colorblind, text size state + persistence)
- `src/components/SettingsPanel.tsx` — new (settings sheet UI)
- `src/components/FeedbackDialog.tsx` — new (feedback form dialog)
- `src/index.css` — add light mode vars, colorblind overrides, text size scaling
- `src/pages/Index.tsx` — add settings/feedback buttons to header, add game rules card
- `src/App.tsx` — wrap with SettingsProvider

