

## Plan: Clean Up Zone Performance Pie Charts Layout

### Problem
The `PlayerZonePieCharts` component currently dumps all players and their 6 pie charts into one flat section with no visual separation, making it look cluttered.

### Changes — `src/components/GameSummary.tsx`

**Restyle `PlayerZonePieCharts` (lines ~140–191):**

1. **Per-player card with border**: Wrap each player's row in a bordered card with padding, rounded corners, and subtle background:
   ```tsx
   <div className="border border-border rounded-lg p-4 bg-secondary/30 space-y-3">
   ```

2. **Player name as a styled header**: Make the player name more prominent with a left-accent bar or badge style, e.g.:
   ```tsx
   <div className="flex items-center gap-2">
     <div className="w-1 h-5 bg-primary rounded-full" />
     <h4 className="text-sm font-bold text-foreground">{p.name}</h4>
   </div>
   ```

3. **Zone pie chart cells with borders**: Wrap each zone's pie chart + label in a small bordered cell with centered content:
   ```tsx
   <div className="flex flex-col items-center border border-border/50 rounded-md p-2 bg-card/50">
   ```

4. **Add spacing between players**: Use `gap-4` on the parent container instead of `space-y-4` for consistent spacing.

5. **Zone label styling**: Make the zone label header (e.g. "Z1 (1pt)") slightly more prominent with a subtle background pill.

### Files Modified
- `src/components/GameSummary.tsx` — restyle `PlayerZonePieCharts` component only

