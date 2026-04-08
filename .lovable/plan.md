

## Plan: Wrap Both Zone Pie Charts AND Heat Maps in Collapsible Accordions Per Player

### Problem
Both the zone pie charts and the per-player heat maps display all at once, making the summary page overwhelming.

### Solution
Use the existing `Accordion` component to make each player's section collapsible in **both** `PlayerZonePieCharts` and `PlayerHeatMaps`. All sections start collapsed by default.

### Changes — `src/components/GameSummary.tsx`

**1. Import Accordion components** at the top:
```tsx
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
```

**2. Refactor `PlayerZonePieCharts` (~lines 141–201)**
- Replace outer container with `<Accordion type="multiple">`
- Each player's bordered card becomes an `AccordionItem`
- Player name + overall FG% header → `AccordionTrigger`
- The grid of 6 zone pie charts → `AccordionContent`

**3. Refactor `PlayerHeatMaps` (~lines 203–290)**
- Same pattern: wrap in `<Accordion type="multiple">`
- Each player's mini court card becomes an `AccordionItem`
- Player name header → `AccordionTrigger`
- The SVG court heat map → `AccordionContent`

Both default to all-collapsed so the page stays clean.

### Files Modified
- `src/components/GameSummary.tsx`

