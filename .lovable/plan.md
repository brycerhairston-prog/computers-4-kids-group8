

## Plan: Add Multi-Language Translator to Settings

### Goal
Add a language selector in the Settings panel that translates all UI text across the entire app (Lobby, Setup, Gameplay, Summary, Settings) into common languages.

### Approach
Use **react-i18next** (industry standard, works offline, no API costs, instant switching). All translations are bundled JSON files — no network calls, no rate limits.

### Languages (Top 8 most common)
- English (en) — default
- Spanish (es)
- French (fr)
- German (de)
- Chinese Simplified (zh)
- Hindi (hi)
- Arabic (ar) — includes RTL layout support
- Portuguese (pt)

### Changes

**1. Install dependencies**
- `i18next`, `react-i18next`, `i18next-browser-languagedetector`

**2. New files**
- `src/i18n/config.ts` — initialize i18next, register all locale resources, detect saved language from localStorage
- `src/i18n/locales/{en,es,fr,de,zh,hi,ar,pt}.json` — translation key/value pairs organized by section: `lobby`, `setup`, `game`, `summary`, `settings`, `common`

**3. Settings integration**
- `src/context/SettingsContext.tsx` — add `language` state + `setLanguage` that calls `i18n.changeLanguage()` and persists to localStorage; toggle `dir="rtl"` on `<html>` for Arabic
- `src/components/SettingsPanel.tsx` — add a language `<Select>` dropdown above the Theme toggle

**4. Replace hardcoded strings with translation keys**
Use `const { t } = useTranslation()` and replace static text with `t('section.key')` in:
- `src/components/Lobby.tsx` (welcome screen, create/join forms, waiting room, buttons)
- `src/components/GameSetup.tsx` (mode selection, team config)
- `src/components/ShotTracker.tsx` (player labels, shot count text)
- `src/components/DataTable.tsx` (column headers, stats labels)
- `src/components/HeatMap.tsx` (legend, zone labels)
- `src/components/GameSummary.tsx` (winner banner, stats, action buttons)
- `src/components/SettingsPanel.tsx` (all setting labels)
- `src/components/FeedbackDialog.tsx` (form labels)
- `src/pages/Index.tsx` (header subtitle, How to Use, Tips, Rules sections)

**5. Bootstrap**
- `src/main.tsx` — import `./i18n/config` once at startup so i18n is ready before render

### Notes
- Player names, team names, and game codes stay as-is (user-generated content, not translated)
- Translations stored as static JSON = no API key, no cost, instant switching
- RTL support for Arabic via `dir` attribute (Tailwind handles most layout via logical properties)
- Translations will be machine-translated initially; users can request refinements later

### Files Modified
- `package.json` (deps), `src/main.tsx`, `src/context/SettingsContext.tsx`, `src/components/SettingsPanel.tsx`, `src/components/Lobby.tsx`, `src/components/GameSetup.tsx`, `src/components/GameSummary.tsx`, `src/components/ShotTracker.tsx`, `src/components/DataTable.tsx`, `src/components/HeatMap.tsx`, `src/components/FeedbackDialog.tsx`, `src/pages/Index.tsx`

### Files Created
- `src/i18n/config.ts`
- `src/i18n/locales/en.json`, `es.json`, `fr.json`, `de.json`, `zh.json`, `hi.json`, `ar.json`, `pt.json`

