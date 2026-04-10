

## Plan: Fix Zone Fill Gaps and Bleeding

### Problems
1. **Zone 4 white gap**: The inset polygon jumps from the arc endpoint directly to the diagonal bottom point at (42,500), skipping the diagonal top point. This creates a straight cut across the zone leaving unfilled white space.
2. **Zone 2 bleeding**: The inset polygon has the same issue in reverse — it doesn't include a proper transition point where the arc meets the diagonal boundary.
3. **Zone 1 underfilled**: The 4px inset is too aggressive for the paint rectangle, making the fill noticeably smaller than the painted area.

### Changes

**`src/lib/courtGeometry.ts`**:

1. **Reduce INSET from 4 to 2** — this keeps colors inside the lines without shrinking zones too visibly (fixes Zone 1)

2. **Fix Zone 4 inset polygon** — add `INSET_LEFT_DIAGONAL_TOP` between the arc endpoint and the diagonal bottom so the polygon traces the diagonal line instead of cutting across:
   ```
   4: [
     (0,0) → inset left arc extreme → along arc →
     INSET_LEFT_DIAGONAL_TOP →    ← NEW: fills the gap
     INSET_LEFT_DIAGONAL_BOTTOM → (0,500)
   ]
   ```

3. **Fix Zone 6 inset polygon** — same mirror fix, add `INSET_RIGHT_DIAGONAL_TOP` so the polygon follows the diagonal line properly

4. **Adjust diagonal inset offsets** — use proper perpendicular offsets for the diagonal lines instead of simple x±4 / y±4, which caused the diagonal boundaries to shift unevenly and bleed

### Files Modified
- `src/lib/courtGeometry.ts` — reduce inset, fix zone 4/6 polygon gaps, adjust diagonal offsets

