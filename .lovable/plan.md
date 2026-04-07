

## Fix: Realtime updates not reaching the host when players join

### Root Cause

The `session_players` and `session_shots` tables use the default replica identity (`d`), which only includes the primary key (`id`) in realtime change events. The subscription in `MultiplayerContext.tsx` uses a filter like `session_id=eq.${sessionId}`, but Supabase Realtime cannot match this filter because `session_id` is not included in the change payload under the default replica identity.

This means INSERT events for new players are silently dropped by the filter on the host's side.

### Fix

**1. Database migration — set `REPLICA IDENTITY FULL` on all three tables**

This tells Postgres to include ALL columns in the change event, so the `session_id` filter can match correctly.

```sql
ALTER TABLE public.session_players REPLICA IDENTITY FULL;
ALTER TABLE public.session_shots REPLICA IDENTITY FULL;
ALTER TABLE public.game_sessions REPLICA IDENTITY FULL;
```

This is a single migration, no code changes needed. The existing subscription logic in `MultiplayerContext.tsx` is already correct — it just needs the full row data to arrive via Realtime.

### What this fixes
- Host sees new players join in real time
- All devices see shots appear instantly
- Game status changes (waiting → playing) propagate correctly

