

## Plan: Switch Heat Map Pie Charts from Hover to Click Toggle

### Problem
The hover-triggered pie charts disappear when moving the cursor toward them, making them unusable for some zones.

### Changes — `src/components/GameSummary.tsx`

**In `PlayerHeatMaps` (~lines 211–280):**

1. Rename `hoveredZone` → `selectedZone` (semantic clarity)
2. Replace `onMouseEnter`/`onMouseLeave` with an `onClick` handler that toggles:
   ```tsx
   onClick={() => setSelectedZone(prev => 
     prev?.playerId === p.id && prev?.zone === zone ? null : { playerId: p.id, zone }
   )}
   ```
3. Remove `onMouseEnter` and `onMouseLeave` from the `<g>` element
4. Keep `cursor: "pointer"` so users know zones are clickable

### Files Modified
- `src/components/GameSummary.tsx`

