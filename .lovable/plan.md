

## Plan: Remove "Add Player" Input from Player Stats Table

### Change

**`src/components/DataTable.tsx`** — Delete the input + button section at the bottom of the component (the `<div className="flex gap-2">` block containing the "New player name..." input and "Add" button). This keeps the table clean during gameplay since players are already added during game setup.

### Files Modified
- `src/components/DataTable.tsx` — remove ~10 lines (the add-player form at the bottom)

