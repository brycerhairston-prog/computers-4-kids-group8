import { supabase } from "@/integrations/supabase/client";

export interface PlayerRecord {
  id: string;
  player_id: string;
  name: string;
  playstyle_tag: string | null;
}

export interface CareerStats {
  games_played: number;
  total_makes: number;
  total_attempts: number;
  total_points: number;
  zone_makes: Record<string, number>;
  zone_attempts: Record<string, number>;
  best_zone: number | null;
  last_played_at: string | null;
}

export interface GameHistoryRow {
  id: string;
  game_mode: string;
  makes: number;
  attempts: number;
  points: number;
  zone_breakdown: Record<string, { makes: number; attempts: number }>;
  played_at: string;
}

export interface PlayerLookupResult {
  player: PlayerRecord;
  career: CareerStats;
  careerFgPct: number;
  bestZone: number | null;
}

const ZONES = [1, 2, 3, 4, 5, 6];
const RECENT_KEY = "c4k_recent_player_ids";

const norm = (raw: string) => raw.trim().toLowerCase();

const emptyZoneMap = (): Record<string, number> => ({ "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0 });

export function generatePlayerId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "P-";
  for (let i = 0; i < 5; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

export function rememberPlayerId(playerId: string) {
  try {
    const list = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]") as string[];
    const next = [playerId, ...list.filter(p => p !== playerId)].slice(0, 12);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function getRecentPlayerIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch {
    return [];
  }
}

export function derivePlaystyleTag(career: CareerStats): string {
  if (career.games_played < 3) return "Developing";
  const att = career.total_attempts || 1;
  const threes = (career.zone_attempts["4"] || 0) + (career.zone_attempts["5"] || 0) + (career.zone_attempts["6"] || 0);
  const mid = (career.zone_attempts["2"] || 0) + (career.zone_attempts["3"] || 0);
  const paint = career.zone_attempts["1"] || 0;
  const fg = career.total_makes / att;
  if (threes / att >= 0.5 && fg >= 0.35) return "Sharpshooter";
  if (paint / att >= 0.4 && fg >= 0.55) return "Paint Beast";
  if (mid / att >= 0.4) return "Mid-Range Maestro";
  return "All-Around";
}

export function computeBestZone(zone_makes: Record<string, number>, zone_attempts: Record<string, number>): number | null {
  let best: number | null = null;
  let bestPct = -1;
  for (const z of ZONES) {
    const att = zone_attempts[String(z)] || 0;
    if (att < 2) continue; // need at least 2 attempts
    const pct = (zone_makes[String(z)] || 0) / att;
    if (pct > bestPct) {
      bestPct = pct;
      best = z;
    }
  }
  return best;
}

export async function lookupPlayer(rawId: string): Promise<PlayerLookupResult | null> {
  const normalized = norm(rawId);
  if (!normalized) return null;

  const { data: player, error } = await supabase
    .from("players")
    .select("*")
    .eq("player_id_normalized", normalized)
    .maybeSingle();

  if (error || !player) return null;

  const { data: career } = await supabase
    .from("player_career_stats")
    .select("*")
    .eq("player_uuid", player.id)
    .maybeSingle();

  const careerStats: CareerStats = career
    ? {
        games_played: career.games_played,
        total_makes: career.total_makes,
        total_attempts: career.total_attempts,
        total_points: career.total_points,
        zone_makes: (career.zone_makes as Record<string, number>) || emptyZoneMap(),
        zone_attempts: (career.zone_attempts as Record<string, number>) || emptyZoneMap(),
        best_zone: career.best_zone,
        last_played_at: career.last_played_at,
      }
    : {
        games_played: 0,
        total_makes: 0,
        total_attempts: 0,
        total_points: 0,
        zone_makes: emptyZoneMap(),
        zone_attempts: emptyZoneMap(),
        best_zone: null,
        last_played_at: null,
      };

  const careerFgPct = careerStats.total_attempts > 0 ? (careerStats.total_makes / careerStats.total_attempts) * 100 : 0;
  return {
    player: {
      id: player.id,
      player_id: player.player_id,
      name: player.name,
      playstyle_tag: player.playstyle_tag,
    },
    career: careerStats,
    careerFgPct,
    bestZone: careerStats.best_zone ?? computeBestZone(careerStats.zone_makes, careerStats.zone_attempts),
  };
}

/** Resolve existing or create a new player. Returns the player record. */
export async function resolveOrCreatePlayer(rawId: string | undefined, name: string): Promise<PlayerRecord> {
  let candidate = (rawId || "").trim();
  if (!candidate) candidate = generatePlayerId();
  const normalized = norm(candidate);

  const existing = await lookupPlayer(candidate);
  if (existing) {
    rememberPlayerId(existing.player.player_id);
    return existing.player;
  }

  const { data, error } = await supabase
    .from("players")
    .insert({ player_id: candidate, player_id_normalized: normalized, name })
    .select()
    .single();

  if (error || !data) throw error || new Error("Failed to create player");
  rememberPlayerId(data.player_id);
  return {
    id: data.id,
    player_id: data.player_id,
    name: data.name,
    playstyle_tag: data.playstyle_tag,
  };
}

export interface GameResultInput {
  playerUuid: string;
  gameMode: string;
  makes: number;
  attempts: number;
  points: number;
  zoneBreakdown: Record<number, { makes: number; attempts: number }>;
}

export async function saveGameResult(input: GameResultInput): Promise<void> {
  if (input.attempts === 0) return; // skip players who didn't shoot

  // Insert game history row
  await supabase.from("player_game_history").insert({
    player_uuid: input.playerUuid,
    game_mode: input.gameMode,
    makes: input.makes,
    attempts: input.attempts,
    points: input.points,
    zone_breakdown: input.zoneBreakdown as unknown as Record<string, unknown>,
  });

  // Fetch current career
  const { data: existing } = await supabase
    .from("player_career_stats")
    .select("*")
    .eq("player_uuid", input.playerUuid)
    .maybeSingle();

  const baseMakes = existing?.zone_makes as Record<string, number> | undefined;
  const baseAttempts = existing?.zone_attempts as Record<string, number> | undefined;
  const newMakes = baseMakes ? { ...baseMakes } : emptyZoneMap();
  const newAttempts = baseAttempts ? { ...baseAttempts } : emptyZoneMap();
  for (const z of ZONES) {
    const k = String(z);
    newMakes[k] = (newMakes[k] || 0) + (input.zoneBreakdown[z]?.makes || 0);
    newAttempts[k] = (newAttempts[k] || 0) + (input.zoneBreakdown[z]?.attempts || 0);
  }

  const merged: CareerStats = {
    games_played: (existing?.games_played || 0) + 1,
    total_makes: (existing?.total_makes || 0) + input.makes,
    total_attempts: (existing?.total_attempts || 0) + input.attempts,
    total_points: (existing?.total_points || 0) + input.points,
    zone_makes: newMakes,
    zone_attempts: newAttempts,
    best_zone: null,
    last_played_at: new Date().toISOString(),
  };
  merged.best_zone = computeBestZone(merged.zone_makes, merged.zone_attempts);
  const playstyle = derivePlaystyleTag(merged);

  if (existing) {
    await supabase
      .from("player_career_stats")
      .update({
        games_played: merged.games_played,
        total_makes: merged.total_makes,
        total_attempts: merged.total_attempts,
        total_points: merged.total_points,
        zone_makes: merged.zone_makes,
        zone_attempts: merged.zone_attempts,
        best_zone: merged.best_zone,
        last_played_at: merged.last_played_at,
      })
      .eq("player_uuid", input.playerUuid);
  } else {
    await supabase.from("player_career_stats").insert({
      player_uuid: input.playerUuid,
      games_played: merged.games_played,
      total_makes: merged.total_makes,
      total_attempts: merged.total_attempts,
      total_points: merged.total_points,
      zone_makes: merged.zone_makes,
      zone_attempts: merged.zone_attempts,
      best_zone: merged.best_zone,
      last_played_at: merged.last_played_at,
    });
  }

  await supabase.from("players").update({ playstyle_tag: playstyle }).eq("id", input.playerUuid);
}

export async function getRecentGames(playerUuid: string, limit = 10): Promise<GameHistoryRow[]> {
  const { data } = await supabase
    .from("player_game_history")
    .select("*")
    .eq("player_uuid", playerUuid)
    .order("played_at", { ascending: false })
    .limit(limit);
  return (data || []) as unknown as GameHistoryRow[];
}

// localStorage map: session_player.id -> global players.id (for auto-save at game end)
const MAPPING_KEY = "c4k_session_to_global_player";

export function linkSessionToGlobalPlayer(sessionPlayerId: string, globalPlayerUuid: string) {
  try {
    const map = JSON.parse(localStorage.getItem(MAPPING_KEY) || "{}") as Record<string, string>;
    map[sessionPlayerId] = globalPlayerUuid;
    localStorage.setItem(MAPPING_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export function getGlobalPlayerUuid(sessionPlayerId: string): string | null {
  try {
    const map = JSON.parse(localStorage.getItem(MAPPING_KEY) || "{}") as Record<string, string>;
    return map[sessionPlayerId] || null;
  } catch {
    return null;
  }
}
