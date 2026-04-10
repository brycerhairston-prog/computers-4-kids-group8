

## Plan: Inset Zone Polygons to Keep Colors Inside Court Lines

### Problem
The zone fill colors bleed over the black court lines because the zone polygons are drawn exactly on top of the lines. When a color fills right up to (or past) a boundary line, it covers the line and looks messy. The colors need to stay cleanly *inside* each zone's boundaries.

### Solution
Shrink each zone polygon inward by ~3-4px so the colored fills stop before reaching the black court lines. This creates a small gap between the color and the line, giving a clean, professional look. Both the heat map clip paths and the shot tracker zone detection will use the same inset geometry.

### Changes

**`src/lib/courtGeometry.ts`**:
- Inset the `PAINT` rectangle by ~3px on each inner edge (left+3, right-3, bottom-3) — top stays at 0 since it's the court edge
- Reduce the `BIG_ARC` radii (`rx`, `ry`) by ~4px to pull the three-point arc inward
- Adjust the diagonal line endpoints inward by ~3-4px
- These changes affect all 6 zone polygons simultaneously since they all derive from the same constants
- Keep `getZoneFromPoint` using the *original* (non-inset) polygons for click detection so taps near lines still register. Export a separate set of `ZONE_FILL_PATHS` for rendering only.

**`src/components/HeatMap.tsx`**:
- Import and use `ZONE_FILL_PATHS` instead of `ZONE_PATHS` for the clip paths so colors stay inside the lines

**`src/components/ShotTracker.tsx`**:
- Use `ZONE_FILL_PATHS` for any zone fill rendering (blocked zone overlays)

### Why Two Sets of Paths
- **`ZONE_PATHS`** (original): Used for click/tap detection — generous boundaries so taps near lines always register in a zone
- **`ZONE_FILL_PATHS`** (inset): Used for visual rendering — colors stay cleanly inside the court lines

### Files Modified
- `src/lib/courtGeometry.ts` — add inset polygon set for rendering
- `src/components/HeatMap.tsx` — use inset paths for clip regions
- `src/components/ShotTracker.tsx` — use inset paths for blocked zone fills

