

## Plan: Add Data Science Tips Card to Summary Screen

### Change — `src/components/GameSummary.tsx`

Add the same "🧠 Data Science Tips" card that appears on the main game screen to the summary screen. Place it at the bottom of each tab's content (and the non-tabbed view), right after the last section.

The card content (copied from `src/pages/Index.tsx` lines 101–114):

```tsx
<div className="glass-card rounded-xl p-4 space-y-2">
  <h3 className="text-sm font-display font-bold text-primary">🧠 Data Science Tips</h3>
  <ul className="text-xs text-muted-foreground space-y-1.5">
    <li><strong className="text-foreground">FG% (Field Goal Percentage)</strong> = Makes ÷ Attempts × 100.</li>
    <li><strong className="text-foreground">Hot Zones</strong> show where a player shoots best.</li>
    <li><strong className="text-foreground">Pattern Recognition:</strong> Look for clusters of green pins.</li>
  </ul>
</div>
```

This will be added in four locations:
1. End of `TabsContent value="individual"` (after Detailed Stats, ~line 899)
2. End of `TabsContent value="team"` (~line 910)
3. End of `TabsContent value="overall"` (~line 921)
4. End of the non-tabbed fallback view (~line 936)

### Files Modified
- `src/components/GameSummary.tsx` — add tips card in 4 places

