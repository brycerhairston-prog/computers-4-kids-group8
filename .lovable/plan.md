

## Plan: Zone Blocking, Shot Allocation, and Practice Shots

Three new features to add to the game flow.

### 1. Practice Shots (5 per player, Individual Mode)

Before individual mode scoring begins, each player gets 5 practice shots that don't count toward their stats.

**How it works:**
- Add a `practice` mode tag to shots (alongside `individual` and `team`)
- In `ShotTracker.tsx`, track practice shot count per player. When a player has < 5 practice shots, show "Practice Shot X/5" instead of the normal counter
- Practice shots appear on the court with a different visual (e.g., dashed outline, muted color) so players know they don't count
- After 5 practice shots, automatically transition to real shots (show a toast: "Practice complete! Real shots now count")
- Practice shots are excluded from all stats calculations (filter by `mode !== 'practice'`)
- The same-zone restriction does NOT apply during practice
- In `GameContext.tsx`, update `activeShots` and `getPlayerShotCount` to exclude practice shots from limits

**Files:** `ShotTracker.tsx`, `GameContext.tsx`, `MultiplayerContext.tsx` (tag practice shots)

### 2. Team Shot Allocation (before team mode starts)

After teams are formed but before team play begins, prompt the host to decide how many shots each player on each team takes. Rules: 30 total per team, min 5 per player, max 15 per player.

**How it works:**
- Add a new intermediate step in `GameSummary.tsx` after team selection: "Shot Allocation" screen
- Show each team with its players and a number input (slider or +/- buttons) for each player's shot count
- Default: distribute 30 evenly (e.g., 3 players = 10 each)
- Validation: total must equal 30, each player 5-15
- Store allocations as part of team data: `Team` interface gets optional `shotAllocations?: Record<string, number>`
- In `ShotTracker.tsx` and `GameContext.tsx`, use per-player limits from `shotAllocations` instead of just the team total
- `getPlayerShotCount` checks against allocation; player is done when they hit their allocated number
- Team is done when all players hit their allocations (sum = 30)

**Files:** `GameSummary.tsx` (allocation UI), `GameContext.tsx` (Team interface, per-player limits), `ShotTracker.tsx` (show per-player limit), `Index.tsx` (pass allocations through), `MultiplayerContext.tsx` (persist in team_assignments JSON)

### 3. Zone Blocking (2 zones per team on other teams' boards)

Before team play begins (after shot allocation), each team selects 2 zones to block on each other team's board.

**How it works:**
- Add another intermediate step after shot allocation: "Zone Blocking" screen
- Each team picks 2 zones to block for each opposing team (visual zone picker showing the 6 zones)
- Store blocked zones in team data: `Team` interface gets optional `blockedZones?: number[]` (zones blocked ON this team by opponents)
- In `ShotTracker.tsx`, treat blocked zones like locked zones — clicking them shows "This zone is blocked!" and rejects the shot
- Blocked zones get a visual overlay (red X or strikethrough) on the court
- In multiplayer, host configures all blocking; stored in `team_assignments` JSON

**Files:** `GameSummary.tsx` (blocking UI), `GameContext.tsx` (Team interface), `ShotTracker.tsx` (enforce blocks), `Index.tsx`/`MultiplayerContext.tsx` (persist)

### Flow Summary

```text
Individual Mode:
  Practice (5 shots/player) → Scoring (20 shots/player) → Summary

Team Mode Transition:
  Team Selection → Shot Allocation → Zone Blocking → Team Play (30 shots/team) → Final Summary
```

### Data Model Changes

**`Team` interface** (in `GameContext.tsx`):
```ts
export interface Team {
  id: string;
  name: string;
  playerIds: string[];
  shotAllocations?: Record<string, number>;  // playerId → shot count
  blockedZones?: number[];                    // zones blocked ON this team
}
```

No database migration needed — these are stored in the existing `team_assignments` JSONB column.

### Files to Modify

| File | Changes |
|------|---------|
| `GameContext.tsx` | Update `Team` interface; exclude practice shots from stats; add per-player shot limit logic |
| `GameSummary.tsx` | Add shot allocation step and zone blocking step between team selection and start |
| `ShotTracker.tsx` | Handle practice mode; enforce blocked zones; show per-player shot limits in team mode |
| `Index.tsx` | Pass updated team data (with allocations/blocks) through to game start |
| `MultiplayerContext.tsx` | Tag practice shots with `mode: 'practice'`; allocations/blocks persist via team_assignments |

