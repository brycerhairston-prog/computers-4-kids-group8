

## Plan: Recalibrate Court Zone Geometry to Match Court Image

### Problem
The zone polygon boundaries (paint box, three-point arc, diagonal lines) defined in `courtGeometry.ts` don't perfectly align with the black lines drawn on the `court-layout.png` image. This causes:
- Heat map colors bleeding past the visible court lines
- Click-to-shoot zone detection registering the wrong zone near boundaries

### Approach
1. Add visible stroke outlines of the zone paths on the Shot Tracker court (temporary debug aid) so zone boundaries are clearly visible against the court image
2. Adjust the geometry constants in `courtGeometry.ts` to match the actual court image lines
3. Remove the debug outlines once alignment is confirmed

### Changes

**`src/lib/courtGeometry.ts`** — Adjust geometry constants to match court image:
- Tune `PAINT` boundaries (left, right, bottom) to align with the painted rectangle
- Tune `BIG_ARC` parameters (cx, cy, rx, ry) to align with the three-point arc curve
- Tune diagonal line endpoints (`LEFT_DIAGONAL_TOP`, `RIGHT_DIAGONAL_TOP`, `LEFT_DIAGONAL_BOTTOM`, `RIGHT_DIAGONAL_BOTTOM`) to match the visible sidelines

**`src/components/ShotTracker.tsx`** — Add faint zone boundary strokes:
- Render each `ZONE_PATHS[zone]` as a stroked `<path>` (no fill) on top of the court image so zones are visually outlined, helping confirm alignment

**`src/components/HeatMap.tsx`** — Same zone boundary strokes for the heat map view

### Technical Detail
The core issue is the hardcoded numeric constants. The fix involves iterative tuning of these values:
```
PAINT: { left, right, top, bottom }
BIG_ARC: { cx, cy, rx, ry }
Diagonal endpoints: 4 points
```

These define all 6 zone polygons. Adjusting them shifts both the click detection and the heat map clip paths simultaneously since both use `ZONE_PATHS` from the same source.

### Files Modified
- `src/lib/courtGeometry.ts` — recalibrate geometry constants
- `src/components/ShotTracker.tsx` — add zone boundary outlines
- `src/components/HeatMap.tsx` — add zone boundary outlines

