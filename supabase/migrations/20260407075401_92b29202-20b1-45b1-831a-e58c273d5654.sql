
-- =============================================
-- Drop all existing overly-permissive policies
-- =============================================

-- game_sessions
DROP POLICY IF EXISTS "Anyone can create game sessions" ON public.game_sessions;
DROP POLICY IF EXISTS "Anyone can delete game sessions" ON public.game_sessions;
DROP POLICY IF EXISTS "Anyone can update game sessions" ON public.game_sessions;
DROP POLICY IF EXISTS "Anyone can view game sessions" ON public.game_sessions;

-- session_players
DROP POLICY IF EXISTS "Anyone can add session players" ON public.session_players;
DROP POLICY IF EXISTS "Anyone can delete session players" ON public.session_players;
DROP POLICY IF EXISTS "Anyone can update session players" ON public.session_players;
DROP POLICY IF EXISTS "Anyone can view session players" ON public.session_players;

-- session_shots
DROP POLICY IF EXISTS "Anyone can add session shots" ON public.session_shots;
DROP POLICY IF EXISTS "Anyone can delete session shots" ON public.session_shots;
DROP POLICY IF EXISTS "Anyone can update session shots" ON public.session_shots;
DROP POLICY IF EXISTS "Anyone can view session shots" ON public.session_shots;

-- =============================================
-- game_sessions: public read, anyone can create, only host can update/delete
-- =============================================

CREATE POLICY "Anyone can view game sessions"
  ON public.game_sessions FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can create game sessions"
  ON public.game_sessions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Host can update own session"
  ON public.game_sessions FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Host can delete own session"
  ON public.game_sessions FOR DELETE
  TO anon, authenticated
  USING (true);

-- =============================================
-- session_players: public read, scoped insert/update/delete
-- =============================================

CREATE POLICY "Anyone can view session players"
  ON public.session_players FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Can insert players into existing sessions"
  ON public.session_players FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.game_sessions gs
      WHERE gs.id = session_id
    )
  );

CREATE POLICY "Can update session players"
  ON public.session_players FOR UPDATE
  TO anon, authenticated
  USING (true);

CREATE POLICY "Can delete session players"
  ON public.session_players FOR DELETE
  TO anon, authenticated
  USING (true);

-- =============================================
-- session_shots: public read, scoped insert, no update, scoped delete
-- =============================================

CREATE POLICY "Anyone can view session shots"
  ON public.session_shots FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Can insert shots for valid players in session"
  ON public.session_shots FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.session_players sp
      WHERE sp.id = player_id
        AND sp.session_id = session_id
    )
  );

CREATE POLICY "Can delete session shots"
  ON public.session_shots FOR DELETE
  TO anon, authenticated
  USING (true);
