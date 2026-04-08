

## Plan: Liven Up the Main Game UI

### Problem
The playing screen (Shot Tracker, Player Stats table, Heat Map, header) looks plain compared to the colorful summary screen. It needs more color, personality, and visual polish to match.

### Changes

**1. `src/pages/Index.tsx` — Header upgrade**
- Add a subtle gradient border-bottom glow (primary color)
- Add a live shot counter badge with color (e.g., orange badge showing shot count)
- Style the "Game Over!" text with a colored badge instead of plain text
- Add a colored dot next to the game mode label (orange for individual, team color for team)

**2. `src/components/ShotTracker.tsx` — More color and life**
- Player selector buttons: add a colored dot/circle showing the player's color next to their name
- Shot count display: add a mini progress bar under the shot count text showing progress toward the limit, colored green→orange→red as it fills
- Made/Missed confirm buttons: add subtle glow/shadow effects matching their colors
- "Practice" badge: make it more vibrant with a pulsing border
- Locked zone message: add a colored background card instead of plain text
- Section title: add a colored underline accent

**3. `src/components/DataTable.tsx` — Styled table rows**
- Add a colored avatar circle (player's color with initial) in the player name column, similar to the summary screen treatment
- Zone columns with attempts: color-code the text — green for good FG%, red for poor, using the same heat colors
- Points column: larger, bolder with a subtle glow
- Makes column: add a small green accent
- Selected row: stronger highlight with a left border in the player's color
- Section title: add a colored underline accent

**4. `src/components/HeatMap.tsx` — Minor polish**
- Add a colored border accent to the card
- Zone key at bottom: add small colored dots matching the zone heat colors
- Legend: make the color swatches slightly larger and add rounded corners

### Files Modified
- `src/pages/Index.tsx` — header styling upgrades
- `src/components/ShotTracker.tsx` — player buttons, progress bar, button glow, message styling
- `src/components/DataTable.tsx` — player avatars, color-coded stats, row highlights
- `src/components/HeatMap.tsx` — card accent, legend polish

