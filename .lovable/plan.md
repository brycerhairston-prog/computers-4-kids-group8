

## Plan: Restrict shot editing to device-owned players

### How it works

`MultiplayerContext` already tracks `localPlayerIds` — the IDs of players added from the current device. We use this to determine edit permissions.

### Changes

**1. `src/components/ShotTracker.tsx`**
- In multiplayer mode, check if `activePlayerId` is in `mp.localPlayerIds` before allowing shots
- Update `canShoot` to include an ownership check: `!mp.isMultiplayer || mp.localPlayerIds.includes(activePlayerId)`
- Disable player buttons for non-local players (greyed out style but still selectable for viewing)
- Add a small visual indicator (e.g. 🔒 icon or "view only" label) on non-local players
- Allow selecting non-local players to view their shots on the court, but block court clicks and hide Made/Missed buttons
- Restrict the Undo button to only undo shots belonging to local players
- In team mode, apply the same logic per-player within team sections

**2. `src/components/HeatMap.tsx`** (if it has edit controls)
- Same view-only restriction for non-local players — stats are visible but no editing

### No backend changes needed
The `localPlayerIds` array is already populated correctly during `createGame` and `joinGame`. No database or migration changes required.

### User experience
- Your players: full interactivity (place shots, undo, etc.)
- Other players: selectable to view their shot chart and stats, but court shows "View Only" cursor and shot placement is blocked

