

## Plan: Add "How to Use" Instructions Below Game Rules

### Change

**`src/pages/Index.tsx`** — Add a new card below the Game Rules card (after line 136)

A new "📖 How to Use" card with the same `glass-card` styling, containing:

- **Shot Tracker:** Select your player, then tap a zone on the court to log a shot. Green pins = made, red pins = missed. Your shot count updates in the progress bar above.
- **Heat Map:** Switch to the Heat Map tab to see color-coded zones. Colors range from blue (cold / low accuracy) to green (hot / high accuracy). Each zone shows makes/attempts and FG%.
- **Stats Table:** The table on the right tracks each player's attempts, makes, FG%, and total points in real time. Tap a player name to filter the heat map to just their shots.
- **Settings (⚙️):** Adjust dark/light mode, colorblind mode, and text size from the gear icon in the header.

### Files Modified
- `src/pages/Index.tsx` — add one new card section

