

## Plan: Replace Basketball Emoji with C4K Logo

### What
Replace all basketball emoji (🏀) icons used as decorative headers/logos with the uploaded C4K logo image. Keep the emoji in button text labels (e.g., "🏀 Start Game") since those are inline text, not logo placements.

### Steps

1. **Copy the uploaded image into the project**
   - Copy `user-uploads://Screenshot_2026-04-07_at_3.34.08_AM.png` → `src/assets/c4k-logo.png`

2. **Replace decorative emoji instances with `<img>` tags** across 4 files:

| File | Location | Current | Replacement |
|------|----------|---------|-------------|
| `Lobby.tsx` | Line 94 | `<span className="text-4xl">🏀</span>` | `<img src={c4kLogo} alt="C4K" className="w-10 h-10" />` |
| `Lobby.tsx` | Line 253 | `<span className="text-5xl">🏀</span>` | `<img src={c4kLogo} alt="C4K" className="w-12 h-12" />` |
| `GameSetup.tsx` | Line 69 | `<span className="text-4xl">🏀</span>` | `<img src={c4kLogo} alt="C4K" className="w-10 h-10" />` |
| `GameSummary.tsx` | Line 524 | `<span className="text-2xl">🏀</span>` | `<img src={c4kLogo} alt="C4K" className="w-8 h-8" />` |
| `Index.tsx` | Line 36 | `<span className="text-2xl">🏀</span>` | `<img src={c4kLogo} alt="C4K" className="w-8 h-8" />` |

Each file gets `import c4kLogo from "@/assets/c4k-logo.png"` at the top.

3. **Keep emoji in button labels** — "🏀 Start Game", "🏀 Start Team Mode" stay as-is since those are inline button text, not logos.

