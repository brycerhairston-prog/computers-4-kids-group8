

## Plan: Add Creator Credits Below Subtitle

### Change
Add a small credit line under "Real-time multiplayer analytics game" on the opening screen.

### File: `src/components/Lobby.tsx`
- After line 256 (`<p className="text-sm ...">Real-time multiplayer analytics game</p>`), add:
```tsx
<p className="text-[10px] text-muted-foreground/70 mt-1">
  Created By: Bryce Hairston, Muhammad Zain Abbas, Kassius Ayres, Christopher Lastrape, Abishek Mugunthan
  <br />UVA Engineering Undergraduates
</p>
```

One file, one insertion.

