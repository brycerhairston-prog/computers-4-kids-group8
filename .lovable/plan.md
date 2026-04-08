

## Plan: Make Detailed Stats Table More Appealing

### Problem
The `PlayerStatsTable` is a plain HTML table with minimal styling — just text rows with borders. It needs the same colorful, engaging treatment applied to the accordion sections.

### Changes — `src/components/GameSummary.tsx` (PlayerStatsTable, lines 82–124)

Replace the plain table with styled player cards/rows that match the accordion style:

1. **Player avatar** — Same colored circle with initial as the accordion triggers, using `PLAYER_COLORS`
2. **Colored left border** — 4px left border on each player row matching their color
3. **FG% progress bar** — Same green/yellow/red mini bar used in the accordions, placed next to the FG% number
4. **Points highlight** — Larger, bolder points display with the player's color
5. **Best Zone badge** — Style it as a small colored pill/badge instead of plain text
6. **Basketball emoji** — Add 🏀 next to player names for consistency
7. **Row hover effect** — Subtle background highlight on hover (`hover:bg-secondary/50`)
8. **Card-style rows** — Each player row becomes a rounded card with padding and `bg-card/50` background instead of flat table rows

The layout shifts from a traditional `<table>` to a stacked card list, which is more visually engaging and easier to read on mobile.

### Technical Details

- Reuse `PLAYER_COLORS`, `getFgColor` helpers already in the file
- Each player becomes a flex row card: avatar | name+emoji | stats grid (shots, makes, FG% with bar, points, best zone badge)
- Best zone badge uses inline style with a muted version of the zone's heat color
- Responsive: on small screens the stats wrap below the name

### Files Modified
- `src/components/GameSummary.tsx` — rewrite `PlayerStatsTable` from plain table to styled card rows

