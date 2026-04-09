

## Plan: Add Settings Panel to Summary Screen and Lobby

The SettingsPanel (gear icon) currently only appears in the main game dashboard header. It needs to also appear on the GameSummary screen and the Lobby (create/join) screen.

### Changes

**1. `src/components/GameSummary.tsx`**
- Import `SettingsPanel` from `@/components/SettingsPanel`
- Add `<SettingsPanel />` in the top header area (near the logo/title) so it's accessible on all summary tabs

**2. `src/components/Lobby.tsx`**
- Import `SettingsPanel` from `@/components/SettingsPanel`
- Add `<SettingsPanel />` to the welcome, create, join, and waiting views — positioned in the top-right or header area of each card so it's always reachable

### Files Modified
- `src/components/GameSummary.tsx` — add SettingsPanel import + render in header
- `src/components/Lobby.tsx` — add SettingsPanel import + render in each view's header area

