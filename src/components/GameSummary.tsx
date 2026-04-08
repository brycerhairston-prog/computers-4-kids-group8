import { useGame, ZONE_LABELS, ZONE_POINTS, TEAM_SHOT_LIMIT, TEAM_PLAYER_MIN_SHOTS, TEAM_PLAYER_MAX_SHOTS } from "@/context/GameContext";
import { useMultiplayer } from "@/context/MultiplayerContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import c4kLogo from "@/assets/c4k-logo.png";
import { RotateCcw, Trophy, Download, Users, Shuffle, Hand, Scale, Minus, Plus, Ban } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useMemo, useState, useCallback } from "react";
import type { TeamSelectionMode, Team, Shot, ZoneStats } from "@/context/GameContext";
import { ZONE_PATHS, ZONE_LABEL_POS, COURT_VIEWBOX } from "@/lib/courtGeometry";
import courtImage from "@/assets/court-layout.png";

const COLORS = ["hsl(142, 71%, 45%)", "hsl(0, 84%, 60%)", "hsl(45, 93%, 47%)", "hsl(217, 91%, 60%)", "hsl(280, 68%, 60%)", "hsl(190, 90%, 50%)"];
const TEAM_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const TOOLTIP_STYLE = {
  background: "hsl(220, 20%, 15%)",
  border: "1px solid hsl(220, 15%, 25%)",
  borderRadius: 8,
  color: "white",
  fontSize: 11,
};

const getHeatColor = (fgPct: number): string => {
  if (fgPct === 0) return "rgba(59, 130, 246, 0.6)";
  if (fgPct <= 20) return "rgba(99, 102, 241, 0.7)";
  if (fgPct <= 40) return "rgba(168, 85, 247, 0.7)";
  if (fgPct <= 60) return "rgba(234, 88, 12, 0.7)";
  if (fgPct <= 80) return "rgba(239, 68, 68, 0.75)";
  return "rgba(220, 38, 38, 0.85)";
};

function computePlayerStats(playerId: string, shotSource: Shot[]) {
  const playerShots = shotSource.filter(s => s.playerId === playerId);
  const makes = playerShots.filter(s => s.made).length;
  const totalPoints = playerShots.filter(s => s.made).reduce((sum, s) => sum + ZONE_POINTS[s.zone], 0);
  const zones: Record<number, ZoneStats> = {};
  for (let z = 1; z <= 6; z++) {
    const zoneShots = playerShots.filter(s => s.zone === z);
    const zm = zoneShots.filter(s => s.made).length;
    zones[z] = { makes: zm, attempts: zoneShots.length, fgPct: zoneShots.length > 0 ? (zm / zoneShots.length) * 100 : 0 };
  }
  return { makes, attempts: playerShots.length, totalPoints, zones };
}

function computeTeamStats(team: Team, shotSource: Shot[]) {
  const tShots = shotSource.filter(s => team.playerIds.includes(s.playerId));
  const makes = tShots.filter(s => s.made).length;
  const totalPoints = tShots.filter(s => s.made).reduce((sum, s) => sum + ZONE_POINTS[s.zone], 0);
  const zones: Record<number, ZoneStats> = {};
  for (let z = 1; z <= 6; z++) {
    const zoneShots = tShots.filter(s => s.zone === z);
    const zm = zoneShots.filter(s => s.made).length;
    zones[z] = { makes: zm, attempts: zoneShots.length, fgPct: zoneShots.length > 0 ? (zm / zoneShots.length) * 100 : 0 };
  }
  return { makes, attempts: tShots.length, totalPoints, zones };
}

interface GameSummaryProps {
  onStartTeamMode?: (selectionMode: TeamSelectionMode, teamCount: number, manualTeams?: Team[]) => void;
}

