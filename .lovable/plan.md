

## Plan: Enlarge Heat Map Hover Pie Charts

### Change — `src/components/GameSummary.tsx` (~lines 264–281)

Increase the `foreignObject` and inner `div` dimensions from `90×90` to `130×130`, and adjust the position offset so the pie chart stays centered above/near the zone label:

- `foreignObject`: change `x={pos.x - 45}` → `x={pos.x - 65}`, `width="90" height="90"` → `width="130" height="130"`
- Inner `div`: change `width: 90, height: 90` → `width: 130, height: 130`
- `Pie outerRadius`: increase from default (~35) to `50` for a larger, more readable chart

### Files Modified
- `src/components/GameSummary.tsx` — resize foreignObject, div, and pie radius in `PlayerHeatMaps` hover overlay

