

## Plan: Add "Click a zone" Hint to Heat Maps

### Change — `src/components/GameSummary.tsx` (line 287)

Add a small instructional hint below the "🔥 Player Heat Maps" heading:

```tsx
<p className="text-xs text-muted-foreground">👆 Click on a zone to view shot breakdown pie charts</p>
```

This goes right after line 287 (`<h3>` tag), inside the existing `space-y-4` container.

### Files Modified
- `src/components/GameSummary.tsx` — add hint text below the heat maps heading

