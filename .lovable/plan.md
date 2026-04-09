

## Plan: Move "How to Use" Card to Left Column

Move the "📖 How to Use" card from the right column (below Data Science Tips and Game Rules) to the left column (below the Shot Tracker/Heat Map tabs), so users can see instructions alongside the court without scrolling.

### Changes

**`src/pages/Index.tsx`**
- Cut the "📖 How to Use" card (lines 143-159) from the right column
- Paste it into the left column `<div>` (after the `</Tabs>` closing tag, around line 102), so it sits directly below the court

### Result
- Left column: Shot Tracker / Heat Map tabs + How to Use card
- Right column: DataTable + Data Science Tips + Game Rules (less scrolling needed)

### Files Modified
- `src/pages/Index.tsx` — move one block (~17 lines)

