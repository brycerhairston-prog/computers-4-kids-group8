

## Fix: Non-host summary transition + Team mode sync across devices

### Problems

1. **Non-hosts don't see summary screen**: While `isGameOver` should compute correctly from synced shots, non-host devices have no way to know when the host transitions to team mode. There's also no explicit "finished" state in the database, so all devices rely on local shot-count computation which can be fragile with realtime timing.

2. **Team mode doesn't propagate to non-hosts**: Team assignments are purely local state in `GameContext`. When the host picks Random/Manual/Fair teams and starts team play, non-host devices never receive the team data or mode change.

3. **Stale closure in `startGame`**: `setGameMode("team")` is queued but `startGame()` still reads the old `gameMode === "individual"`, skipping team creation on the host.

### Plan

**1. Database migration — add `team_assignments` column to `game_sessions`**

```sql
ALTER TABLE public.game_sessions ADD COLUMN team_assignments jsonb DEFAULT NULL;
```

This stores the finalized teams as JSON (e.g. `[{id, name, playerIds}, ...]`) so all devices share the same team data.

**2. Use `game_sessions.status` to drive transitions across all devices**

Add new status values beyond "waiting" and "playing":
- `"individual_done"` — individual mode complete, show summary
- `"team_playing"` — team mode active

When the host detects `isGameOver` in individual mode, update session status to `"individual_done"`. All devices subscribe to session changes and will see this status, triggering the summary screen.

When host starts team mode, update session with `status = "team_playing"`, `game_mode = "team"`, and `team_assignments = [...]`. All devices pick this up and enter team play.

**3. Fix `GameContext.startGame` — accept explicit params**

Change `startGame` to accept optional `{ mode, teams }` so it doesn't depend on stale closure state. When called with params, it sets `gameMode`, `teams`, `shots=[]`, and `gamePhase="playing"` atomically.

**4. Update `MultiplayerContext`**

- Expose `session.game_mode` and parsed `session.team_assignments` as reactive state
- Add `finishIndividualMode()` — sets session status to `"individual_done"`
- Add `startTeamMode(teams)` — sets status to `"team_playing"`, game_mode to `"team"`, team_assignments to the JSON, and clears shots

**5. Update `Index.tsx` — `MultiplayerGameWrapper` and `GameRouter`**

- Map session status to `externalPhase`: `"individual_done"` → show summary, `"team_playing"` → playing
- Pass `externalTeams` from session's `team_assignments` into `GameProvider`
- Pass `externalGameMode` from session's `game_mode` into `GameProvider`
- In `GameRouter`, when `isGameOver` becomes true in multiplayer individual mode AND host, call `mp.finishIndividualMode()`
- Non-hosts see `session.status === "individual_done"` and render `GameSummary`
- `handleStartTeamMode` computes teams locally and calls `mp.startTeamMode(computedTeams)` — all devices react

**6. Update `GameProvider` — accept external teams and game mode**

Add `externalTeams` and `externalGameMode` props synced via `useEffect`, same pattern as existing `externalPlayers`/`externalShots`.

**7. Update `ShotTracker` team selector UI**

Add collapsible Team A / Team B sections with shot counts, as previously planned. Each section expands to show its players.

### Files to modify

| File | Change |
|------|--------|
| Migration SQL | Add `team_assignments` column |
| `src/context/MultiplayerContext.tsx` | Add `finishIndividualMode`, `startTeamMode`; expose parsed teams |
| `src/context/GameContext.tsx` | Accept `externalTeams`/`externalGameMode` props; fix `startGame` params |
| `src/pages/Index.tsx` | Drive routing from session status; pass external teams/mode; auto-finish on host |
| `src/components/GameSummary.tsx` | Pass computed teams through `onStartTeamMode` callback |
| `src/components/ShotTracker.tsx` | Add Team A/B collapsible player selector in team mode |

