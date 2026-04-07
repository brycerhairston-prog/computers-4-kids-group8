

## Fix: Input Focus Loss + Team Mode Shot Carryover

### Issue 1: Input loses focus after each keystroke

**Root cause**: `PlayerNameInputs` is defined as a nested component function inside `Lobby`'s render body (line 130). Every keystroke triggers `setPlayerNames`, which re-renders `Lobby`, which re-creates the `PlayerNameInputs` function reference, causing React to unmount and remount all inputs — losing focus.

**Fix**: Inline the JSX directly instead of wrapping it in a nested component. Replace the `<PlayerNameInputs />` usage on lines 213 and 254 with the actual markup, and remove the `PlayerNameInputs` function definition (lines 130-158).

### Issue 2: Team mode says players hit shot limit

**Root cause**: When transitioning from Individual to Team mode, shots are not cleared. Two paths fail:

1. **Multiplayer path**: `handleStartTeamMode` in `Index.tsx` calls `game.startGame()` which sets local shots to `[]`, but `externalShots` from the database immediately overwrites this via the `useEffect` sync. The individual-mode shots remain in `session_shots` table.

2. **Shot limit check**: `ShotTracker` checks `getPlayerShotCount(playerId)` against `INDIVIDUAL_SHOT_LIMIT` (20). Since individual-mode shots are still present, every player already has 20 shots, so `canShoot` is `false`.

**Fix**:
- In `MultiplayerContext`, add a `clearMultiplayerShots` function that deletes all `session_shots` rows for the current session.
- In `Index.tsx`'s `handleStartTeamMode`, call `clearMultiplayerShots()` before starting the team game.
- In `GameContext.startGame()`, ensure shots are cleared (already done for local mode).

### Files to modify

1. **`src/components/Lobby.tsx`** — Remove `PlayerNameInputs` as a nested component; inline the player name inputs directly at both usage sites (lines 213 and 254).

2. **`src/context/MultiplayerContext.tsx`** — Add `clearMultiplayerShots()` method that runs `DELETE FROM session_shots WHERE session_id = ?`.

3. **`src/pages/Index.tsx`** — In `handleStartTeamMode`, call `mp.clearMultiplayerShots()` before `game.startGame()` so the database is clean and the synced external shots reset.

