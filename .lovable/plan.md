

## Plan: Fix Light Mode Contrast for WCAG AA Compliance

### Issue
Light mode uses several low-contrast tokens against the white-ish background (`0 0% 97%`):
- `--secondary-foreground: 220 15% 25%` on `--secondary: 220 15% 92%` — borderline
- `--border: 220 15% 85%` — too light, hard to see form/card edges
- `--input: 220 15% 85%` — same issue, inputs blend into background
- `--court-line: 30 30% 55%` — low contrast on court bg

`--muted-foreground` and `--foreground` are already near-black (12%), so those pass. The main offenders are secondary text, borders, and inputs.

### Fix
Single-file update to `src/index.css` `.light` block — darken low-contrast tokens to meet WCAG AA (4.5:1 normal text, 3:1 UI/large text). Dark mode untouched.

| Token | Current | New | Reason |
|---|---|---|---|
| `--secondary-foreground` | `220 15% 25%` | `220 20% 12%` | Match foreground for body text on secondary bg (>12:1) |
| `--border` | `220 15% 85%` | `220 15% 70%` | UI element contrast >3:1 |
| `--input` | `220 15% 85%` | `220 15% 65%` | Input field edges clearly visible |
| `--muted` | `220 15% 94%` | `220 15% 90%` | Slightly more separation from bg |
| `--court-line` | `30 30% 55%` | `30 40% 35%` | Court lines readable on tan bg |

All other light-mode tokens (`--foreground`, `--muted-foreground`, `--card-foreground`, `--popover-foreground`, `--primary`, `--accent`, `--destructive`) already pass AA — no change.

### Verification
After the change, primary contrast ratios in light mode:
- Foreground (12%) on background (97%) → ~17:1 ✓ AAA
- Muted-foreground (12%) on background (97%) → ~17:1 ✓ AAA
- Secondary-foreground (12%) on secondary (92%) → ~14:1 ✓ AAA
- Primary-foreground (white) on primary (orange 38%) → ~5.5:1 ✓ AA
- Border (70%) on background (97%) → ~3.2:1 ✓ AA (UI)

### Files Modified
- `src/index.css` — only the `.light` block

