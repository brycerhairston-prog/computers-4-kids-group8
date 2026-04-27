

## Plan: Make Player Lookup Actually Useful

### 1. Auto-save every player at game end (with auto-generated IDs)
- In `GameSummary`'s auto-save effect, for any session player **not** already linked to a global UUID, call `resolveOrCreatePlayer(undefined, name)` — this generates a `P-XXXXX` ID, creates the row, links it, then `saveGameResult` runs.
- Result: every player who shoots ≥1 attempt becomes lookup-able automatically. No Lobby ID input required.

### 2. Make the Lobby Player ID field clearer
- Add helper text under the input: "Leave blank — we'll generate one. Or type an existing ID to load past stats."
- Show the assigned ID (if linked from lookup) as a small chip next to the player name.

### 3. "Create / Register" button in Lookup dialog when no result
- When search returns nothing, show a **"Register new player with this ID"** button that calls `resolveOrCreatePlayer(query, name)` after prompting for a name (small inline input).
- After creation, show the empty profile card with 0 games — ready to be loaded into the next game.

### 4. New "Players" tab on the opening UI (Lobby screen)
- Add a tabbed layout to the Lobby: **"Current Game"** (existing UI) and **"Players"** (new browse tab).
- The Players tab:
  - Search bar at top (filters by name or Player ID, debounced)
  - Sort dropdown: Recently Played / Most Games / Best FG% / Name A-Z
  - Scrollable list of cards — each card shows: name, Player ID (mono), playstyle tag, games played, FG%, last played (relative time)
  - Click card → opens existing `PlayerProfileDialog` (full charts)
  - Each card has a **"Load into Game"** button that adds them to the current session's player list (using their existing global UUID via `linkSessionToGlobalPlayer`)
  - Empty state: "No players yet. Finish a game to start building the database."

### 5. New helper in `playerDatabase.ts`
- `listAllPlayers({ search?, sortBy?, limit? })` — joins `players` + `player_career_stats`, returns enriched rows for the browse tab.

### Files modified
- `src/lib/playerDatabase.ts` — add `listAllPlayers`
- `src/components/GameSummary.tsx` — auto-create players without manual ID
- `src/components/Lobby.tsx` — add Tabs wrapper, new "Players" tab, helper text on ID input, ID chip display
- `src/components/PlayerLookupDialog.tsx` — add "Register new" flow when no result
- New: `src/components/PlayerBrowseTab.tsx` — the browse/search/load UI
- All 8 i18n locale files — new keys for tab labels, helper text, register button, sort options, empty states

### What stays untouched
Gameplay logic, shot tracking, multiplayer sync, RLS policies (already permissive enough), existing PlayerProfileDialog charts.

### Order
1. Add `listAllPlayers` helper.
2. Auto-save fix in GameSummary.
3. Build `PlayerBrowseTab` component.
4. Wrap Lobby in Tabs and add the new tab.
5. Lookup dialog "register new" button.
6. i18n keys for all 8 languages.
7. Smoke test: play a game without entering IDs → end → open Lobby → see all players in Players tab → load one → verify their career stats persist.

