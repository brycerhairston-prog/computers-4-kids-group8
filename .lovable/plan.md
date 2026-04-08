

## Plan: Zone Pie Charts, Per-Player Heat Maps & Tooltip Fix on Summary Page

### Overview
Replace the bar chart player comparison with per-zone pie charts sized by performance, add per-player heat maps to the summary, add hoverable pie charts on heat map zones, and fix tooltip text color.

### 1. Replace `PlayerBarChart` with `PlayerZonePieCharts`
**File: `src/components/GameSummary.tsx`**

Remove the `PlayerBarChart` component (lines 121–148) and replace with a new `PlayerZonePieCharts` component that:
- For each player, renders 6 small pie charts (one per zone) showing makes vs misses
- Each pie chart's **size scales** based on FG% in that zone (e.g. outerRadius ranges from 20 at 0% to 55 at 100%)
- Layout: one row per player with their name, then 6 pie charts labeled Z1–Z6
- Tooltip on hover shows makes/attempts and FG% with **white text** (fix the color issue)

### 2. Add Per-Player Heat Maps on Summary Page
**File: `src/components/GameSummary.tsx`**

Create a new `PlayerHeatMaps` component that:
- Renders a grid of mini heat map courts (one per player)
- Reuses the same court background, zone paths, and `getHeatColor` logic from `HeatMap.tsx`
- Each zone on the mini court has a **hoverable pie chart overlay** (rendered as an HTML popover or SVG foreignObject) that appears on hover showing:
  - In individual mode: that player's makes/misses pie for the zone
  - In team mode: breakdown of each player on the team + team total for the zone
- Player name displayed above each mini court

### 3. Fix Tooltip Text Color
**File: `src/components/GameSummary.tsx`**

Update all `Tooltip` `contentStyle` objects to use `color: "white"` and a dark background (`background: "hsl(var(--popover))"`) so text is always readable. Applies to:
- The new zone pie chart tooltips
- The existing `TeamPerformanceSection` pie chart tooltip (line 188)

### 4. Wire Into Summary Layout
**File: `src/components/GameSummary.tsx`**

Replace every `<PlayerBarChart ... />` call with `<PlayerZonePieCharts ... />` and add `<PlayerHeatMaps ... />` after the stats table in each tab:
- Individual tab (line 663): add heat maps using `individualShots`
- Team tab (line 672): add heat maps using `teamShots`, with team breakdown on hover
- Overall tab (line 681): add heat maps using `allShots`
- Non-tabbed view (line 692): same pattern

### Technical Details
- Extract `getHeatColor` from `HeatMap.tsx` into a shared util or duplicate in GameSummary
- Use Recharts `PieChart` with dynamic `outerRadius` for scaling
- For zone hover pie charts on the court, use SVG `<foreignObject>` to embed small Recharts pie charts at `ZONE_LABEL_POS` coordinates, shown/hidden via React state on mouseEnter/mouseLeave
- All tooltip `contentStyle` will use: `{ background: "hsl(220, 20%, 15%)", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "white", fontSize: 11 }`

### Files Modified
- `src/components/GameSummary.tsx` — main changes (replace bar chart, add heat maps, fix tooltips)

