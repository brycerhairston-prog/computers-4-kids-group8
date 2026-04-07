

## Plan: Zone Numbers in Labels + Red X on Blocked Zones in Court

### Changes

**1. `src/context/GameContext.tsx`** — Update `ZONE_LABELS` to include zone numbers:
```ts
1: "Zone 1 - Paint"
2: "Zone 2 - Left Mid-Range"
3: "Zone 3 - Right Mid-Range"
4: "Zone 4 - Left Corner Three"
5: "Zone 5 - Center Three"
6: "Zone 6 - Right Corner Three"
```
This automatically propagates to all toast messages, the zone blocking step, the shot placement text, and the blocked zones info line.

**2. `src/components/ShotTracker.tsx`** — Replace the 🚫 emoji on blocked zone overlays with a red **X**:
- Change the SVG `<text>` element from `🚫` to a bold red `✕` (or draw two crossing lines) at each blocked zone's label position
- Keep the red-tinted path overlay as-is

**3. `src/components/ShotTracker.tsx`** — Add a small indicator under each team's collapsible section showing which zones are blocked for that team:
- After the player buttons in each expanded team section, add a row like: `🚫 Blocked: Zone 2, Zone 5`
- Use `team.blockedZones` to display the blocked zone numbers/names

### Files

| File | Change |
|------|--------|
| `GameContext.tsx` | Add zone numbers to `ZONE_LABELS` |
| `ShotTracker.tsx` | Red X on court overlays; blocked zone indicator per team section |

