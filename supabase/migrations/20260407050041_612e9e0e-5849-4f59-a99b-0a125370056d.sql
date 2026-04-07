
CREATE TABLE public.game_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_code TEXT NOT NULL UNIQUE,
  game_mode TEXT NOT NULL DEFAULT 'individual',
  status TEXT NOT NULL DEFAULT 'waiting',
  host_device_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.session_players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  device_id TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.session_shots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.session_players(id) ON DELETE CASCADE,
  zone INTEGER NOT NULL,
  made BOOLEAN NOT NULL,
  x REAL NOT NULL,
  y REAL NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_shots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view game sessions" ON public.game_sessions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can create game sessions" ON public.game_sessions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update game sessions" ON public.game_sessions FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Anyone can delete game sessions" ON public.game_sessions FOR DELETE TO anon, authenticated USING (true);

CREATE POLICY "Anyone can view session players" ON public.session_players FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can add session players" ON public.session_players FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update session players" ON public.session_players FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Anyone can delete session players" ON public.session_players FOR DELETE TO anon, authenticated USING (true);

CREATE POLICY "Anyone can view session shots" ON public.session_shots FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can add session shots" ON public.session_shots FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update session shots" ON public.session_shots FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Anyone can delete session shots" ON public.session_shots FOR DELETE TO anon, authenticated USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.game_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_shots;

CREATE INDEX idx_session_players_session ON public.session_players(session_id);
CREATE INDEX idx_session_shots_session ON public.session_shots(session_id);
CREATE INDEX idx_session_shots_player ON public.session_shots(player_id);
CREATE INDEX idx_game_sessions_code ON public.game_sessions(game_code);
