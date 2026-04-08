

## Plan: Add Zone Numbers to Court

Add visible zone number labels (Z1–Z6) on both the Shot Tracker court and the Heat Map court so users can easily correlate zones with the stats table.

### File: `src/components/ShotTracker.tsx`
After the blocked zone overlays (around line 311), before the `<AnimatePresence>` block, add zone number labels:
```tsx
{[1, 2, 3, 4, 5, 6].map(zone => {
  const pos = ZONE_LABEL_POS[zone];
  return (
    <text key={`zone-num-${zone}`} x={pos.x} y={pos.y}
      textAnchor="middle" dominantBaseline="central"
      fill="white" fontSize="18" fontWeight="800"
      opacity="0.45" style={{ pointerEvents: "none" }}>
      {zone}
    </text>
  );
})}
```

### File: `src/components/HeatMap.tsx`
Add zone numbers behind the stat labels but in front of the heat overlay. Inside the SVG, after the heat map zones loop (~line 64) and before the stat labels loop (~line 71), add:
```tsx
{[1, 2, 3, 4, 5, 6].map(zone => {
  const pos = ZONE_LABEL_POS[zone];
  return (
    <text key={`zone-num-${zone}`} x={pos.x} y={pos.y + 22}
      textAnchor="middle" fill="black" fontSize="11"
      fontWeight="700" opacity="0.5" style={{ pointerEvents: "none" }}>
      Z{zone}
    </text>
  );
})}
```

The numbers will appear as semi-transparent labels on the court, non-interactive, so they don't interfere with clicking. Two files, two insertions.

