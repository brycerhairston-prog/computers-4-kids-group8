

## Plan: Change Text Scaling to Affect Only Text, Not Layout

### Problem
Currently, `document.documentElement.style.fontSize` is set to the chosen pixel value. Since Tailwind uses `rem` units for everything (spacing, padding, widths, etc.), changing the root font-size effectively zooms the entire page layout rather than just scaling text.

### Solution
Instead of changing the root `font-size`, use a CSS custom property (e.g. `--text-scale`) and apply it only to text elements via CSS overrides. This way spacing/padding/layout stays fixed while text grows or shrinks.

### Changes

**1. `src/context/SettingsContext.tsx`**
- Remove `document.documentElement.style.fontSize = ...` 
- Instead, set a CSS variable: `document.documentElement.style.setProperty('--text-scale', fontSize / 16)` (a unitless multiplier)

**2. `src/index.css`**
- Remove the `[data-text-size]` font-size rules
- Add a utility that targets text elements specifically using the `--text-scale` variable:
```css
body {
  --text-scale: 1;
}

p, span, li, td, th, label, h1, h2, h3, h4, h5, h6,
a, button, input, textarea, select {
  font-size: calc(1em * var(--text-scale));
}
```
This scales text content by the multiplier while leaving `rem`-based layout (margins, padding, widths, gaps) untouched.

### Files Modified
- `src/context/SettingsContext.tsx` — swap root font-size for CSS variable
- `src/index.css` — add text-only scaling rules, remove old `[data-text-size]` rules

