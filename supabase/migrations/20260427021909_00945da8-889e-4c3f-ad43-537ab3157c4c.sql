-- Players registry
CREATE TABLE public.players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id TEXT NOT NULL,
  player_id_normalized TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  playstyle_tag TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_players_normalized ON public.players(player_id_normalized);

-- Career stats (one row per player)
CREATE TABLE public.player_career_stats (
  player_uuid UUID NOT NULL PRIMARY KEY REFERENCES public.players(id) ON DELETE CASCADE,
  games_played INT NOT NULL DEFAULT 0,
  total_makes INT NOT NULL DEFAULT 0,
  total_attempts INT NOT NULL DEFAULT 0,
  total_points INT NOT NULL DEFAULT 0,
  zone_makes JSONB NOT NULL DEFAULT '{"1":0,"2":0,"3":0,"4":0,"5":0,"6":0}'::jsonb,
  zone_attempts JSONB NOT NULL DEFAULT '{"1":0,"2":0,"3":0,"4":0,"5":0,"6":0}'::jsonb,
  best_zone INT,
  last_played_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Per-game history
CREATE TABLE public.player_game_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_uuid UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  game_mode TEXT NOT NULL,
  makes INT NOT NULL DEFAULT 0,
  attempts INT NOT NULL DEFAULT 0,
  points INT NOT NULL DEFAULT 0,
  zone_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
  played_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_history_player ON public.player_game_history(player_uuid, played_at DESC);

-- Enable RLS
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_career_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_game_history ENABLE ROW LEVEL SECURITY;

-- Open policies (matches existing game_sessions model)
CREATE POLICY "Anyone can view players" ON public.players FOR SELECT USING (true);
CREATE POLICY "Anyone can create players" ON public.players FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update players" ON public.players FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can view career stats" ON public.player_career_stats FOR SELECT USING (true);
CREATE POLICY "Anyone can create career stats" ON public.player_career_stats FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update career stats" ON public.player_career_stats FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can view game history" ON public.player_game_history FOR SELECT USING (true);
CREATE POLICY "Anyone can create game history" ON public.player_game_history FOR INSERT WITH CHECK (true);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER players_touch BEFORE UPDATE ON public.players
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER career_touch BEFORE UPDATE ON public.player_career_stats
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();