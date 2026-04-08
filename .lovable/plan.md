

## Plan: Make Zone Numbers Visible on Shot Tracker Court

The zone numbers (1–6) are currently white at 45% opacity, making them invisible against the light court image.

### Fix: `src/components/ShotTracker.tsx` (lines 313–323)

Update the `<text>` elements to use a dark stroke outline for contrast against the court background:

```tsx
{[1, 2, 3, 4, 5, 6].map(zone => {
  const pos = ZONE_LABEL_POS[zone];
  return (
    <text key={`zone-num-${zone}`} x={pos.x} y={pos.y}
      textAnchor="middle" dominantBaseline="central"
      fill="white" fontSize="24" fontWeight="900"
      opacity="0.8" stroke="black" strokeWidth="3" paintOrder="stroke"
      style={{ pointerEvents: "none" }}>
      {zone}
    </text>
  );
})}
```

Changes:
- **fontSize**: 18 → 24 (larger)
- **opacity**: 0.45 → 0.8 (much more visible)
- **stroke/strokeWidth/paintOrder**: adds a black outline behind the white text for contrast against any background color

One file, one edit.

