

## Plan: Fix Text Scaling Not Working

### Problem
In `src/index.css` line 105-107, `body { --text-scale: 1; }` always overrides the `--text-scale` value that JavaScript sets on `document.documentElement` (the `<html>` element). CSS specificity means the body rule wins, so the variable is always `1`.

### Fix

**`src/index.css`** — Move the `--text-scale: 1` default to `:root` instead of `body`, so JavaScript updates on `documentElement` will override it properly.

Change:
```css
body {
  --text-scale: 1;
}
```
To:
```css
:root {
  --text-scale: 1;
}
```

### Files Modified
- `src/index.css` — one line change (line 105)

