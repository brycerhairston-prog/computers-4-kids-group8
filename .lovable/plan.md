

## Plan: Add Zone Number to Best Zone Labels

### Changes — `src/components/GameSummary.tsx`

**Line 98**: Change the `bestZoneLabel` to include the zone number. Currently it strips "Zone N - " from the label. Instead, format it as the zone name followed by "(Zone N)".

```
// Before
ZONE_LABELS[p.bestZone.zone]?.replace(/Zone \d+ - /, "") ?? ""

// After  
`${ZONE_LABELS[p.bestZone.zone]?.replace(/Zone \d+ - /, "") ?? ""} (Zone ${p.bestZone.zone})`
```

This applies to the best zone badge in `PlayerStatsTable` (line 98). The same change will be applied to the MVP banner (line 195) and team summary (line 406) for consistency.

### Files Modified
- `src/components/GameSummary.tsx` — append "(Zone N)" to best zone labels in three locations

