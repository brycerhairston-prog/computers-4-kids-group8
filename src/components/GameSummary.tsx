import { useGame, ZONE_LABELS, ZONE_POINTS } from "@/context/GameContext";
import { useMultiplayer } from "@/context/MultiplayerContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { RotateCcw, Trophy, Download, Users, Shuffle, Hand, Scale, Minus, Plus } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { useMemo, useState, useCallback } from "react";
import type { TeamSelectionMode, Team, Shot, ZoneStats } from "@/context/GameContext";

const COLORS = ["hsl(142, 71%, 45%)", "hsl(0, 84%, 60%)", "hsl(45, 93%, 47%)", "hsl(217, 91%, 60%)", "hsl(280, 68%, 60%)", "hsl(190, 90%, 50%)"];
const TEAM_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// Helper to compute stats from a given shot array
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

// Reusable stats display components
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

const PlayerBarChart = ({ players, shotSource }: { players: { id: string; name: string }[]; shotSource: Shot[] }) => {
  const barData = players.map(p => {
    const stats = computePlayerStats(p.id, shotSource);
    return {
      name: p.name,
      points: stats.totalPoints,
      fgPct: stats.attempts > 0 ? Math.round((stats.makes / stats.attempts) * 100) : 0,
    };
  });

  return (
    <div className="glass-card rounded-xl p-4 space-y-3">
      <h3 className="text-sm font-display font-bold text-foreground">📊 Player Comparison</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
            <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
            <Bar dataKey="points" name="Points" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="fgPct" name="FG%" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
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

const GameSummary = ({ onStartTeamMode }: GameSummaryProps) => {
  const { players, teams, shots, gameMode, getPlayerStats, resetGame, exportCSV, individualShots, teamShots, allShots } = useGame();
  const mp = useMultiplayer();
  const [showTeamSetup, setShowTeamSetup] = useState(false);
  const [teamSelectionMode, setTeamSelectionMode] = useState<TeamSelectionMode>("random");
  const [manualTeams, setManualTeams] = useState<Record<number, string[]>>({});

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

  const handleStartTeamMode = () => {
    if (teamSelectionMode === "manual") {
      const allAssigned = players.every(p => Object.values(manualTeams).some(ids => ids.includes(p.id)));
      const allTeamsHavePlayers = Array.from({ length: teamCount }, (_, i) => i).every(i => (manualTeams[i] || []).length > 0);
      if (!allAssigned || !allTeamsHavePlayers) return;
      const builtTeams: Team[] = Array.from({ length: teamCount }, (_, i) => ({
        id: `team-manual-${i}-${Date.now()}`,
        name: `Team ${TEAM_LETTERS[i]}`,
        playerIds: manualTeams[i] || [],
      }));
      onStartTeamMode?.(teamSelectionMode, teamCount, builtTeams);
    } else {
      onStartTeamMode?.(teamSelectionMode, teamCount);
    }
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

  // Determine if we have data from both modes (show tabbed view)
  const hasIndividualData = individualShots.length > 0;
  const hasTeamData = teamShots.length > 0;
  const showTabbedSummary = hasIndividualData && hasTeamData && gameMode === "team";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏀</span>
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
        {/* Team Mode CTA - only show after individual mode when no team data yet */}
        {gameMode === "individual" && onStartTeamMode && players.length >= 2 && !showTeamSetup && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}
            className="glass-card rounded-xl p-5 text-center space-y-3 border-2 border-primary/30">
            <Users className="w-8 h-8 text-primary mx-auto" />
            <h3 className="text-lg font-display font-bold text-foreground">Ready for Team Mode?</h3>
            <p className="text-sm text-muted-foreground">Use these same players to play a team game (30 shots per team)</p>
            <Button className="font-bold text-lg h-12 px-8" onClick={() => setShowTeamSetup(true)}>👥 Play Team Mode</Button>
          </motion.div>
        )}

        {/* Team Selection UI */}
        {showTeamSetup && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            className="glass-card rounded-xl p-5 space-y-4">
            <h3 className="text-lg font-display font-bold text-foreground text-center">Team Selection</h3>
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
              <Button className="flex-1 font-bold" disabled={teamSelectionMode === "manual" && !manualReady} onClick={handleStartTeamMode}>
                🏀 Start Team Mode
              </Button>
            </div>
          </motion.div>
        )}

        {/* Tabbed Summary for after team mode (has both individual + team data) */}
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
          /* Standard summary (individual mode only, or team mode without prior individual data) */
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
