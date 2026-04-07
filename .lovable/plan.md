

## Plan: Final Combined Summary, Same-Zone Restriction

### Three Features

**1. Same-zone back-to-back restriction (Individual mode)**

In individual mode, prevent a player from shooting in the same zone they just shot in. Show a visual indicator on the court and a message saying which zone is locked.

**Changes:**
- `ShotTracker.tsx`: Track `lastShotZone` per player from the shots array. In `handleCourtClick`, if the detected zone matches the player's last shot zone, show a toast/message and reject the click. Add a visual overlay or dim effect on the locked zone.
- Works for both local and multiplayer — check the last shot for the active player from the `shots` array.

**2. Preserve individual shots for final summary**

Currently `startTeamMode` deletes all shots from the DB before team play. We need to preserve individual-mode shots separately.

**Changes:**
- `MultiplayerContext.tsx`: In `startTeamMode`, instead of deleting shots, add a `game_mode` column to `session_shots` to tag shots as "individual" or "team". **Alternative (no migration):** Store individual shot snapshots in `game_sessions.team_assignments` JSON (alongside teams). This avoids a migration.
- **Chosen approach:** Add a `mode` column to `session_shots` via migration (default "individual"). When team mode starts, don't delete shots — just tag new team shots as "team". Filter shots by mode in the playing views.
- `GameContext.tsx`: Add `individualShots` and `teamShots` filtered arrays. During team play, only show team-mode shots on the court/tracker.

**3. Final summary with Individual / Team / Combined tabs**

After team mode ends, show a tabbed summary with three views.

**Changes:**
- `GameSummary.tsx`: When `gameMode === "team"` and game is over, render a `Tabs` component with:
  - **Individual** tab: Stats computed from individual-mode shots only
  - **Team** tab: Current team stats (from team-mode shots)
  - **Overall** tab: Combined stats from both modes — total points, total FG%, MVP across both rounds
- `Index.tsx`: Pass both individual and team shots to `GameSummary` via props or context.

### Files to modify

| File | Change |
|------|--------|
| Migration | Add `mode` column (`text`, default `'individual'`) to `session_shots` |
| `src/context/MultiplayerContext.tsx` | Stop deleting shots on team start; tag new team shots with `mode: 'team'`; expose `individualShots` and `teamShots` filtered arrays |
| `src/context/GameContext.tsx` | Accept `externalIndividualShots`; expose `individualShots` |
| `src/pages/Index.tsx` | Pass individual shots through; filter team-mode shots for PlayingDashboard |
| `src/components/ShotTracker.tsx` | Add same-zone restriction logic; show locked zone message |
| `src/components/GameSummary.tsx` | Add Tabs (Individual / Team / Overall) for final summary after team mode |

### Migration SQL

```sql
ALTER TABLE public.session_shots ADD COLUMN mode text NOT NULL DEFAULT 'individual';
```

### Same-zone restriction detail

For each player, compute their last shot zone from the shots array:
```ts
const lastShot = shots.filter(s => s.playerId === activePlayerId).at(-1);
const lockedZone = gameMode === "individual" && lastShot ? lastShot.zone : null;
```
If clicked zone === lockedZone, reject with a message. No DB changes needed — purely client-side.

