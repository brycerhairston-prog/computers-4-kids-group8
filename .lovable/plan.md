

## Plan: Dynamic Team Count Based on Stations

### What Changes

Currently the app is hardcoded to 2 teams (Team A and Team B). This plan adds:

1. **A "Number of Teams" selector** on the summary screen's team setup UI — lets the host pick 2, 3, 4, etc. teams before choosing Random/Manual/Fair
2. **Dynamic team generation** — Random, Fair, and Manual modes all create N teams instead of always 2
3. **Updated Manual assignment UI** — shows N team columns instead of just A/B
4. **Updated ShotTracker team tabs** — collapsible sections for all N teams, not just 2

### Files to modify

| File | Change |
|------|--------|
| `src/components/GameSummary.tsx` | Add team count selector (default = number of stations in multiplayer, or 2). Refactor manual assignment from hardcoded teamA/teamB to a dynamic `manualTeams: Record<number, string[]>`. Update `onStartTeamMode` signature to pass N teams. |
| `src/pages/Index.tsx` | Update `handleStartTeamMode` to accept a `teamCount` param and generate N teams for random/fair modes using round-robin distribution instead of binary split. |
| `src/components/ShotTracker.tsx` | Already uses `teams.map(...)` for collapsible sections — no changes needed since it's already dynamic. |
| `src/context/GameContext.tsx` | No changes — `Team[]` already supports N teams. |

### Key Details

**Team naming**: Teams are named alphabetically — Team A, B, C, D, etc.

**Random mode with N teams**: Shuffle players, distribute round-robin across N teams.

**Fair mode with N teams**: Sort players by points descending, snake-draft across N teams (1→N, N→1, repeat).

**Manual mode**: Show N columns. Each player gets N buttons ("→ A", "→ B", "→ C", etc.). All players must be assigned before starting.

**Default team count**: In multiplayer, default to the number of unique stations (devices). In local mode, default to 2.

**GameSummary `onStartTeamMode` signature change**:
```
onStartTeamMode(selectionMode, teamCount, manualTeams?)
```
Where `manualTeams` becomes `Team[]` (array of N teams with playerIds) instead of `{teamA, teamB}`.

