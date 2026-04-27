// Smart Coach AI — pure analytics engine over the live shot stream.
// No external API needed: works offline, in real time, with whatever
// data is in GameContext.

import type { Shot, Player, Team } from "@/context/GameContext";
import { ZONE_POINTS } from "@/context/GameContext";

export type InsightSeverity = "hot" | "cold" | "info" | "trend";

export interface CoachInsight {
  id: string;
  severity: InsightSeverity;
  icon: string; // emoji
  message: string;
  playerId?: string;
  zone?: number;
  priority: number; // higher = more important
}

const ZONE_NAMES: Record<number, string> = {
  1: "Paint",
  2: "Left Mid",
  3: "Right Mid",
  4: "Left Corner 3",
  5: "Top of Key 3",
  6: "Right Corner 3",
};

interface ZoneAgg {
  makes: number;
  attempts: number;
}

function aggregateByZone(shots: Shot[]): Record<number, ZoneAgg> {
  const out: Record<number, ZoneAgg> = {};
  for (let z = 1; z <= 6; z++) out[z] = { makes: 0, attempts: 0 };
  for (const s of shots) {
    if (!out[s.zone]) out[s.zone] = { makes: 0, attempts: 0 };
    out[s.zone].attempts += 1;
    if (s.made) out[s.zone].makes += 1;
  }
  return out;
}

/** League-baseline expected FG% by zone (kid-friendly tabletop values). */
export const LEAGUE_FG_BASELINE: Record<number, number> = {
  1: 0.62, // paint
  2: 0.42, // mid
  3: 0.42, // mid
  4: 0.36, // corner 3
  5: 0.34, // top 3
  6: 0.36, // corner 3
};

export function expectedFgForZone(zone: number, playerShots?: Shot[]): {
  baseline: number;
  personal: number | null;
  delta: number | null;
  attempts: number;
} {
  const baseline = LEAGUE_FG_BASELINE[zone] ?? 0.4;
  if (!playerShots || playerShots.length === 0) {
    return { baseline, personal: null, delta: null, attempts: 0 };
  }
  const zoneShots = playerShots.filter((s) => s.zone === zone);
  if (zoneShots.length === 0) {
    return { baseline, personal: null, delta: null, attempts: 0 };
  }
  const makes = zoneShots.filter((s) => s.made).length;
  const personal = makes / zoneShots.length;
  return {
    baseline,
    personal,
    delta: personal - baseline,
    attempts: zoneShots.length,
  };
}

/** Detect a streak from the tail of the shot list. Returns { type, length }. */
export function detectStreak(shots: Shot[]): { type: "hot" | "cold" | "none"; length: number } {
  if (shots.length === 0) return { type: "none", length: 0 };
  const last = shots[shots.length - 1];
  let length = 1;
  for (let i = shots.length - 2; i >= 0; i--) {
    if (shots[i].made === last.made) length++;
    else break;
  }
  if (length < 3) return { type: "none", length };
  return { type: last.made ? "hot" : "cold", length };
}

interface BuildArgs {
  shots: Shot[];
  players: Player[];
  teams?: Team[];
  gameMode: "individual" | "team";
}

/**
 * Build a prioritized list of live coaching insights.
 * Only returns insights once enough data exists to be meaningful.
 */
export function buildCoachInsights({ shots, players, teams, gameMode }: BuildArgs): CoachInsight[] {
  const insights: CoachInsight[] = [];
  if (shots.length === 0) return insights;

  // ----- Per-player analysis -----
  for (const player of players) {
    const pShots = shots.filter((s) => s.playerId === player.id);
    if (pShots.length < 3) continue;

    const zoneAgg = aggregateByZone(pShots);

    // Cold zone: 0 makes on 3+ attempts in a single zone
    for (let z = 1; z <= 6; z++) {
      const { makes, attempts } = zoneAgg[z];
      if (attempts >= 3 && makes === 0) {
        insights.push({
          id: `cold-${player.id}-${z}`,
          severity: "cold",
          icon: "🥶",
          message: `${player.name}: stop shooting Zone ${z} (${ZONE_NAMES[z]}) — 0/${attempts}`,
          playerId: player.id,
          zone: z,
          priority: 80 + attempts,
        });
      }
    }

    // Hot zone: ≥3 attempts, ≥66% FG
    for (let z = 1; z <= 6; z++) {
      const { makes, attempts } = zoneAgg[z];
      if (attempts >= 3 && makes / attempts >= 0.66) {
        insights.push({
          id: `hot-${player.id}-${z}`,
          severity: "hot",
          icon: "🔥",
          message: `${player.name} is hot from Zone ${z} (${ZONE_NAMES[z]}) — ${makes}/${attempts}, keep feeding!`,
          playerId: player.id,
          zone: z,
          priority: 90 + makes,
        });
      }
    }

    // Streak detection
    const streak = detectStreak(pShots);
    if (streak.type === "hot" && streak.length >= 3) {
      insights.push({
        id: `streak-hot-${player.id}`,
        severity: "hot",
        icon: "⚡",
        message: `${player.name} is on a ${streak.length}-shot hot streak!`,
        playerId: player.id,
        priority: 70 + streak.length,
      });
    } else if (streak.type === "cold" && streak.length >= 3) {
      insights.push({
        id: `streak-cold-${player.id}`,
        severity: "cold",
        icon: "❄️",
        message: `${player.name} has missed ${streak.length} in a row — try a different zone.`,
        playerId: player.id,
        priority: 60 + streak.length,
      });
    }

    // Tendency: shooting too much from a single zone (>60% of attempts, ≥5 shots)
    if (pShots.length >= 5) {
      for (let z = 1; z <= 6; z++) {
        const share = zoneAgg[z].attempts / pShots.length;
        if (share > 0.6) {
          insights.push({
            id: `tendency-${player.id}-${z}`,
            severity: "trend",
            icon: "📊",
            message: `${player.name} takes ${Math.round(share * 100)}% of shots from Zone ${z} — mix it up.`,
            playerId: player.id,
            zone: z,
            priority: 50,
          });
          break;
        }
      }
    }
  }

  // ----- Team-level: best shooter callout -----
  if (gameMode === "team" && teams && teams.length > 0) {
    for (const team of teams) {
      const teamPlayers = players.filter((p) => team.playerIds.includes(p.id));
      let best: { player: Player; pct: number; makes: number; attempts: number } | null = null;
      for (const p of teamPlayers) {
        const pShots = shots.filter((s) => s.playerId === p.id);
        if (pShots.length < 3) continue;
        const makes = pShots.filter((s) => s.made).length;
        const pct = makes / pShots.length;
        if (!best || pct > best.pct) best = { player: p, pct, makes, attempts: pShots.length };
      }
      if (best && best.pct >= 0.5) {
        insights.push({
          id: `team-best-${team.id}`,
          severity: "info",
          icon: "🎯",
          message: `${team.name}: ${best.player.name} is shooting ${Math.round(best.pct * 100)}% — get them more touches.`,
          playerId: best.player.id,
          priority: 65,
        });
      }
    }
  }

  // Sort by priority desc, return top N
  insights.sort((a, b) => b.priority - a.priority);
  return insights.slice(0, 5);
}
