import { useState } from "react";
import { useMultiplayer } from "@/context/MultiplayerContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Users, Plus, LogIn, ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

type LobbyView = "welcome" | "create" | "join" | "waiting";

const Lobby = () => {
  const {
    session, sessionPlayers, isHost, isConnected, isLoading,
    createGame, joinGame, startMultiplayerGame,
  } = useMultiplayer();
  const [view, setView] = useState<LobbyView>("welcome");
  const [playerNames, setPlayerNames] = useState<string[]>([""]);
  const [gameCode, setGameCode] = useState("");

  const addNameField = () => {
    if (playerNames.length >= 8) { toast.error("Max 8 players per device"); return; }
    setPlayerNames(prev => [...prev, ""]);
  };

  const removeNameField = (idx: number) => {
    if (playerNames.length <= 1) return;
    setPlayerNames(prev => prev.filter((_, i) => i !== idx));
  };

  const updateName = (idx: number, value: string) => {
    setPlayerNames(prev => prev.map((n, i) => i === idx ? value : n));
  };

  const validNames = playerNames.map(n => n.trim()).filter(Boolean);

  const handleCreate = async () => {
    if (validNames.length === 0) { toast.error("Add at least one player name"); return; }
    await createGame(validNames);
    setView("waiting");
  };

  const handleJoin = async () => {
    if (validNames.length === 0) { toast.error("Add at least one player name"); return; }
    if (!gameCode.trim()) { toast.error("Enter a game code"); return; }
    await joinGame(gameCode, validNames);
    setView("waiting");
  };

  const copyCode = () => {
    if (session?.game_code) {
      navigator.clipboard.writeText(session.game_code);
      toast.success("Code copied!");
    }
  };

  if (session?.status === "playing") return null;

  // Waiting room
  if (view === "waiting" && session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card rounded-xl p-6 max-w-md w-full space-y-6"
        >
          <div className="text-center space-y-2">
            <span className="text-4xl">🏀</span>
            <h1 className="text-2xl font-display font-bold text-foreground">Game Lobby</h1>
            <div className="flex items-center justify-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-yellow-500"} animate-pulse`} />
              <span className="text-xs text-muted-foreground">
                {isConnected ? "Connected" : "Connecting..."}
              </span>
            </div>
          </div>

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">Share this code with other stations:</p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl font-mono font-bold tracking-[0.3em] text-primary bg-primary/10 px-4 py-2 rounded-lg">
                {session.game_code}
              </span>
              <Button size="icon" variant="outline" onClick={copyCode}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-display font-bold text-foreground">
              <Users className="w-4 h-4" />
              Players ({sessionPlayers.length})
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {sessionPlayers.map(p => (
                <div key={p.id} className="flex items-center gap-2 bg-secondary/30 rounded-md px-3 py-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="text-sm">{p.name}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Waiting for players to join...
            </p>
          </div>

          {isHost && (
            <Button
              className="w-full font-bold text-lg h-12"
              disabled={sessionPlayers.length < 2}
              onClick={startMultiplayerGame}
            >
              🏀 Start Game ({sessionPlayers.length} players)
            </Button>
          )}
          {!isHost && (
            <p className="text-sm text-center text-muted-foreground">
              Waiting for host to start the game...
            </p>
          )}
          {isHost && sessionPlayers.length < 2 && (
            <p className="text-xs text-center text-muted-foreground">Need at least 2 players to start</p>
          )}
        </motion.div>
      </div>
    );
  }

  const playerNameInputsJsx = (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">Players at this station</label>
        <Button size="sm" variant="ghost" onClick={addNameField} className="text-xs gap-1 h-7">
          <Plus className="w-3 h-3" /> Add Player
        </Button>
      </div>
      <div className="space-y-2">
        {playerNames.map((name, idx) => (
          <div key={idx} className="flex gap-2">
            <Input
              value={name}
              onChange={e => updateName(idx, e.target.value)}
              placeholder={`Player ${idx + 1} name...`}
              className="h-10 text-sm"
              maxLength={20}
            />
            {playerNames.length > 1 && (
              <Button size="icon" variant="ghost" onClick={() => removeNameField(idx)} className="h-10 w-10 shrink-0 text-muted-foreground hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground">Add all players using this device/station</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {view === "welcome" && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-card rounded-xl p-8 max-w-md w-full space-y-8"
          >
            <div className="text-center space-y-2">
              <span className="text-5xl">🏀</span>
              <h1 className="text-3xl font-display font-bold text-foreground">Tabletop Basketball</h1>
              <p className="text-sm text-muted-foreground">Real-time multiplayer analytics game</p>
            </div>

            <div className="space-y-3">
              <Button
                className="w-full h-14 text-lg font-bold gap-3"
                onClick={() => setView("create")}
              >
                <Plus className="w-5 h-5" /> Create Game
              </Button>
              <Button
                variant="outline"
                className="w-full h-14 text-lg font-bold gap-3"
                onClick={() => setView("join")}
              >
                <LogIn className="w-5 h-5" /> Join Game
              </Button>
            </div>
          </motion.div>
        )}

        {view === "create" && (
          <motion.div
            key="create"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="glass-card rounded-xl p-6 max-w-md w-full space-y-6"
          >
            <div className="flex items-center gap-3">
              <Button size="icon" variant="ghost" onClick={() => setView("welcome")}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h2 className="text-xl font-display font-bold text-foreground">Create Game</h2>
                <p className="text-xs text-muted-foreground">Set up a new game session</p>
              </div>
            </div>

            {playerNameInputsJsx}

            <Button
              className="w-full h-12 text-lg font-bold"
              onClick={handleCreate}
              disabled={isLoading || validNames.length === 0}
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : `Create Game (${validNames.length} player${validNames.length !== 1 ? "s" : ""})`}
            </Button>
          </motion.div>
        )}

        {view === "join" && (
          <motion.div
            key="join"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="glass-card rounded-xl p-6 max-w-md w-full space-y-6"
          >
            <div className="flex items-center gap-3">
              <Button size="icon" variant="ghost" onClick={() => setView("welcome")}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h2 className="text-xl font-display font-bold text-foreground">Join Game</h2>
                <p className="text-xs text-muted-foreground">Enter a game code to join</p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Game Code</label>
              <Input
                value={gameCode}
                onChange={e => setGameCode(e.target.value.toUpperCase())}
                placeholder="ABCDEF"
                className="h-12 text-xl font-mono tracking-[0.3em] text-center uppercase"
                maxLength={6}
              />
            </div>

            {playerNameInputsJsx}

            <Button
              className="w-full h-12 text-lg font-bold"
              onClick={handleJoin}
              disabled={isLoading || validNames.length === 0 || gameCode.length < 6}
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : `Join Game (${validNames.length} player${validNames.length !== 1 ? "s" : ""})`}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Lobby;
