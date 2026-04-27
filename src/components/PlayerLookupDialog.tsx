import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, UserPlus, BarChart3, Trophy, Plus } from "lucide-react";
import { lookupPlayer, resolveOrCreatePlayer, type PlayerLookupResult } from "@/lib/playerDatabase";
import { ZONE_LABELS } from "@/context/GameContext";
import { toast } from "sonner";
import PlayerProfileDialog from "@/components/PlayerProfileDialog";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onLoad?: (result: PlayerLookupResult) => void;
}

const PlayerLookupDialog = ({ open, onOpenChange, onLoad }: Props) => {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [result, setResult] = useState<PlayerLookupResult | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [registerName, setRegisterName] = useState("");
  const [registering, setRegistering] = useState(false);

  const reset = () => {
    setQuery("");
    setResult(null);
    setSearched(false);
    setRegisterName("");
  };

  const handleSearch = async () => {
    const q = query.trim();
    if (!q) {
      toast.error("Enter a Player ID");
      return;
    }
    setSearching(true);
    try {
      const r = await lookupPlayer(q);
      setResult(r);
      setSearched(true);
    } catch (err) {
      toast.error("Lookup failed");
    } finally {
      setSearching(false);
    }
  };

  const handleRegister = async () => {
    const name = registerName.trim();
    if (!name) { toast.error("Enter a name"); return; }
    setRegistering(true);
    try {
      const player = await resolveOrCreatePlayer(query.trim(), name);
      const r = await lookupPlayer(player.player_id);
      if (r) {
        setResult(r);
        toast.success(`Registered ${player.name} (${player.player_id})`);
      }
    } catch (err) {
      toast.error("Registration failed");
    } finally {
      setRegistering(false);
    }
  };

  const handleLoad = () => {
    if (!result) return;
    onLoad?.(result);
    toast.success(`Loaded ${result.player.name}`);
    onOpenChange(false);
    reset();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" aria-hidden="true" /> Lookup Player
            </DialogTitle>
            <DialogDescription>Find a saved player by their Player ID, or register a new one.</DialogDescription>
          </DialogHeader>

          <div className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter Player ID (e.g. P-AB12C)"
              className="font-mono uppercase"
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              autoFocus
            />
            <Button onClick={handleSearch} disabled={searching} className="gap-1 shrink-0">
              {searching ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Search className="w-4 h-4" aria-hidden="true" />}
              Search
            </Button>
          </div>

          {searched && !result && (
            <div className="rounded-lg border border-dashed border-muted-foreground/30 p-4 space-y-3">
              <p className="text-sm text-muted-foreground text-center">No player found with this ID.</p>
              <div className="space-y-2">
                <p className="text-xs font-medium text-foreground">Register new player with this ID:</p>
                <div className="flex gap-2">
                  <Input
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    placeholder="Player name"
                    className="text-sm"
                    onKeyDown={(e) => e.key === "Enter" && handleRegister()}
                  />
                  <Button onClick={handleRegister} disabled={registering || !registerName.trim()} className="gap-1 shrink-0">
                    {registering ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Plus className="w-4 h-4" aria-hidden="true" />}
                    Register
                  </Button>
                </div>
              </div>
            </div>
          )}

          {result && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display font-bold text-lg text-foreground">{result.player.name}</h3>
                  <p className="text-xs font-mono text-muted-foreground">{result.player.player_id}</p>
                </div>
                {result.player.playstyle_tag && (
                  <span className="text-[10px] uppercase font-bold tracking-wider bg-accent/20 text-accent-foreground px-2 py-1 rounded">
                    {result.player.playstyle_tag}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-background/50 rounded p-2">
                  <div className="text-[10px] uppercase text-muted-foreground">Games</div>
                  <div className="text-lg font-bold">{result.career.games_played}</div>
                </div>
                <div className="bg-background/50 rounded p-2">
                  <div className="text-[10px] uppercase text-muted-foreground">FG%</div>
                  <div className="text-lg font-bold">{result.careerFgPct.toFixed(1)}%</div>
                </div>
                <div className="bg-background/50 rounded p-2">
                  <div className="text-[10px] uppercase text-muted-foreground">Makes</div>
                  <div className="text-lg font-bold">{result.career.total_makes}/{result.career.total_attempts}</div>
                </div>
              </div>

              {result.bestZone && (
                <div className="flex items-center gap-2 text-xs">
                  <Trophy className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
                  <span className="text-muted-foreground">Best zone:</span>
                  <span className="font-medium text-foreground">{ZONE_LABELS[result.bestZone]}</span>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <Button onClick={handleLoad} className="flex-1 gap-1">
                  <UserPlus className="w-4 h-4" aria-hidden="true" /> Load Player
                </Button>
                <Button variant="outline" onClick={() => setProfileOpen(true)} className="flex-1 gap-1">
                  <BarChart3 className="w-4 h-4" aria-hidden="true" /> View Full Stats
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {result && (
        <PlayerProfileDialog
          open={profileOpen}
          onOpenChange={setProfileOpen}
          playerUuid={result.player.id}
          initial={result}
        />
      )}
    </>
  );
};

export default PlayerLookupDialog;
