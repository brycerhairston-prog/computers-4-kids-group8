

## Plan: Add Text Size Slider + Improve Heat Map Color Contrast

### Changes

**1. `src/context/SettingsContext.tsx` — Add `fontSize` number state**
- Add `fontSize: number` (default 16, persisted to localStorage)
- Preset mapping: sm=14, md=16, lg=18
- Add `setFontSize(n: number)` that sets `document.documentElement.style.fontSize`
- When a preset is selected, also update `fontSize`

**2. `src/components/SettingsPanel.tsx` — Add slider below radio buttons**
- Import `Slider` component
- Add slider (range 12–22px) below Small/Medium/Large radio group
- Show current pixel value label
- Radio buttons snap slider to preset; slider allows fine-tuning

**3. `src/components/HeatMap.tsx` — New high-contrast color scale**
- Replace current gradient with:
  - 0%: Blue `rgba(59, 130, 246, 0.65)`
  - 1–20%: Cyan `rgba(6, 182, 212, 0.7)`
  - 21–40%: Light Blue `rgba(96, 165, 250, 0.7)`
  - 41–60%: Yellow `rgba(234, 179, 8, 0.75)`
  - 61–80%: Orange `rgba(249, 115, 22, 0.75)`
  - 81–100%: Red `rgba(239, 68, 68, 0.85)`
- Update legend: `bg-blue-500`, `bg-cyan-500`, `bg-blue-400`, `bg-yellow-500`, `bg-orange-500`, `bg-red-500`

**4. `src/index.css` — Minor tweak**
- Keep `data-text-size` rules as fallbacks, also respect `style.fontSize` from slider

### Files Modified
- `src/context/SettingsContext.tsx`
- `src/components/SettingsPanel.tsx`
- `src/components/HeatMap.tsx`
- `src/index.css`