const PlayerStatsTable = ({ players, shotSource }: { players: { id: string; name: string }[]; shotSource: Shot[] }) => {
  const summaries = players.map(p => {
    const stats = computePlayerStats(p.id, shotSource);
    const bestZone = Object.entries(stats.zones).reduce((best, [z, zs]) =>
      zs.fgPct > (best?.fgPct ?? 0) && zs.attempts > 0 ? { zone: Number(z), ...zs } : best,
      null as (null | { zone: number; makes: number; attempts: number; fgPct: number })
    );
    return { ...p, stats, bestZone };
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <th className="text-left py-2 px-1">Player</th>
            <th className="text-center py-2 px-1">Shots</th>
            <th className="text-center py-2 px-1">Makes</th>
            <th className="text-center py-2 px-1">FG%</th>
            <th className="text-center py-2 px-1">Points</th>
            <th className="text-center py-2 px-1">Best Zone</th>
          </tr>
        </thead>
        <tbody>
          {summaries.map(p => (
            <tr key={p.id} className="border-b border-border/50">
              <td className="py-2 px-1 font-medium">{p.name}</td>
              <td className="text-center py-2 px-1 tabular-nums">{p.stats.attempts}</td>
              <td className="text-center py-2 px-1 tabular-nums">{p.stats.makes}</td>
              <td className="text-center py-2 px-1 tabular-nums font-semibold">
                {p.stats.attempts > 0 ? Math.round((p.stats.makes / p.stats.attempts) * 100) : 0}%
              </td>
              <td className="text-center py-2 px-1 tabular-nums font-bold text-primary">{p.stats.totalPoints}</td>
              <td className="text-center py-2 px-1 text-[10px]">
                {p.bestZone ? `${ZONE_LABELS[p.bestZone.zone]} (${p.bestZone.fgPct.toFixed(0)}%)` : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const MvpBanner = ({ players, shotSource }: { players: { id: string; name: string }[]; shotSource: Shot[] }) => {
  const mvp = useMemo(() => {
    let best: { name: string; stats: ReturnType<typeof computePlayerStats>; bestZone: any } | null = null;
    for (const p of players) {
      const stats = computePlayerStats(p.id, shotSource);
      if (!best || stats.totalPoints > best.stats.totalPoints) {
        const bestZone = Object.entries(stats.zones).reduce((b, [z, zs]) =>
          zs.fgPct > (b?.fgPct ?? 0) && zs.attempts > 0 ? { zone: Number(z), ...zs } : b,
          null as any
        );
        best = { name: p.name, stats, bestZone };
      }
    }
    return best;
  }, [players, shotSource]);

  if (!mvp || mvp.stats.attempts === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-xl p-6 text-center space-y-2">
      <Trophy className="w-10 h-10 text-primary mx-auto" />
      <h2 className="text-2xl font-display font-bold text-primary">🏆 MVP: {mvp.name}</h2>
      <p className="text-muted-foreground text-sm">
        {mvp.stats.totalPoints} points · {mvp.stats.makes}/{mvp.stats.attempts} shots ·{" "}
        {mvp.stats.attempts > 0 ? Math.round((mvp.stats.makes / mvp.stats.attempts) * 100) : 0}% FG
        {mvp.bestZone && ` · Best Zone: ${ZONE_LABELS[mvp.bestZone.zone]} (${mvp.bestZone.fgPct.toFixed(0)}%)`}
      </p>
    </motion.div>
  );
};

const PlayerZonePieCharts = ({ players, shotSource }: { players: { id: string; name: string }[]; shotSource: Shot[] }) => {
  return (
    <div className="glass-card rounded-xl p-4 space-y-4">
      <h3 className="text-sm font-display font-bold text-foreground">📊 Zone Performance by Player</h3>
      {players.map(p => {
        const stats = computePlayerStats(p.id, shotSource);
        if (stats.attempts === 0) return null;
        return (
          <div key={p.id} className="space-y-2">
            <h4 className="text-xs font-bold text-foreground">{p.name}</h4>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[1, 2, 3, 4, 5, 6].map(z => {
                const zs = stats.zones[z];
                const fgPct = zs.fgPct;
                const radius = zs.attempts > 0 ? Math.max(20, Math.round(20 + (fgPct / 100) * 35)) : 20;
                const pieData = [
                  { name: "Makes", value: zs.makes },
                  { name: "Misses", value: zs.attempts - zs.makes },
                ];
                return (
                  <div key={z} className="flex flex-col items-center">
                    <span className="text-[10px] text-muted-foreground mb-1">Z{z} ({ZONE_POINTS[z]}pt)</span>
                    {zs.attempts > 0 ? (
                      <div style={{ width: radius * 2 + 10, height: radius * 2 + 10 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={radius} innerRadius={0} strokeWidth={1}>
                              <Cell fill="hsl(142, 71%, 45%)" />
                              <Cell fill="hsl(0, 84%, 60%)" />
                            </Pie>
                            <Tooltip contentStyle={TOOLTIP_STYLE}
                              formatter={(value: number, name: string) => [value, name]} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center text-[10px] text-muted-foreground" style={{ width: 50, height: 50 }}>
                        No shots
                      </div>
                    )}
                    <span className="text-[10px] font-bold text-foreground">
                      {zs.makes}/{zs.attempts} ({fgPct.toFixed(0)}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const PlayerHeatMaps = ({ players, shotSource, teams }: { players: { id: string; name: string }[]; shotSource: Shot[]; teams?: Team[] }) => {
  const [hoveredZone, setHoveredZone] = useState<{ playerId: string; zone: number } | null>(null);

  return (
    <div className="glass-card rounded-xl p-4 space-y-4">
      <h3 className="text-sm font-display font-bold text-foreground">🔥 Player Heat Maps</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {players.map(p => {
          const stats = computePlayerStats(p.id, shotSource);
          if (stats.attempts === 0) return null;
          return (
            <div key={p.id} className="space-y-1">
              <h4 className="text-xs font-bold text-foreground text-center">{p.name}</h4>
              <div className="relative">
                <svg viewBox={COURT_VIEWBOX} className="w-full rounded-md overflow-hidden" preserveAspectRatio="xMidYMid meet" style={{ background: "white" }}>
                  <defs>
                    {[1, 2, 3, 4, 5, 6].map(zone => (
                      <clipPath key={`clip-${p.id}-${zone}`} id={`summary-clip-${p.id}-${zone}`}>
                        <path d={ZONE_PATHS[zone]} />
                      </clipPath>
                    ))}
                  </defs>
                  <image href={courtImage} x="0" y="0" width="400" height="500" preserveAspectRatio="none" />
                  {[1, 2, 3, 4, 5, 6].map(zone => {
                    const zs = stats.zones[zone];
                    if (zs.attempts === 0) return null;
                    return (
                      <rect key={`heat-${zone}`} x="0" y="0" width="400" height="500"
                        fill={getHeatColor(zs.fgPct)} clipPath={`url(#summary-clip-${p.id}-${zone})`} opacity="0.55" />
                    );
                  })}
                  {[1, 2, 3, 4, 5, 6].map(zone => {
                    const pos = ZONE_LABEL_POS[zone];
                    const zs = stats.zones[zone];
                    const isHovered = hoveredZone?.playerId === p.id && hoveredZone?.zone === zone;
                    return (
                      <g key={`label-${zone}`}
                        onMouseEnter={() => setHoveredZone({ playerId: p.id, zone })}
                        onMouseLeave={() => setHoveredZone(null)}
                        style={{ cursor: "pointer" }}>
                        <rect x={pos.x - 28} y={pos.y - 24} width="56" height="36" rx="4" fill="white" fillOpacity="0.8" />
                        <text x={pos.x} y={pos.y - 8} textAnchor="middle" fill="black" fontSize="11" fontWeight="700">
                          {zs.makes}/{zs.attempts}
                        </text>
                        <text x={pos.x} y={pos.y + 8} textAnchor="middle" fill="black" fontSize="10" opacity="0.8">
                          {zs.fgPct.toFixed(0)}%
                        </text>
                        {isHovered && zs.attempts > 0 && (
                          <foreignObject x={pos.x - 45} y={pos.y + 14} width="90" height="90">
                            <div style={{ width: 90, height: 90 }}>
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={[
                                      { name: "Makes", value: zs.makes },
                                      { name: "Misses", value: zs.attempts - zs.makes },
                                    ]}
                                    dataKey="value" cx="50%" cy="50%" outerRadius={35} innerRadius={0} strokeWidth={1}>
                                    <Cell fill="hsl(142, 71%, 45%)" />
                                    <Cell fill="hsl(0, 84%, 60%)" />
                                  </Pie>
                                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                          </foreignObject>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const TeamPerformanceSection = ({ teams, players, shotSource }: { teams: Team[]; players: { id: string; name: string }[]; shotSource: Shot[] }) => {
  if (teams.length === 0) return null;
  const teamSummaries = teams.map(t => {
    const stats = computeTeamStats(t, shotSource);
    const bestZone = Object.entries(stats.zones).reduce((best, [z, zs]) =>
      zs.fgPct > (best?.fgPct ?? 0) && zs.attempts > 0 ? { zone: Number(z), ...zs } : best,
      null as any
    );
    return { ...t, stats, bestZone };
  });

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-display font-bold text-foreground glass-card rounded-xl p-4">👥 Team Performance</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {teamSummaries.map(t => {
          const teamPlayers = players.filter(p => t.playerIds.includes(p.id));
          const pieData = [1, 2, 3, 4, 5, 6]
            .filter(z => t.stats.zones[z]?.attempts > 0)
            .map(z => ({ name: ZONE_LABELS[z], value: t.stats.zones[z].attempts, makes: t.stats.zones[z].makes, fgPct: t.stats.zones[z].fgPct }));
          return (
            <div key={t.id} className="glass-card rounded-xl p-4 space-y-3">
              <div className="text-center space-y-1">
                <h4 className="text-lg font-display font-bold text-foreground">{t.name}</h4>
                <p className="text-xs text-muted-foreground">
                  {t.stats.totalPoints} pts · {t.stats.makes}/{t.stats.attempts} ({t.stats.attempts > 0 ? Math.round((t.stats.makes / t.stats.attempts) * 100) : 0}% FG)
                  {t.bestZone && ` · Best: ${ZONE_LABELS[t.bestZone.zone]}`}
                </p>
                <p className="text-[10px] text-muted-foreground">Players: {teamPlayers.map(p => p.name).join(", ")}</p>
              </div>
              {pieData.length > 0 && (
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} innerRadius={28} paddingAngle={2} label={({ value }) => `${value}`}>
                        {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(value: number, name: string, props: any) => [`${props.payload.makes}/${value} (${props.payload.fgPct.toFixed(0)}%)`, name]}
                        contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11, color: "hsl(var(--foreground))" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ──── Shot Allocation Step ────
const ShotAllocationStep = ({
  teams, players, allocations, setAllocations, onNext, onBack,
}: {
  teams: Team[];
  players: { id: string; name: string }[];
  allocations: Record<string, Record<string, number>>;
  setAllocations: React.Dispatch<React.SetStateAction<Record<string, Record<string, number>>>>;
  onNext: () => void;
  onBack: () => void;
}) => {
  const isValid = teams.every(t => {
    const alloc = allocations[t.id] || {};
    const total = Object.values(alloc).reduce((s, v) => s + v, 0);
    const allInRange = t.playerIds.every(pid => {
      const v = alloc[pid] ?? 0;
      return v >= TEAM_PLAYER_MIN_SHOTS && v <= TEAM_PLAYER_MAX_SHOTS;
    });
    return total === TEAM_SHOT_LIMIT && allInRange;
  });

  const adjustAlloc = (teamId: string, playerId: string, delta: number) => {
    setAllocations(prev => {
      const teamAlloc = { ...(prev[teamId] || {}) };
      const current = teamAlloc[playerId] ?? 0;
      const newVal = Math.max(TEAM_PLAYER_MIN_SHOTS, Math.min(TEAM_PLAYER_MAX_SHOTS, current + delta));
      teamAlloc[playerId] = newVal;
      return { ...prev, [teamId]: teamAlloc };
    });
  };

  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
      className="glass-card rounded-xl p-5 space-y-4">
      <h3 className="text-lg font-display font-bold text-foreground text-center">🎯 Shot Allocation</h3>
      <p className="text-xs text-muted-foreground text-center">
        Each team gets {TEAM_SHOT_LIMIT} total shots. Assign {TEAM_PLAYER_MIN_SHOTS}–{TEAM_PLAYER_MAX_SHOTS} shots per player.
      </p>

      {teams.map(t => {
        const alloc = allocations[t.id] || {};
        const total = Object.values(alloc).reduce((s, v) => s + v, 0);
        const teamPlayers = players.filter(p => t.playerIds.includes(p.id));

        return (
          <div key={t.id} className="space-y-2 border border-border rounded-lg p-3">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-bold text-foreground">{t.name}</h4>
              <span className={`text-xs font-bold tabular-nums ${total === TEAM_SHOT_LIMIT ? "text-primary" : "text-destructive"}`}>
                {total}/{TEAM_SHOT_LIMIT} shots
              </span>
            </div>
            {teamPlayers.map(p => {
              const val = alloc[p.id] ?? 0;
              return (
                <div key={p.id} className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium flex-1">{p.name}</span>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="outline" className="h-6 w-6" disabled={val <= TEAM_PLAYER_MIN_SHOTS}
                      onClick={() => adjustAlloc(t.id, p.id, -1)}>
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="text-xs font-bold w-6 text-center tabular-nums">{val}</span>
                    <Button size="icon" variant="outline" className="h-6 w-6" disabled={val >= TEAM_PLAYER_MAX_SHOTS}
                      onClick={() => adjustAlloc(t.id, p.id, 1)}>
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onBack}>Back</Button>
        <Button className="flex-1 font-bold" disabled={!isValid} onClick={onNext}>
          Next: Zone Blocking →
        </Button>
      </div>
    </motion.div>
  );
};

// ──── Zone Blocking Step ────
const ZoneBlockingStep = ({
  teams, blockedZones, setBlockedZones, onStart, onBack,
}: {
  teams: Team[];
  blockedZones: Record<string, number[]>; // targetTeamId → blocked zone numbers
  setBlockedZones: React.Dispatch<React.SetStateAction<Record<string, number[]>>>;
  onStart: () => void;
  onBack: () => void;
}) => {
  const allZones = [1, 2, 3, 4, 5, 6];

  // Each team has 2 zones blocked ON them (by the other teams collectively)
  const isValid = teams.every(t => (blockedZones[t.id] || []).length === 2);

  const toggleZone = (teamId: string, zone: number) => {
    setBlockedZones(prev => {
      const current = prev[teamId] || [];
      if (current.includes(zone)) {
        return { ...prev, [teamId]: current.filter(z => z !== zone) };
      }
      if (current.length >= 2) return prev; // max 2
      return { ...prev, [teamId]: [...current, zone] };
    });
  };

  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
      className="glass-card rounded-xl p-5 space-y-4">
      <h3 className="text-lg font-display font-bold text-foreground text-center">🚫 Zone Blocking</h3>
      <p className="text-xs text-muted-foreground text-center">
        Block 2 zones on each team's board. Those zones will be off-limits during team play.
      </p>

      {teams.map(t => {
        const blocked = blockedZones[t.id] || [];
        return (
          <div key={t.id} className="space-y-2 border border-border rounded-lg p-3">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-bold text-foreground">Block zones for {t.name}</h4>
              <span className={`text-xs font-bold ${blocked.length === 2 ? "text-primary" : "text-muted-foreground"}`}>
                {blocked.length}/2 selected
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {allZones.map(z => {
                const isBlocked = blocked.includes(z);
                return (
                  <button key={z} onClick={() => toggleZone(t.id, z)}
                    className={`text-[10px] py-2 px-1 rounded-md border transition-all ${
                      isBlocked
                        ? "border-destructive bg-destructive/10 text-destructive font-bold"
                        : "border-border hover:border-primary/50 text-muted-foreground"
                    }`}>
                    {isBlocked && <Ban className="w-3 h-3 inline mr-0.5" />}
                    {ZONE_LABELS[z]}
                    <span className="block text-[9px] opacity-70">{ZONE_POINTS[z]}pt</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onBack}>Back</Button>
        <Button className="flex-1 font-bold" disabled={!isValid} onClick={onStart}>
          🏀 Start Team Mode
        </Button>
      </div>
    </motion.div>
  );
};

type SetupStep = "team-selection" | "shot-allocation" | "zone-blocking";

const GameSummary = ({ onStartTeamMode }: GameSummaryProps) => {
  const { players, teams, shots, gameMode, getPlayerStats, resetGame, exportCSV, individualShots, teamShots, allShots } = useGame();
  const mp = useMultiplayer();
  const [showTeamSetup, setShowTeamSetup] = useState(false);
  const [setupStep, setSetupStep] = useState<SetupStep>("team-selection");
  const [teamSelectionMode, setTeamSelectionMode] = useState<TeamSelectionMode>("random");
  const [manualTeams, setManualTeams] = useState<Record<number, string[]>>({});
  const [pendingTeams, setPendingTeams] = useState<Team[]>([]);
  const [shotAllocations, setShotAllocations] = useState<Record<string, Record<string, number>>>({});
  const [blockedZones, setBlockedZones] = useState<Record<string, number[]>>({});

  const defaultTeamCount = useMemo(() => {
    if (mp.isMultiplayer && mp.sessionPlayers.length > 0) {
      const uniqueDevices = new Set(mp.sessionPlayers.map(p => p.device_id));
      return Math.max(2, uniqueDevices.size);
    }
    return 2;
  }, [mp.isMultiplayer, mp.sessionPlayers]);

  const [teamCount, setTeamCount] = useState<number>(defaultTeamCount);
  useMemo(() => { setTeamCount(defaultTeamCount); }, [defaultTeamCount]);

  const handleExport = () => {
    const csv = exportCSV();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "basketball-analytics.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Build teams from selection and move to allocation step
  const handleTeamsSelected = () => {
    let builtTeams: Team[];
    if (teamSelectionMode === "manual") {
      const allAssigned = players.every(p => Object.values(manualTeams).some(ids => ids.includes(p.id)));
      const allTeamsHavePlayers = Array.from({ length: teamCount }, (_, i) => i).every(i => (manualTeams[i] || []).length > 0);
      if (!allAssigned || !allTeamsHavePlayers) return;
      builtTeams = Array.from({ length: teamCount }, (_, i) => ({
        id: `team-manual-${i}-${Date.now()}`,
        name: `Team ${TEAM_LETTERS[i]}`,
        playerIds: manualTeams[i] || [],
      }));
    } else {
      // For random/fair, build placeholder teams to configure allocations
      builtTeams = Array.from({ length: teamCount }, (_, i) => ({
        id: `team-${i}-${Date.now()}`,
        name: `Team ${TEAM_LETTERS[i]}`,
        playerIds: [] as string[], // will be filled by onStartTeamMode
      }));
    }

    // For random/fair, we need actual player assignments for allocation
    if (teamSelectionMode !== "manual") {
      const TEAM_LETTERS_ARR = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      if (teamSelectionMode === "fair") {
        const sorted = [...players].sort((a, b) => {
          const aStats = getPlayerStats(a.id);
          const bStats = getPlayerStats(b.id);
          return bStats.totalPoints - aStats.totalPoints;
        });
        const buckets: string[][] = Array.from({ length: teamCount }, () => []);
        let direction = 1;
        let idx = 0;
        for (const p of sorted) {
          buckets[idx].push(p.id);
          if ((direction === 1 && idx === teamCount - 1) || (direction === -1 && idx === 0)) {
            direction *= -1;
          } else {
            idx += direction;
          }
        }
        builtTeams = buckets.map((ids, i) => ({
          id: `team-${i}-${Date.now()}`,
          name: `Team ${TEAM_LETTERS_ARR[i]}`,
          playerIds: ids,
        }));
      } else {
        // Random
        const shuffled = [...players].sort(() => Math.random() - 0.5);
        const buckets: string[][] = Array.from({ length: teamCount }, () => []);
        shuffled.forEach((p, i) => buckets[i % teamCount].push(p.id));
        builtTeams = buckets.map((ids, i) => ({
          id: `team-${i}-${Date.now()}`,
          name: `Team ${TEAM_LETTERS_ARR[i]}`,
          playerIds: ids,
        }));
      }
    }

    setPendingTeams(builtTeams);

    // Initialize allocations: even split
    const allocs: Record<string, Record<string, number>> = {};
    for (const t of builtTeams) {
      const count = t.playerIds.length;
      const base = Math.floor(TEAM_SHOT_LIMIT / count);
      const remainder = TEAM_SHOT_LIMIT % count;
      const teamAlloc: Record<string, number> = {};
      t.playerIds.forEach((pid, i) => {
        teamAlloc[pid] = Math.min(TEAM_PLAYER_MAX_SHOTS, Math.max(TEAM_PLAYER_MIN_SHOTS, base + (i < remainder ? 1 : 0)));
      });
      allocs[t.id] = teamAlloc;
    }
    setShotAllocations(allocs);
    setBlockedZones({});
    setSetupStep("shot-allocation");
  };

  const handleStartWithConfig = () => {
    // Attach allocations and blocked zones to teams
    const finalTeams = pendingTeams.map(t => ({
      ...t,
      shotAllocations: shotAllocations[t.id] || {},
      blockedZones: blockedZones[t.id] || [],
    }));
    onStartTeamMode?.(teamSelectionMode, teamCount, finalTeams);
  };

  const assignToTeam = (playerId: string, teamIndex: number) => {
    setManualTeams(prev => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        next[Number(key)] = next[Number(key)].filter(id => id !== playerId);
      }
      next[teamIndex] = [...(next[teamIndex] || []), playerId];
      return next;
    });
  };

  const removeFromTeam = (playerId: string) => {
    setManualTeams(prev => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        next[Number(key)] = next[Number(key)].filter(id => id !== playerId);
      }
      return next;
    });
  };

  const unassignedPlayers = players.filter(p => !Object.values(manualTeams).some(ids => ids.includes(p.id)));
  const manualReady = unassignedPlayers.length === 0 && Array.from({ length: teamCount }, (_, i) => i).every(i => (manualTeams[i] || []).length > 0);

  const handleReset = () => {
    if (mp.isMultiplayer) {
      mp.resetMultiplayerGame();
    } else {
      resetGame();
    }
  };

  const hasIndividualData = individualShots.length > 0;
  const hasTeamData = teamShots.length > 0;
  const showTabbedSummary = hasIndividualData && hasTeamData && gameMode === "team";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <img src={c4kLogo} alt="C4K" className="w-8 h-8" />
            <h1 className="text-lg font-display font-bold text-foreground">Game Summary</h1>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleExport} className="gap-1 text-xs">
              <Download className="w-3 h-3" /> CSV
            </Button>
            <Button size="sm" onClick={handleReset} className="gap-1 text-xs">
              <RotateCcw className="w-3 h-3" /> New Game
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Team Mode CTA */}
        {gameMode === "individual" && onStartTeamMode && players.length >= 2 && !showTeamSetup && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}
            className="glass-card rounded-xl p-5 text-center space-y-3 border-2 border-primary/30">
            <Users className="w-8 h-8 text-primary mx-auto" />
            <h3 className="text-lg font-display font-bold text-foreground">Ready for Team Mode?</h3>
            <p className="text-sm text-muted-foreground">Use these same players to play a team game ({TEAM_SHOT_LIMIT} shots per team)</p>
            <Button className="font-bold text-lg h-12 px-8" onClick={() => { setShowTeamSetup(true); setSetupStep("team-selection"); }}>
              👥 Play Team Mode
            </Button>
          </motion.div>
        )}

        {/* Team Setup Flow */}
        {showTeamSetup && setupStep === "team-selection" && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            className="glass-card rounded-xl p-5 space-y-4">
            <h3 className="text-lg font-display font-bold text-foreground text-center">Step 1: Team Selection</h3>
            <div className="grid grid-cols-3 gap-2">
              {([
                { mode: "random" as TeamSelectionMode, icon: Shuffle, label: "Random", desc: "Shuffle players" },
                { mode: "manual" as TeamSelectionMode, icon: Hand, label: "Manual", desc: "Pick teams yourself" },
                { mode: "fair" as TeamSelectionMode, icon: Scale, label: "Fair", desc: "Based on stats" },
              ]).map(({ mode, icon: Icon, label, desc }) => (
                <button key={mode} onClick={() => setTeamSelectionMode(mode)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all text-xs ${
                    teamSelectionMode === mode ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50 text-muted-foreground"
                  }`}>
                  <Icon className="w-4 h-4" />
                  <span className="font-semibold">{label}</span>
                  <span className="text-[9px] opacity-70">{desc}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center justify-center gap-3">
              <span className="text-xs text-muted-foreground font-medium">Number of Teams:</span>
              <div className="flex items-center gap-2">
                <Button size="icon" variant="outline" className="h-7 w-7" disabled={teamCount <= 2} onClick={() => setTeamCount(c => Math.max(2, c - 1))}>
                  <Minus className="w-3 h-3" />
                </Button>
                <span className="text-sm font-bold w-6 text-center">{teamCount}</span>
                <Button size="icon" variant="outline" className="h-7 w-7" disabled={teamCount >= Math.min(players.length, 26)} onClick={() => setTeamCount(c => Math.min(players.length, 26, c + 1))}>
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>
            {teamSelectionMode === "manual" && players.length >= 2 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(teamCount, 4)}, 1fr)` }}>
                  {Array.from({ length: teamCount }, (_, i) => (
                    <div key={i} className="space-y-1">
                      <h4 className="text-xs font-bold text-primary">Team {TEAM_LETTERS[i]}</h4>
                      {(manualTeams[i] || []).map(id => {
                        const p = players.find(pl => pl.id === id);
                        return p ? (
                          <div key={id} className="text-xs bg-primary/10 rounded px-2 py-1 flex justify-between">
                            {p.name}
                            <button onClick={() => removeFromTeam(id)} className="text-muted-foreground hover:text-destructive">×</button>
                          </div>
                        ) : null;
                      })}
                    </div>
                  ))}
                </div>
                {unassignedPlayers.length > 0 && (
                  <div className="space-y-1">
                    <h4 className="text-xs text-muted-foreground">Unassigned:</h4>
                    <div className="flex flex-wrap gap-1">
                      {unassignedPlayers.map(p => (
                        <div key={p.id} className="flex gap-1 flex-wrap">
                          {Array.from({ length: teamCount }, (_, i) => (
                            <Button key={i} size="sm" variant="outline" className="text-[10px] h-6 px-2" onClick={() => assignToTeam(p.id, i)}>
                              {p.name} → {TEAM_LETTERS[i]}
                            </Button>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowTeamSetup(false)}>Cancel</Button>
              <Button className="flex-1 font-bold" disabled={teamSelectionMode === "manual" && !manualReady} onClick={handleTeamsSelected}>
                Next: Shot Allocation →
              </Button>
            </div>
          </motion.div>
        )}

        {showTeamSetup && setupStep === "shot-allocation" && (
          <ShotAllocationStep
            teams={pendingTeams}
            players={players}
            allocations={shotAllocations}
            setAllocations={setShotAllocations}
            onNext={() => setSetupStep("zone-blocking")}
            onBack={() => setSetupStep("team-selection")}
          />
        )}

        {showTeamSetup && setupStep === "zone-blocking" && (
          <ZoneBlockingStep
            teams={pendingTeams}
            blockedZones={blockedZones}
            setBlockedZones={setBlockedZones}
            onStart={handleStartWithConfig}
            onBack={() => setSetupStep("shot-allocation")}
          />
        )}

        {/* Tabbed Summary */}
        {showTabbedSummary ? (
          <Tabs defaultValue="overall" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="individual" className="flex-1">🏃 Individual</TabsTrigger>
              <TabsTrigger value="team" className="flex-1">👥 Team</TabsTrigger>
              <TabsTrigger value="overall" className="flex-1">🏆 Overall</TabsTrigger>
            </TabsList>

            <TabsContent value="individual" className="space-y-6 mt-4">
              <MvpBanner players={players} shotSource={individualShots} />
              <PlayerBarChart players={players} shotSource={individualShots} />
              <div className="glass-card rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-display font-bold text-foreground">📋 Individual Round Stats</h3>
                <PlayerStatsTable players={players} shotSource={individualShots} />
              </div>
            </TabsContent>

            <TabsContent value="team" className="space-y-6 mt-4">
              <MvpBanner players={players} shotSource={teamShots} />
              <TeamPerformanceSection teams={teams} players={players} shotSource={teamShots} />
              <div className="glass-card rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-display font-bold text-foreground">📋 Team Round Player Stats</h3>
                <PlayerStatsTable players={players} shotSource={teamShots} />
              </div>
            </TabsContent>

            <TabsContent value="overall" className="space-y-6 mt-4">
              <MvpBanner players={players} shotSource={allShots} />
              <PlayerBarChart players={players} shotSource={allShots} />
              <div className="glass-card rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-display font-bold text-foreground">📋 Combined Stats (Both Rounds)</h3>
                <PlayerStatsTable players={players} shotSource={allShots} />
              </div>
              <TeamPerformanceSection teams={teams} players={players} shotSource={teamShots} />
            </TabsContent>
          </Tabs>
        ) : (
          <>
            <MvpBanner players={players} shotSource={gameMode === "team" ? teamShots : individualShots} />
            <PlayerBarChart players={players} shotSource={gameMode === "team" ? teamShots : individualShots} />
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
              className="glass-card rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-display font-bold text-foreground">📋 Detailed Stats</h3>
              <PlayerStatsTable players={players} shotSource={gameMode === "team" ? teamShots : individualShots} />
            </motion.div>
            {gameMode === "team" && (
              <TeamPerformanceSection teams={teams} players={players} shotSource={teamShots} />
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default GameSummary;
