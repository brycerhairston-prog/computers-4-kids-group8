
Goal: make team-mode zone blocking actually prevent pin placement on blocked zones while keeping the existing toast message.

Problem
- The click prevention in `ShotTracker.tsx` already exists: it checks blocked zones, shows a toast, and returns before `setPendingPos(...)`.
- The likely failure is earlier in the flow: team setup creates `blockedZones` correctly in `GameSummary.tsx`, but `Index.tsx` rebuilds teams again for random/fair starts and drops the configured `blockedZones` and `shotAllocations`.
- Result: the shot tracker often receives teams without blocked-zone data, so blocked clicks are not treated as blocked.

Implementation plan

1. Preserve the configured team data when team mode starts
- File: `src/pages/Index.tsx`
- Update `handleStartTeamMode(...)` so the third argument is treated as the final configured teams for all selection modes, not just manual mode.
- If configured teams are passed in, use them directly instead of regenerating new team objects.
- This preserves:
  - `blockedZones`
  - `shotAllocations`
  - the original team IDs used during setup

2. Keep the shot tracker check tied to the canonical blocked-zone logic
- File: `src/components/ShotTracker.tsx`
- Keep the existing toast text unchanged.
- Make the click restriction use the normalized blocked-zone source of truth when deciding whether to allow a pin.
- Ensure the blocked-zone branch returns before `setPendingPos(...)`, so no pending marker appears on blocked zones.

3. Keep multiplayer and local play aligned
- Because team assignments are stored and then read back into `GameProvider`, preserving the final team objects in `Index.tsx` will make blocked zones work consistently:
  - on the host
  - on joined devices
  - after team mode starts in multiplayer

Technical details
- Current broken flow:
```text
GameSummary builds finalTeams(with blockedZones)
  -> Index.handleStartTeamMode recomputes teams for random/fair
  -> blockedZones/allocations are lost
  -> ShotTracker sees no blocked zones
  -> pin can still be placed
```

- Target flow:
```text
GameSummary builds finalTeams(with blockedZones)
  -> Index passes finalTeams through unchanged
  -> ShotTracker receives the correct blocked zones
  -> blocked click shows existing toast and does not place a pin
```

Files to update
- `src/pages/Index.tsx`
  - preserve configured teams instead of regenerating them when provided
- `src/components/ShotTracker.tsx`
  - make the blocked-click guard use the canonical blocked-zone check and continue returning before pin placement

Expected result
- In team mode, when a player taps a blocked zone:
  - no pin is placed
  - no pending shot appears
  - the existing blocked-zone toast is shown
- This should work for local games and multiplayer games.
