

## Plan: Add Strategy, Pattern Recognition & Experimental Thinking Tips

Add three new tip sections to the existing "Data Science Tips" cards across the main UI and summary screens. The new content will be appended as additional categorized bullet groups within each existing tips card to keep things clean (one card, multiple sections) rather than adding separate cards.

### Content to Add (after existing 3 bullets in each tips card)

Three new sub-sections with a subtle section header for each:
- **🎯 Strategy & Decision-Making** — 3 tips (Smart Shots, Risk vs Reward, Adjust in Real Time)
- **🔍 Pattern Recognition** — 3 tips (Hot/Cold Streaks, Shot Clustering, Avoid Cold Zones)
- **🧪 Experimental Thinking** — 3 tips (Test Hypotheses, Change Variables, Learn from Data)

### Files Modified

**1. `src/pages/Index.tsx`** (lines 106-118)
- Expand the Data Science Tips card to include the 3 new sub-sections after the existing bullets

**2. `src/components/GameSummary.tsx`** (4 locations: lines 900-907, 919-926, 938-945, 961-968)
- Same expansion at each of the 4 Data Science Tips cards in the summary tabs

### Layout Approach
Each tips card will have the existing "🧠 Data Science Tips" header and bullets, followed by three mini-headers (styled as bold colored text, same size as existing bold items) with their respective bullets underneath. This keeps everything in one clean card without clutter.

