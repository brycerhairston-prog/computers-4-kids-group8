## Plan: Stretch Court Image to Match Zone Mapping

### The actual problem
The zone polygons are defined in a `400 x 500` viewBox (aspect 0.8), but `court-layout.png` is a `1024 x 1024` square image. Both `ShotTracker` and `HeatMap` already use `preserveAspectRatio="none"` on the `<image>` so it stretches inside the SVG — but the outer SVG itself uses `preserveAspectRatio="xMidYMid meet"` and renders at the container's aspect ratio (which the parent CSS controls). The result: the painted court lines don't visually align with the zone boundaries.

The fix is **not** to remap zones — it is to make the image area exactly match the zone coordinate space the polygons are drawn in, so the painted lines and zone polygons coincide.

### Approach
Change the rendered shape of the SVG so its on-screen pixel area uses the same proportions as the zone math, and stretch the PNG to fill it. This means:

1. **Keep `viewBox="0 0 400 500"`** (zones already computed against this).
2. **Force the SVG to render at exactly 400:500 aspect** using a CSS `aspect-ratio: 400 / 500` wrapper (or `aspect-ratio: 4 / 5`).
3. **Switch the outer SVG `preserveAspectRatio` to `none`** so its internal coordinate system stretches to fill that wrapper edge-to-edge — guaranteeing every zone polygon and the image both occupy the same visible pixels.
4. **Keep the `<image preserveAspectRatio="none">`** so the 1024×1024 PNG is stretched to fill the 400×500 viewBox (slightly squashed vertically — same squash applied to zones, so lines align).
5. Apply this to both `ShotTracker.tsx` and `HeatMap.tsx`.

Click coordinates already work in percentages of the rendered SVG bounding rect, so they will continue to map correctly into the zone polygons (both are in the same stretched space).

### Files to edit
- `src/components/ShotTracker.tsx` — wrap court `<svg>` in a `aspect-[4/5] w-full` div; set `preserveAspectRatio="none"` on the SVG; SVG uses `width="100%" height="100%"`.
- `src/components/HeatMap.tsx` — same treatment for the heat map SVG.

No changes needed to `courtGeometry.ts`, click handlers, shot positions, or the PNG asset.

### What stays the same
- Zone polygons, label positions, scoring, click→zone detection.
- All shot rendering math (`(x/100) * 400`, `(y/100) * 500`).
- Player flow, multiplayer, i18n.

### Verification after implementation
- Open Shot Tracker — painted court lines (3-pt arc, paint, mid-range diagonals) should overlap the zone boundaries within a few pixels.
- Tap each zone — number that flashes matches the zone label.
- Heat Map — colored zones overlay the painted court lines correctly.
