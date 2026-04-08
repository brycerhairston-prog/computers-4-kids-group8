

## Plan: Fix Dark Text on Summary Page Tooltips & Labels

### Problem
When hovering over pie charts on the summary page, the tooltip text (e.g., "Makes", "Misses", numbers) appears in a dark color that's hard to read against the dark tooltip background. Recharts applies its own default dark text color to tooltip items/labels, which overrides the `contentStyle.color`.

### Changes — `src/components/GameSummary.tsx`

**1. Add `itemStyle` and `labelStyle` to all `<Tooltip>` components**

Every `<Tooltip>` in the file (3 instances at lines ~179, ~265, ~321) needs two additional props to force white text on all tooltip elements:

```tsx
<Tooltip
  contentStyle={TOOLTIP_STYLE}
  itemStyle={{ color: "white" }}
  labelStyle={{ color: "white" }}
  ...
/>
```

This ensures the series names ("Makes", "Misses"), values, and any labels inside the tooltip render in white.

**2. Heat map zone labels on the summary courts (lines ~245–249)**

The stat labels on the mini heat map courts use `fill="black"` on a white semi-transparent background — these are fine for readability since they sit on a white rect. No change needed here.

### Files Modified
- `src/components/GameSummary.tsx` — add `itemStyle` and `labelStyle` props to all 3 `<Tooltip>` instances

