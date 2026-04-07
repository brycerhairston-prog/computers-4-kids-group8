

## Plan: Fix Overlapping Shots in Individual Mode

### Problem
In individual mode, when displaying shots on the court, the code shows **all players' shots** when no specific player filter is active. This causes shot markers from different players to stack on top of each other.

### Fix

**`src/components/ShotTracker.tsx`** — In the `courtShots` useMemo, always filter shots to the active player in individual mode instead of showing all players' shots:

```ts
const courtShots = useMemo(() => {
  const filterId = selectedPlayerId || activePlayerId;
  const base = filterId ? activeShots.filter(s => s.playerId === filterId) : activeShots;
  if (gameMode === "individual" && activePlayerId) {
    const pShots = practiceShots.filter(s => !filterId || s.playerId === filterId);
    return [...pShots.map(s => ({ ...s, isPractice: true })), ...base.map(s => ({ ...s, isPractice: false }))];
  }
  return base.map(s => ({ ...s, isPractice: false }));
}, [selectedPlayerId, activePlayerId, activeShots, gameMode, practiceShots]);
```

This ensures the court only displays the currently selected/active player's shots, eliminating overlap from other players.

### Files

| File | Change |
|------|--------|
| `ShotTracker.tsx` | Filter `courtShots` to active player in individual mode |

