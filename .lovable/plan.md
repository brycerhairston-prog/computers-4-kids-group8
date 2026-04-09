

## Plan: Swap Heat Map Colors for 21–40% and 81–100%

### Changes

**1. `src/components/HeatMap.tsx` — Swap colors**

In `getHeatColor`:
- 21–40%: Change from light blue to **red** `rgba(239, 68, 68, 0.85)`
- 81–100%: Change from red to **green** `rgba(34, 197, 94, 0.8)`

In `legendItems`:
- 21–40%: Change from `bg-blue-400` to `bg-red-500`
- 81–100%: Change from `bg-red-500` to `bg-green-500`

**2. Fix runtime error: `useSettings must be used within SettingsProvider`**

The `SettingsPanel` component is rendered inside `Index.tsx`, which is inside `SettingsProvider` in `App.tsx` — so the wrapping looks correct. This may be a stale build artifact. Will verify the component tree renders correctly after the color change edit; if the error persists, will investigate further.

### Files Modified
- `src/components/HeatMap.tsx`

