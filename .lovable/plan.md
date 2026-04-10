

## Plan: Fine-Tune Zone Fill Boundaries

### Summary
Adjust the inset fill polygons so each zone's color fits cleanly within its court lines. These are small pixel-level tweaks to `ZONE_FILL_POLYGONS` in `courtGeometry.ts` — no structural changes needed.

### Changes (all in `src/lib/courtGeometry.ts`)

1. **Zone 1 (Paint) — expand slightly**: Reduce the paint inset from 2 to 1 on left/right/bottom edges so the fill better covers the painted area:
   - `INSET_PAINT.left = PAINT.left + 1`
   - `INSET_PAINT.right = PAINT.right - 1`  
   - `INSET_PAINT.bottom = PAINT.bottom - 1`

2. **Zones 2 and 3 (Mid-Range) — shrink upward**: Pull the bottom boundary of Zones 2/3 up by using `INSET_PAINT.bottom - 2` instead of `INSET_PAINT.bottom` for the horizontal edge where they meet the paint, and similarly pull `INSET_ARC_BOTTOM` up by reducing the inset arc `ry` by an extra 2px (total 4px inset on ry only).

3. **Zone 5 (Center Three) — shrink inward and raise top**: Increase the diagonal inset multiplier for Zone 5's diagonal boundaries from `INSET` (2) to `INSET + 2` (4) to pull left/right edges in. Also raise the arc portion by using the larger `ry` reduction from step 2, which naturally pulls Zone 5's top edge down (toward the basket, i.e., "up" visually since basket is at top).

4. **Zones 4 and 6 (Corner Threes) — expand upward toward arc line**: Reduce the arc inset for the outer arcs only — use `rx - 1` instead of `rx - 2` for the outer arc segments used by Zones 4 and 6, so their fill extends closer to the three-point line.

### Technical Approach
Rather than one global `INSET` constant, introduce zone-specific adjustments:
- `PAINT_INSET = 1` (for Zone 1)
- `ARC_INSET = 2` for inner arcs (Zones 2/3), `ARC_OUTER_INSET = 1` for outer arcs (Zones 4/6)
- `MIDRANGE_BOTTOM_EXTRA = 2` to pull Zones 2/3 bottom edges up
- `DIAGONAL_INSET = 4` for Zone 5's side boundaries

### Files Modified
- `src/lib/courtGeometry.ts` — adjust inset values per-zone for tighter fits

