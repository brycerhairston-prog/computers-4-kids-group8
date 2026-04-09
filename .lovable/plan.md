

## Plan: Make Tips Cards Collapsible (Open by Default)

Wrap the three info cards — "How to Use", "Data Science Tips", and "Game Rules" — with the Collapsible component (already available at `src/components/ui/collapsible.tsx`). Each will start open and can be toggled closed/open by clicking the header.

### Changes

**`src/pages/Index.tsx`**
- Import `Collapsible, CollapsibleTrigger, CollapsibleContent` from `@/components/ui/collapsible`
- Import `ChevronDown` from `lucide-react` for the toggle indicator
- Wrap each of the 3 cards with `<Collapsible defaultOpen>`:
  - The `h3` header becomes a `CollapsibleTrigger` styled as a clickable row with a chevron that rotates when collapsed
  - The `ul` content goes inside `CollapsibleContent`
- All three cards remain open on first load; clicking the header collapses/expands them

### Visual Behavior
- Header row shows the title + a small chevron arrow on the right
- Chevron rotates 180 degrees when collapsed
- Smooth open/close animation via Radix Collapsible defaults
- Cards keep their existing `glass-card` styling

### Files Modified
- `src/pages/Index.tsx` — wrap 3 cards with Collapsible

