

## Plan: Make Accordion Tabs More Fun & Engaging for Young Students

### Problem
The accordion triggers for player sections look plain — just text and a chevron on a dark card. For a younger audience, they need more color, personality, and visual feedback.

### Changes

**1. `src/components/GameSummary.tsx` — Restyle all AccordionItem/Trigger instances**

For both `PlayerZonePieCharts` and `PlayerHeatMaps`:

- Replace the thin `w-1 h-5` color bar with a **colored circle avatar** showing the player's first initial (using the player's assigned color from the context)
- Add a **colorful left border** (4px) on each AccordionItem using the player's color
- Add a **subtle gradient background** on the trigger that shifts on hover (e.g., from `bg-secondary/30` to a slight glow of the player's color)
- Replace the plain chevron with a **bouncy animated arrow** — use framer-motion to add a small scale pulse when collapsed, and rotate smoothly on open
- Add a small **emoji badge** (e.g., basketball 🏀) next to each player name
- Show a **mini FG% progress bar** (colored green-to-red based on percentage) inline in the trigger alongside the text stats
- On open state, add a subtle **top border glow** matching the player's color

**2. `src/components/ui/accordion.tsx` — No changes needed**

All styling will be applied via className overrides in GameSummary.

### Technical Details

- Player colors come from `useGame().players` — each player has a `color` property
- The colored avatar: `<div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: playerColor }}>{initial}</div>`
- Mini progress bar: a small `<div>` with width set to FG%, colored with a green-yellow-red gradient
- Framer-motion `animate` on the chevron for smooth rotation
- AccordionItem gets `style={{ borderLeftColor: playerColor }}` with `border-l-4`

### Files Modified
- `src/components/GameSummary.tsx` — restyle accordion triggers in both PlayerZonePieCharts and PlayerHeatMaps

