

## Plan: Auto-Reconnect When Device Wakes Up

### Problem
When a phone screen turns off, the real-time connection drops. When the screen turns back on, the app is frozen on stale state because the subscription is dead and there is no logic to detect this and resync.

### Solution
Two changes in `MultiplayerContext.tsx`:

**1. Persist session info to localStorage**
When joining/creating a game, save `{ sessionId, localPlayerIds, isHost }` to localStorage. On mount, check if a saved session exists and automatically rejoin (re-fetch session, players, shots, re-subscribe). On leave/reset, clear localStorage.

**2. Visibility change listener for reconnection**
Add a `visibilitychange` event listener. When the page becomes visible again and we have an active session:
- Re-fetch the full session, players, and shots from the database
- Re-subscribe to the realtime channel
- This ensures state is fully synced after any connection gap

### Files to Modify

| File | Change |
|------|--------|
| `MultiplayerContext.tsx` | Add localStorage persistence of session ID; add `visibilitychange` handler that re-fetches all data and re-subscribes; add auto-rejoin on mount |

### Key Implementation Details

```ts
// On visibility change (phone wakes up)
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && sessionId) {
    refetchAllState(sessionId);
    subscribeToSession(sessionId);
  }
});
```

The `refetchAllState` function will query `game_sessions`, `session_players`, and `session_shots` for the current session ID and update all state, ensuring the joining device catches up to wherever the host is (lobby, individual play, team play, summary).

