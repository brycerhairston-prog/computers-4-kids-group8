

## Plan: Translate Remaining Game UI Components

### Scope
Replace hardcoded English strings with `t()` translation calls in the gameplay components that were skipped in the initial i18n pass.

### Components to Translate

**1. `src/components/DataTable.tsx`** — Player Stats tab
- Title "📊 Player Stats"
- Description "Click a player row to filter the heat map..."
- Column headers: "Player", "Makes", "Pts", zone tooltips ("X point(s)")
- CSV button label

**2. `src/components/ShotTracker.tsx`** — Shot Tracker tab
- Title "📍 Shot Tracker"
- "Practice", "View Only", "Undo" labels
- Shot count display ("X/Y shots", "Practice: X/Y", team count text)
- Limit-reached messages ("X has reached their shot limit!", etc.)
- Locked/blocked zone notices ("Can't shoot in X twice in a row", "Blocked zones: ...")
- Pending shot confirmation: "Made", "Missed", "Cancel"
- Bottom status: "Placing shot for X in Y (Zpt zone)"
- Team "Done" badge, "Blocked: ..." label

**3. `src/components/HeatMap.tsx`** — Heat Map tab
- Title, legend labels (0%, 1-20%, 21-40%, etc.), zone labels if any descriptive text

**4. `src/components/GameSummary.tsx`** — Post-game screen
- Winner banner, tab labels (Individual/Team/Overall), stat labels, action buttons (Play Again, Export, etc.)

**5. `src/components/GameSetup.tsx`** — Setup screen
- Mode titles/descriptions, team config labels, Start Game button

### Translation Keys
Add new keys to all 8 locale files (`en/es/fr/de/zh/hi/ar/pt.json`) under new sections:
- `dataTable.*` — stats table strings
- `shotTracker.*` — shot tracker strings (with interpolation: `{{playerName}}`, `{{count}}`, `{{limit}}`, `{{zone}}`)
- `heatMap.*` — legend and labels
- `summary.*` — extend existing summary keys
- `setup.*` — extend existing setup keys

### Approach Per File
For each component:
1. Add `import { useTranslation } from "react-i18next"` and `const { t } = useTranslation()`
2. Replace string literals with `t('key')` or `t('key', { interpolatedVar })`
3. Keep dynamic content (player names, numbers, zone labels from `ZONE_LABELS`) as variables passed into translations

### Notes
- `ZONE_LABELS` from `GameContext` (e.g. "Paint", "Mid-Range") will be added as a `zones.*` translation namespace so they translate too
- Emoji icons (📊, 📍, 🏋️, ✓, ✗) stay in keys — they're universal
- Numbers and player-entered names are not translated

### Files Modified
- `src/components/DataTable.tsx`, `src/components/ShotTracker.tsx`, `src/components/HeatMap.tsx`, `src/components/GameSummary.tsx`, `src/components/GameSetup.tsx`
- All 8 files in `src/i18n/locales/`

