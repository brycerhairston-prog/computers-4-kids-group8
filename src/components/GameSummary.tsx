import { useGame, ZONE_LABELS, ZONE_POINTS } from "@/context/GameContext";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { RotateCcw, Trophy, Download } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

const COLORS = ["hsl(142, 71%, 45%)", "hsl(0, 84%, 60%)", "hsl(45, 93%, 47%)", "hsl(217, 91%, 60%)", "hsl(280, 68%, 60%)", "hsl(190, 90%, 50%)"];

const GameSummary = () => {
  const { players, teams, shots, gameMode, getPlayerStats, getTeamStats, resetGame, exportCSV } = useGame();

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

  const playerSummaries = players.map(p => {
    const stats = getPlayerStats(p.id);
    const bestZone = Object.entries(stats.zones).reduce((best, [z, zs]) =>
      zs.fgPct > (best?.fgPct ?? 0) && zs.attempts > 0 ? { zone: Number(z), ...zs } : best,
      null as (null | { zone: number; makes: number; attempts: number; fgPct: number })
    );
    return { ...p, stats, bestZone };
  });

  const teamSummaries = teams.map(t => {
    const stats = getTeamStats(t.id);
    const bestZone = Object.entries(stats.zones).reduce((best, [z, zs]) =>
      zs.fgPct > (best?.fgPct ?? 0) && zs.attempts > 0 ? { zone: Number(z), ...zs } : best,
      null as (null | { zone: number; makes: number; attempts: number; fgPct: number })
    );
    return { ...t, stats, bestZone };
  });

  // Find MVP
  const mvp = playerSummaries.reduce((best, p) =>
    p.stats.totalPoints > (best?.stats.totalPoints ?? 0) ? p : best,
    null as (typeof playerSummaries[0] | null)
  );

  // Bar chart data for all players
  const barData = playerSummaries.map(p => ({
    name: p.name,
    points: p.stats.totalPoints,
    fgPct: p.stats.attempts > 0 ? Math.round((p.stats.makes / p.stats.attempts) * 100) : 0,
  }));

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
            <Button size="sm" onClick={resetGame} className="gap-1 text-xs">
              <RotateCcw className="w-3 h-3" /> New Game
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* MVP Banner */}
        {mvp && (
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
        )}

        {/* Player Performance Bar Chart */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="glass-card rounded-xl p-4 space-y-3">
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
        </motion.div>

        {/* Player Stats Table */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
          className="glass-card rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-display font-bold text-foreground">📋 Detailed Stats</h3>
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
                {playerSummaries.map(p => (
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
        </motion.div>

        {/* Individual Player Pie Charts */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="space-y-3">
          <h3 className="text-sm font-display font-bold text-foreground glass-card rounded-xl p-4">🥧 Shot Distribution by Player</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {playerSummaries.map((p, idx) => {
              const pieData = [1, 2, 3, 4, 5, 6]
                .filter(z => p.stats.zones[z].attempts > 0)
                .map(z => ({
                  name: ZONE_LABELS[z],
                  value: p.stats.zones[z].attempts,
                  makes: p.stats.zones[z].makes,
                  fgPct: p.stats.zones[z].fgPct,
                }));
              if (pieData.length === 0) return null;
              return (
                <div key={p.id} className="glass-card rounded-xl p-4 space-y-2">
                  <h4 className="text-xs font-bold text-foreground text-center">{p.name}</h4>
                  <p className="text-[10px] text-muted-foreground text-center">
                    {p.stats.totalPoints} pts · {p.stats.attempts > 0 ? Math.round((p.stats.makes / p.stats.attempts) * 100) : 0}% FG
                  </p>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                          outerRadius={55} innerRadius={25} paddingAngle={2} label={({ name, value }) => `${value}`}>
                          {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(value: number, name: string, props: any) =>
                          [`${props.payload.makes}/${value} (${props.payload.fgPct.toFixed(0)}%)`, name]
                        } contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11, color: "hsl(var(--foreground))" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Team Summaries */}
        {gameMode === "team" && teams.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
            className="space-y-3">
            <h3 className="text-sm font-display font-bold text-foreground glass-card rounded-xl p-4">👥 Team Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teamSummaries.map((t, idx) => {
                const teamPlayers = players.filter(p => t.playerIds.includes(p.id));
                const pieData = [1, 2, 3, 4, 5, 6]
                  .filter(z => t.stats.zones[z]?.attempts > 0)
                  .map(z => ({
                    name: ZONE_LABELS[z],
                    value: t.stats.zones[z].attempts,
                    makes: t.stats.zones[z].makes,
                    fgPct: t.stats.zones[z].fgPct,
                  }));
                return (
                  <div key={t.id} className="glass-card rounded-xl p-4 space-y-3">
                    <div className="text-center space-y-1">
                      <h4 className="text-lg font-display font-bold text-foreground">{t.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {t.stats.totalPoints} pts · {t.stats.makes}/{t.stats.attempts} ({t.stats.attempts > 0 ? Math.round((t.stats.makes / t.stats.attempts) * 100) : 0}% FG)
                        {t.bestZone && ` · Best: ${ZONE_LABELS[t.bestZone.zone]}`}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Players: {teamPlayers.map(p => p.name).join(", ")}
                      </p>
                    </div>
                    {pieData.length > 0 && (
                      <div className="h-44">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                              outerRadius={60} innerRadius={28} paddingAngle={2}
                              label={({ name, value }) => `${value}`}>
                              {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip formatter={(value: number, name: string, props: any) =>
                              [`${props.payload.makes}/${value} (${props.payload.fgPct.toFixed(0)}%)`, name]
                            } contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11, color: "hsl(var(--foreground))" }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default GameSummary;
