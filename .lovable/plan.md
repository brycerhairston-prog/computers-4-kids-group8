

## Plan: Streak Meter Feature

### Concept
Derive each player's current streak from existing shot data — count consecutive `made: true` shots from the most recent backwards until a miss is hit. No database changes required; multiplayer sync works automatically since shots already sync in realtime.

### What Gets Built

**1. New helper in `src/context/GameContext.tsx`**
- `getPlayerStreak(playerId)` → returns `{ current, max }`
- Walks the player's `allShots` (excludes practice) in chronological order:
  - Increment current on make, reset to 0 on miss
  - Track the highest value seen as `max`
- Exposed via context so any component can read it

**2. New component `src/components/StreakMeter.tsx`**
- Vertical bar with 6 segments (1, 2, 3, 4, 5, 6+)
- Fills bottom-up as streak grows
- Color per level:
  - 1 → red
  - 2 → orange
  - 3 → yellow
  - 4 → light green
  - 5 → bright green
  - 6+ → blue with glow/pulse animation
- Smooth Framer Motion fill animation when streak increases
- Flash + shake animation when streak resets (miss)
- Label: "Current Streak: X" + "🔥 Hot Streak!" badge when ≥3
- Compact prop variant for inline display next to player buttons

**3. Integration into `src/components/ShotTracker.tsx`**
- Show full StreakMeter for the **active selected player** in a small panel beside or above the court (right column on desktop, stacked on mobile)
- Show a compact mini-meter chip beside each player's name in the player selector row (individual mode) and in the team-expanded player list (team mode)
- No changes to scoring, heat map, or data table

**4. Add longest streak column to `src/components/DataTable.tsx`**
- New "Longest Streak" column showing `max` from `getPlayerStreak`
- Translatable via existing i18n setup

**5. Translation keys**
Add to all 8 locale files under new `streak` namespace:
- `streak.current` → "Current Streak: {{count}}"
- `streak.hot` → "🔥 Hot Streak!"
- `streak.longest` → "Longest Streak"
- `streak.label` → "Streak"

### Visual Reference
Matches the uploaded image: vertical segmented bar that fills upward with red→yellow→green color progression, with empty white segments above the current fill level.

### What's NOT Touched
- Heat map rendering
- Existing scoring (`ZONE_POINTS`, `getPlayerStats`)
- Database schema or RLS policies
- Multiplayer sync logic (works automatically since streak is derived from synced shots)

### Files Modified
- `src/context/GameContext.tsx` (add `getPlayerStreak`)
- `src/components/ShotTracker.tsx` (integrate meter)
- `src/components/DataTable.tsx` (add longest streak column)
- `src/i18n/locales/*.json` (8 files — streak strings)

### Files Created
- `src/components/StreakMeter.tsx`

