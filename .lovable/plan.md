

## Plan: Widen Text Size Range for More Noticeable Differences

Currently the preset sizes are sm=14, md=16, lg=18 and the slider range is 12–22px. The differences are too subtle.

### Changes

**1. `src/context/SettingsContext.tsx`**
- Change `TEXT_SIZE_MAP` to: `{ sm: 10, md: 16, lg: 24 }` — much bigger spread between presets

**2. `src/components/SettingsPanel.tsx`**
- Change slider `min` from 12 to **8**
- Change slider `max` from 22 to **32**
- This gives a much wider range: tiny text on the left, very large text on the right

**3. `src/index.css`**
- Update the `data-text-size` CSS rules to match: `sm` = 10px, `md` = 16px, `lg` = 24px

### Files Modified
- `src/context/SettingsContext.tsx`
- `src/components/SettingsPanel.tsx`
- `src/index.css`

