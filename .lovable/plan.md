

## Plan: Persistent Player Identity & Lookup System

### Goal
Add a global, persistent player database so players can be identified by a Player ID, looked up across sessions/devices, and have career stats accumulate over time — without breaking the existing game flow.

---

### 1. Database Schema (new tables, no changes to existing)

**`players` table** (global player registry)
- `id` (uuid, PK)
- `player_id` (text, **unique**, case-insensitive via `citext` or normalized lowercase column)
- `name` (text)
- `playstyle_tag` (text, nullable — auto-derived)
- `created_at`, `updated_at`

**`player_career_stats` table** (rolled-up totals)
- `player_id` (FK → players.id, PK)
- `games_played` (int)
- `total_makes`, `total_attempts` (int)
- `total_points` (int)
- `zone_makes` (jsonb: `{1: n, 2: n, ...6: n}`)
- `zone_attempts` (jsonb: `{1: n, ...}`)
- `best_zone` (int, nullable)
- `last_played_at` (timestamptz)

**`player_game_history`** (per-game record, for trend chart)
- `id`, `player_id` (FK), `played_at`
- `game_mode` (individual/team)
- `makes`, `attempts`, `points`
- `zone_breakdown` (jsonb)

**RLS:** All three tables — public read + public insert/update (matches existing `game_sessions` pattern, since this is an open classroom app with no auth).

---

### 2. New files

- `src/lib/playerDatabase.ts` — CRUD helpers: `lookupPlayer(playerId)`, `createPlayer({playerId, name})`, `saveGameResult(playerId, gameStats)`, `getCareerStats(playerId)`, `getRecentGames(playerId)`, `derivePlaystyleTag(stats)`.
- `src/components/PlayerLookupDialog.tsx` — modal with ID input, search, result card (name, games, FG%, makes/attempts, best zone, playstyle), "Load Player" + "View Full Stats" buttons, "No player found → Create new" fallback.
- `src/components/PlayerProfileDialog.tsx` — full profile screen: overview header, FG%-per-zone bar chart (recharts), shot-distribution pie chart, best zone + playstyle highlight, recent-performance line.
- `src/i18n/locales/*.json` — add `playerLookup.*` and `playerProfile.*` keys to all 8 locales.

---

### 3. Modified files (additive only)

- **`src/components/Lobby.tsx`** — in the "Add Player" form add an optional `Player ID` input + datalist of recent IDs (from localStorage) for quick-load. Add a `🔍 Lookup Player` button next to add-player that opens `PlayerLookupDialog`. On duplicate ID detection: prompt "Player exists — load instead?".
- **`src/context/GameContext.tsx`** — extend `Player` interface with optional `playerId?: string`. When `addPlayer` is called from lookup flow, accept the playerId. No behavior change for existing callers (default = auto-generated).
- **`src/components/GameSummary.tsx`** — on mount when `gamePhase === "summary"`, call `saveGameResult(...)` for each player that has a `playerId` (auto-save). Idempotent via a ref guard so it only fires once per game.
- **`src/components/SettingsPanel.tsx`** — (no change needed; lookup lives in lobby).

---

### 4. Playstyle auto-tagging logic
Simple rule-based from career zone breakdown:
- `Sharpshooter` — 3pt zones (4,5,6) ≥ 50% of attempts AND FG% ≥ 35%
- `Paint Beast` — Zone 1 ≥ 40% of attempts AND FG% ≥ 55%
- `Mid-Range Maestro` — Zones 2,3 ≥ 40% of attempts
- `All-Around` — balanced distribution
- `Developing` — < 3 games played

---

### 5. Multiplayer sync
- Player IDs are global (single `players` table, no session scoping) → automatically shared across devices.
- After game save, the `player_career_stats` row is updated; any device looking up that ID sees fresh data.
- No realtime channel needed for the lookup itself (on-demand query is fine and avoids extra subscriptions).

---

### 6. Edge cases handled
- Duplicate ID on add → toast + offer to load existing.
- Blank ID → auto-generate (`P-XXXX` short code, checked for uniqueness).
- Case-insensitive matching (store lowercase `player_id_normalized` column, query against it).
- Offline / DB error → graceful toast, gameplay continues; save retried on next summary.
- Players added without a Player ID work exactly like today (no persistence, no breakage).

---

### What stays untouched
- Existing `GameContext` shot logic, game phases, multiplayer session tables, scoring, court geometry, zone rules, accessibility, i18n keys already in place.

---

### Order of execution
1. Create migration (3 tables + RLS + indexes).
2. Build `playerDatabase.ts` helpers.
3. Build `PlayerLookupDialog` + `PlayerProfileDialog`.
4. Wire into `Lobby` (input + lookup button + quick-load datalist).
5. Auto-save hook in `GameSummary`.
6. Add i18n keys for all 8 locales.
7. Smoke-test: add player with ID → play game → end → re-lookup ID and confirm career stats updated.

