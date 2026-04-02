import { useGame, type Team, type GameMode, type TeamSelectionMode } from "@/context/GameContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Plus, Trash2, Users, User, Shuffle, Scale, Hand } from "lucide-react";
import { motion } from "framer-motion";

const GameSetup = () => {
  const {
    players, addPlayer, removePlayer,
    gameMode, setGameMode,
    teamSelectionMode, setTeamSelectionMode,
    setTeams, startGame,
  } = useGame();
  const [newName, setNewName] = useState("");
  const [manualTeamA, setManualTeamA] = useState<string[]>([]);
  const [manualTeamB, setManualTeamB] = useState<string[]>([]);

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) return;
    addPlayer(name);
    setNewName("");
  };

  const canStart = players.length >= 2;
  const needsManualTeams = gameMode === "team" && teamSelectionMode === "manual";

  const handleStart = () => {
    if (needsManualTeams) {
      const unassigned = players.filter(p => !manualTeamA.includes(p.id) && !manualTeamB.includes(p.id));
      if (unassigned.length > 0 || manualTeamA.length === 0 || manualTeamB.length === 0) return;
      setTeams([
        { id: "team-a", name: "Team A", playerIds: manualTeamA },
        { id: "team-b", name: "Team B", playerIds: manualTeamB },
      ]);
    }
    startGame();
  };

  const toggleManualAssign = (playerId: string, team: "a" | "b") => {
    if (team === "a") {
      setManualTeamB(prev => prev.filter(id => id !== playerId));
      setManualTeamA(prev =>
        prev.includes(playerId) ? prev.filter(id => id !== playerId) : [...prev, playerId]
      );
    } else {
      setManualTeamA(prev => prev.filter(id => id !== playerId));
      setManualTeamB(prev =>
        prev.includes(playerId) ? prev.filter(id => id !== playerId) : [...prev, playerId]
      );
    }
  };

  const unassignedPlayers = needsManualTeams
    ? players.filter(p => !manualTeamA.includes(p.id) && !manualTeamB.includes(p.id))
    : [];

  const manualReady = needsManualTeams && manualTeamA.length > 0 && manualTeamB.length > 0 && unassignedPlayers.length === 0;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card rounded-xl p-6 max-w-lg w-full space-y-6"
      >
        <div className="text-center space-y-1">
          <span className="text-4xl">🏀</span>
          <h1 className="text-2xl font-display font-bold text-foreground">Tabletop Basketball Analytics</h1>
          <p className="text-sm text-muted-foreground">Set up your game below</p>
        </div>

        {/* Players */}
        <div className="space-y-2">
          <h2 className="text-sm font-display font-bold text-foreground">Players</h2>
          <div className="space-y-1">
            {players.map(p => (
              <div key={p.id} className="flex items-center justify-between bg-secondary/30 rounded-md px-3 py-1.5">
                <span className="text-sm">{p.name}</span>
                <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  onClick={() => {
                    removePlayer(p.id);
                    setManualTeamA(prev => prev.filter(id => id !== p.id));
                    setManualTeamB(prev => prev.filter(id => id !== p.id));
                  }}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input value={newName} onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAdd()}
              placeholder="Add player..." className="h-8 text-sm bg-secondary/50" />
            <Button size="sm" onClick={handleAdd} className="gap-1 shrink-0">
              <Plus className="w-3 h-3" /> Add
            </Button>
          </div>
        </div>

        {/* Game Mode */}
        <div className="space-y-2">
          <h2 className="text-sm font-display font-bold text-foreground">Game Mode</h2>
          <div className="grid grid-cols-2 gap-2">
            {([
              { mode: "individual" as GameMode, icon: User, label: "Individual", desc: "20 shots per player" },
              { mode: "team" as GameMode, icon: Users, label: "Team", desc: "30 shots per team" },
            ]).map(({ mode, icon: Icon, label, desc }) => (
              <button
                key={mode}
                onClick={() => setGameMode(mode)}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all text-sm ${
                  gameMode === mode
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50 text-muted-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-semibold">{label}</span>
                <span className="text-[10px] opacity-70">{desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Team Selection Mode */}
        {gameMode === "team" && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-2">
            <h2 className="text-sm font-display font-bold text-foreground">Team Selection</h2>
            <div className="grid grid-cols-3 gap-2">
              {([
                { mode: "random" as TeamSelectionMode, icon: Shuffle, label: "Random", desc: "Shuffle players" },
                { mode: "manual" as TeamSelectionMode, icon: Hand, label: "Manual", desc: "Pick teams yourself" },
                { mode: "fair" as TeamSelectionMode, icon: Scale, label: "Fair", desc: "Based on stats" },
              ]).map(({ mode, icon: Icon, label, desc }) => (
                <button
                  key={mode}
                  onClick={() => setTeamSelectionMode(mode)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all text-xs ${
                    teamSelectionMode === mode
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50 text-muted-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-semibold">{label}</span>
                  <span className="text-[9px] opacity-70">{desc}</span>
                </button>
              ))}
            </div>

            {/* Manual team assignment */}
            {needsManualTeams && players.length >= 2 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-primary">Team A</h3>
                    {manualTeamA.map(id => {
                      const p = players.find(pl => pl.id === id);
                      return p ? (
                        <div key={id} className="text-xs bg-primary/10 rounded px-2 py-1 flex justify-between">
                          {p.name}
                          <button onClick={() => toggleManualAssign(id, "a")} className="text-muted-foreground hover:text-destructive">×</button>
                        </div>
                      ) : null;
                    })}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-accent">Team B</h3>
                    {manualTeamB.map(id => {
                      const p = players.find(pl => pl.id === id);
                      return p ? (
                        <div key={id} className="text-xs bg-accent/10 rounded px-2 py-1 flex justify-between">
                          {p.name}
                          <button onClick={() => toggleManualAssign(id, "b")} className="text-muted-foreground hover:text-destructive">×</button>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
                {unassignedPlayers.length > 0 && (
                  <div className="space-y-1">
                    <h3 className="text-xs text-muted-foreground">Unassigned:</h3>
                    <div className="flex flex-wrap gap-1">
                      {unassignedPlayers.map(p => (
                        <div key={p.id} className="flex gap-1">
                          <Button size="sm" variant="outline" className="text-[10px] h-6 px-2" onClick={() => toggleManualAssign(p.id, "a")}>
                            {p.name} → A
                          </Button>
                          <Button size="sm" variant="outline" className="text-[10px] h-6 px-2" onClick={() => toggleManualAssign(p.id, "b")}>
                            {p.name} → B
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Start */}
        <Button
          className="w-full font-bold text-lg h-12"
          disabled={!canStart || (needsManualTeams && !manualReady)}
          onClick={handleStart}
        >
          🏀 Start Game
        </Button>
        {!canStart && <p className="text-xs text-center text-muted-foreground">Add at least 2 players to start</p>}
      </motion.div>
    </div>
  );
};

export default GameSetup;
