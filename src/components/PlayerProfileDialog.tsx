import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ZONE_LABELS } from "@/context/GameContext";
import { getRecentGames, type GameHistoryRow, type PlayerLookupResult } from "@/lib/playerDatabase";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from "recharts";
import { Trophy, TrendingUp, Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  playerUuid: string;
  initial: PlayerLookupResult;
}

const ZONE_COLORS = ["#f97316", "#14b8a6", "#a855f7", "#3b82f6", "#eab308", "#ec4899"];

const PlayerProfileDialog = ({ open, onOpenChange, playerUuid, initial }: Props) => {
  const [history, setHistory] = useState<GameHistoryRow[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getRecentGames(playerUuid, 10)
      .then(setHistory)
      .finally(() => setLoading(false));
  }, [open, playerUuid]);

  const zoneFgData = useMemo(
    () =>
      [1, 2, 3, 4, 5, 6].map((z) => {
        const att = initial.career.zone_attempts[String(z)] || 0;
        const mk = initial.career.zone_makes[String(z)] || 0;
        return {
          zone: `Z${z}`,
          fgPct: att > 0 ? Math.round((mk / att) * 100) : 0,
          attempts: att,
        };
      }),
    [initial],
  );

  const distributionData = useMemo(
    () =>
      [1, 2, 3, 4, 5, 6]
        .map((z) => ({ name: `Z${z}`, value: initial.career.zone_attempts[String(z)] || 0 }))
        .filter((d) => d.value > 0),
    [initial],
  );

  const trendData = useMemo(
    () =>
      (history || [])
        .slice()
        .reverse()
        .map((h, i) => ({
          name: `G${i + 1}`,
          fgPct: h.attempts > 0 ? Math.round((h.makes / h.attempts) * 100) : 0,
        })),
    [history],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>{initial.player.name}</span>
            <span className="text-xs font-mono text-muted-foreground">{initial.player.player_id}</span>
          </DialogTitle>
          <DialogDescription>Career profile and shot tendencies.</DialogDescription>
        </DialogHeader>

        {/* Overview cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-secondary/40 rounded-lg p-3 text-center">
            <div className="text-[10px] uppercase text-muted-foreground">Games</div>
            <div className="text-2xl font-bold">{initial.career.games_played}</div>
          </div>
          <div className="bg-secondary/40 rounded-lg p-3 text-center">
            <div className="text-[10px] uppercase text-muted-foreground">Career FG%</div>
            <div className="text-2xl font-bold">{initial.careerFgPct.toFixed(1)}%</div>
          </div>
          <div className="bg-secondary/40 rounded-lg p-3 text-center">
            <div className="text-[10px] uppercase text-muted-foreground">Points</div>
            <div className="text-2xl font-bold">{initial.career.total_points}</div>
          </div>
          <div className="bg-secondary/40 rounded-lg p-3 text-center">
            <div className="text-[10px] uppercase text-muted-foreground">Makes</div>
            <div className="text-2xl font-bold">{initial.career.total_makes}/{initial.career.total_attempts}</div>
          </div>
        </div>

        {/* Highlights */}
        <div className="flex flex-wrap gap-2">
          {initial.bestZone && (
            <div className="flex items-center gap-2 text-xs bg-accent/15 border border-accent/30 px-3 py-1.5 rounded-full">
              <Trophy className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
              <span>Best zone: <strong>{ZONE_LABELS[initial.bestZone]}</strong></span>
            </div>
          )}
          {initial.player.playstyle_tag && (
            <div className="text-xs bg-primary/15 border border-primary/30 px-3 py-1.5 rounded-full">
              Playstyle: <strong>{initial.player.playstyle_tag}</strong>
            </div>
          )}
        </div>

        {/* FG% per zone */}
        <div className="space-y-1">
          <h4 className="text-sm font-display font-bold">FG% per Zone</h4>
          <div className="h-48 bg-secondary/20 rounded-lg p-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={zoneFgData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.2)" />
                <XAxis dataKey="zone" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", fontSize: 11 }} />
                <Bar dataKey="fgPct" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribution + Trend side by side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <h4 className="text-sm font-display font-bold">Shot Distribution</h4>
            <div className="h-48 bg-secondary/20 rounded-lg p-2">
              {distributionData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={distributionData} dataKey="value" outerRadius={60} label={{ fontSize: 10 }}>
                      {distributionData.map((_, i) => (
                        <Cell key={i} fill={ZONE_COLORS[i % ZONE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-muted-foreground">No shots yet</div>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <h4 className="text-sm font-display font-bold flex items-center gap-1">
              <TrendingUp className="w-4 h-4" aria-hidden="true" /> Recent Trend
            </h4>
            <div className="h-48 bg-secondary/20 rounded-lg p-2">
              {loading ? (
                <div className="h-full flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" aria-hidden="true" /></div>
              ) : trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.2)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                    <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", fontSize: 11 }} />
                    <Line type="monotone" dataKey="fgPct" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-muted-foreground">No game history</div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlayerProfileDialog;
