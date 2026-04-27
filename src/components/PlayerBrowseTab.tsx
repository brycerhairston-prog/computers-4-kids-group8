import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, BarChart3, UserPlus, Users } from "lucide-react";
import { listAllPlayers, type BrowsePlayer, type BrowseSortBy } from "@/lib/playerDatabase";
import PlayerProfileDialog from "@/components/PlayerProfileDialog";

interface Props {
  onLoad?: (player: BrowsePlayer) => void;
}

const relativeTime = (iso: string | null): string => {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "Just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
};

const PlayerBrowseTab = ({ onLoad }: Props) => {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<BrowseSortBy>("recent");
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<BrowsePlayer[]>([]);
  const [profileUuid, setProfileUuid] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    listAllPlayers({ sortBy, limit: 200 })
      .then(rows => { if (active) setPlayers(rows); })
      .catch(err => console.warn("listAllPlayers failed", err))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [sortBy, refreshKey]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return players;
    return players.filter(p => p.name.toLowerCase().includes(q) || p.player_id.toLowerCase().includes(q));
  }, [players, search]);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name or Player ID..."
            className="h-9 pl-8 text-sm"
          />
        </div>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as BrowseSortBy)}
          className="h-9 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Sort players"
        >
          <option value="recent">Recent</option>
          <option value="games">Most Games</option>
          <option value="fg">Best FG%</option>
          <option value="name">Name A-Z</option>
        </select>
        <Button size="sm" variant="ghost" onClick={() => setRefreshKey(k => k + 1)} className="h-9">
          ↻
        </Button>
      </div>

      <div className="max-h-[420px] overflow-y-auto space-y-2 pr-1">
        {loading && (
          <div className="flex items-center justify-center py-8 text-muted-foreground text-sm gap-2">
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Loading players...
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="rounded-lg border border-dashed border-muted-foreground/30 p-6 text-center space-y-2">
            <Users className="w-8 h-8 mx-auto text-muted-foreground/60" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">
              {search ? "No players match your search." : "No players yet. Finish a game to start building the database."}
            </p>
          </div>
        )}

        {!loading && filtered.map(p => (
          <div
            key={p.id}
            className="rounded-lg border border-border bg-card/40 p-3 hover:bg-card/70 transition-colors space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-foreground truncate">{p.name}</span>
                  <span className="text-[10px] font-mono text-muted-foreground bg-secondary/60 px-1.5 py-0.5 rounded">
                    {p.player_id}
                  </span>
                </div>
                {p.playstyle_tag && (
                  <span className="inline-block text-[9px] uppercase tracking-wider font-bold text-accent-foreground bg-accent/20 px-1.5 py-0.5 rounded mt-1">
                    {p.playstyle_tag}
                  </span>
                )}
              </div>
              <div className="text-right text-[10px] text-muted-foreground shrink-0">
                {relativeTime(p.last_played_at)}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-background/50 rounded px-1 py-1">
                <div className="text-[9px] uppercase text-muted-foreground">Games</div>
                <div className="font-bold tabular-nums">{p.games_played}</div>
              </div>
              <div className="bg-background/50 rounded px-1 py-1">
                <div className="text-[9px] uppercase text-muted-foreground">FG%</div>
                <div className="font-bold tabular-nums">{p.fg_pct.toFixed(0)}%</div>
              </div>
              <div className="bg-background/50 rounded px-1 py-1">
                <div className="text-[9px] uppercase text-muted-foreground">Pts</div>
                <div className="font-bold tabular-nums">{p.total_points}</div>
              </div>
            </div>

            <div className="flex gap-2">
              {onLoad && (
                <Button size="sm" className="flex-1 h-8 gap-1 text-xs" onClick={() => onLoad(p)}>
                  <UserPlus className="w-3 h-3" aria-hidden="true" /> Load
                </Button>
              )}
              <Button size="sm" variant="outline" className="flex-1 h-8 gap-1 text-xs" onClick={() => setProfileUuid(p.id)}>
                <BarChart3 className="w-3 h-3" aria-hidden="true" /> Profile
              </Button>
            </div>
          </div>
        ))}
      </div>

      {profileUuid && (
        <PlayerProfileDialog
          open={!!profileUuid}
          onOpenChange={(v) => { if (!v) setProfileUuid(null); }}
          playerUuid={profileUuid}
        />
      )}
    </div>
  );
};

export default PlayerBrowseTab;
