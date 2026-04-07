

## Plan: Fix Blocked Zone Check in Team Mode

### Root Cause

When team data round-trips through the database (stored as JSON in `team_assignments`), the `blockedZones` array values may come back as strings (e.g., `["4", "5"]`) instead of numbers (`[4, 5]`). The check `blockedZones.includes(zone)` then fails because `"4" !== 4`.

### Fix

**`src/components/ShotTracker.tsx`** — Normalize `blockedZones` to numbers when computing them:

```ts
const blockedZones = useMemo(() => {
  if (gameMode !== "team" || !activePlayerId) return [];
  const team = teams.find(t => t.playerIds.includes(activePlayerId));
  return (team?.blockedZones || []).map(Number);
}, [gameMode, activePlayerId, teams]);
```

Also normalize in the blocked zone overlay rendering to ensure the red X visuals match.

Additionally, normalize in `isZoneBlockedForPlayer` in **`src/context/GameContext.tsx`**:

```ts
return team.blockedZones.map(Number).includes(zone);
```

### Files

| File | Change |
|------|--------|
| `ShotTracker.tsx` | `.map(Number)` on blockedZones in the useMemo |
| `GameContext.tsx` | `.map(Number)` in `isZoneBlockedForPlayer` |

