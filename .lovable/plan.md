

## Plan: Fix Zone 3 Gap and Tighten Zone Boundaries

### Root Cause
Zone 3's polygon has a **self-intersecting path** because the arc points are in the wrong winding order. After placing `RIGHT_ARC_EXTREME` (394,150), the code appends `bottomToRightArc.slice(1)` — but this arc goes from bottom→right, meaning it jumps back down to near (200,306) then retraces up to (394,150). This creates a bowtie shape with an unfilled gap.

Zone 2 handles this correctly by reversing its arc: `leftArcToBottom.slice(0,-1).reverse()`.

### Changes

**`src/lib/courtGeometry.ts`** — Fix Zone 3 arc winding:
- Add a new arc segment: `const rightArcToBottom = sampleEllipseArc(0, Math.PI / 2);` which traces from the right extreme DOWN to the arc bottom
- Replace Zone 3's polygon to use this correctly-wound arc:
  ```
  3: [
    { x: PAINT.right, y: 0 },
    { x: RIGHT_ARC_EXTREME.x, y: 0 },
    RIGHT_ARC_EXTREME,
    ...rightArcToBottom.slice(1),   // correct direction: right → bottom
    { x: ARC_BOTTOM.x, y: PAINT.bottom },
    { x: PAINT.right, y: PAINT.bottom },
  ]
  ```
  (The last point of `rightArcToBottom` is ARC_BOTTOM, so we don't need to add it separately)

This single fix resolves the Zone 3 gap. No changes needed to `HeatMap.tsx` or `ShotTracker.tsx` since both consume `ZONE_PATHS` from this same geometry file.

### Files Modified
- `src/lib/courtGeometry.ts` — fix Zone 3 arc direction

