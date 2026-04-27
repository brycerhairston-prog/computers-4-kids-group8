import { useState } from "react";
import c4kLogo from "@/assets/c4k-logo.png";
import { useMultiplayer } from "@/context/MultiplayerContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Users, Plus, LogIn, ArrowLeft, Loader2, Trash2, UserMinus, DoorOpen, Search } from "lucide-react";
import { toast } from "sonner";
import SettingsPanel from "@/components/SettingsPanel";
import PlayerLookupDialog from "@/components/PlayerLookupDialog";
import { useTranslation } from "react-i18next";
import { resolveOrCreatePlayer, getRecentPlayerIds, linkSessionToGlobalPlayer, type PlayerLookupResult } from "@/lib/playerDatabase";

type LobbyView = "welcome" | "create" | "join" | "waiting";

const Lobby = () => {
  const { t } = useTranslation();
  const {
    session, sessionPlayers, isHost, isConnected, isLoading, localPlayerIds,
    createGame, joinGame, startMultiplayerGame, addPlayerToStation, removePlayer, leaveSession,
  } = useMultiplayer();
  const [view, setView] = useState<LobbyView>("welcome");
  const [playerNames, setPlayerNames] = useState<string[]>([""]);
  const [playerIds, setPlayerIds] = useState<string[]>([""]);
  const [gameCode, setGameCode] = useState("");
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerExternalId, setNewPlayerExternalId] = useState("");
  const [addingPlayer, setAddingPlayer] = useState(false);
  const [lookupOpen, setLookupOpen] = useState(false);
  const recentIds = getRecentPlayerIds();

  const addNameField = () => {
    if (playerNames.length >= 8) { toast.error("Max 8 players per device"); return; }
    setPlayerNames(prev => [...prev, ""]);
    setPlayerIds(prev => [...prev, ""]);
  };

  const removeNameField = (idx: number) => {
    if (playerNames.length <= 1) return;
    setPlayerNames(prev => prev.filter((_, i) => i !== idx));
    setPlayerIds(prev => prev.filter((_, i) => i !== idx));
  };

  const updateName = (idx: number, value: string) => {
    setPlayerNames(prev => prev.map((n, i) => i === idx ? value : n));
  };

  const updateId = (idx: number, value: string) => {
    setPlayerIds(prev => prev.map((n, i) => i === idx ? value : n));
  };

  const validNames = playerNames.map(n => n.trim()).filter(Boolean);

  /** After session players are created, resolve/create global player records and link them. */
  const persistPlayerLinks = async () => {
    // Read latest session players from store-of-truth via a small delay-free approach:
    // We rely on the createGame/joinGame having set sessionPlayers via state; but here we
    // can't read the freshly-set value synchronously. Use a microtask wait then react closure.
    // Simpler: re-query via supabase client is overkill; instead derive from the fact that
    // names map 1:1 to indices in the order we passed them.
    // We'll match by name + device order.
    setTimeout(async () => {
      try {
        const fresh = sessionPlayersRef.current;
        for (let i = 0; i < playerNames.length; i++) {
          const name = playerNames[i].trim();
          if (!name) continue;
          const id = (playerIds[i] || "").trim();
          // Find the matching session player (most recently added with this name on our device)
          const match = fresh.find(p => p.name === name && localPlayerIdsRef.current.includes(p.id));
          if (!match) continue;
          try {
            const player = await resolveOrCreatePlayer(id || undefined, name);
            linkSessionToGlobalPlayer(match.id, player.id);
          } catch (err) {
            console.warn("Failed to link player", name, err);
          }
        }
      } catch (err) {
        console.warn("persistPlayerLinks failed", err);
      }
    }, 200);
  };

  // Refs to read latest values inside setTimeout
  const sessionPlayersRef = { current: sessionPlayers };
  sessionPlayersRef.current = sessionPlayers;
  const localPlayerIdsRef = { current: localPlayerIds };
  localPlayerIdsRef.current = localPlayerIds;

  const handleCreate = async () => {
    if (validNames.length === 0) { toast.error("Add at least one player name"); return; }
    await createGame(validNames);
    persistPlayerLinks();
    setView("waiting");
  };

  const handleJoin = async () => {
    if (validNames.length === 0) { toast.error("Add at least one player name"); return; }
    if (!gameCode.trim()) { toast.error("Enter a game code"); return; }
    await joinGame(gameCode, validNames);
    persistPlayerLinks();
    setView("waiting");
  };

  const copyCode = () => {
    if (session?.game_code) {
      navigator.clipboard.writeText(session.game_code);
      toast.success("Code copied!");
    }
  };

  const handleAddPlayerToStation = async () => {
    const name = newPlayerName.trim();
    if (!name) { toast.error("Enter a player name"); return; }
    setAddingPlayer(true);
    await addPlayerToStation(name);
    const idInput = newPlayerExternalId.trim();
    setNewPlayerName("");
    setNewPlayerExternalId("");
    setAddingPlayer(false);
    // Link after the session player row is in state
    setTimeout(async () => {
      const fresh = sessionPlayersRef.current;
      const match = [...fresh].reverse().find(p => p.name === name && localPlayerIdsRef.current.includes(p.id));
      if (!match) return;
      try {
        const player = await resolveOrCreatePlayer(idInput || undefined, name);
        linkSessionToGlobalPlayer(match.id, player.id);
      } catch (err) {
        console.warn("link station player failed", err);
      }
    }, 250);
  };

  const handleLookupLoad = (result: PlayerLookupResult) => {
    // Drop the loaded player into the first empty name slot (or append).
    setPlayerNames(prev => {
      const idx = prev.findIndex(n => !n.trim());
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = result.player.name;
        return next;
      }
      if (prev.length >= 8) { toast.error("Max 8 players per device"); return prev; }
      return [...prev, result.player.name];
    });
    setPlayerIds(prev => {
      const idx = playerNames.findIndex(n => !n.trim());
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = result.player.player_id;
        return next;
      }
      return [...prev, result.player.player_id];
    });
  };

  const handleRemovePlayer = async (playerId: string, playerName: string) => {
    await removePlayer(playerId);
    toast.success(`${playerName} removed from game`);
  };

  const handleLeaveSession = async () => {
    await leaveSession();
    setView("welcome");
    setPlayerNames([""]);
    setPlayerIds([""]);
    setGameCode("");
  };

  if (session?.status === "playing") return null;

  // Waiting room
  if (view === "waiting" && session) {
    const localPlayers = sessionPlayers.filter(p => localPlayerIds.includes(p.id));
    const otherPlayers = sessionPlayers.filter(p => !localPlayerIds.includes(p.id));

    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card rounded-xl p-6 max-w-md w-full space-y-6"
        >
          <header className="text-center space-y-2 relative">
            <div className="absolute top-0 right-0"><SettingsPanel /></div>
            <img src={c4kLogo} alt="C4K" className="w-10 h-10 mx-auto" />
            <h1 className="text-2xl font-display font-bold text-foreground">{t("lobby.gameLobby")}</h1>
            <div className="flex items-center justify-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-yellow-500"} animate-pulse`} />
              <span className="text-xs text-muted-foreground">
                {isConnected ? t("lobby.connected") : t("lobby.connecting")}
              </span>
            </div>
          </header>

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">{t("lobby.shareCode")}</p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl font-mono font-bold tracking-[0.3em] text-primary bg-primary/10 px-4 py-2 rounded-lg">
                {session.game_code}
              </span>
              <Button size="icon" variant="outline" onClick={copyCode} aria-label={t("lobby.copyCode")}>
                <Copy className="w-4 h-4" aria-hidden="true" />
              </Button>
            </div>
          </div>

          {/* Player list */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-display font-bold text-foreground">
              <Users className="w-4 h-4" aria-hidden="true" />
              {t("lobby.players")} ({sessionPlayers.length})
            </div>

            {/* Your station players */}
            {localPlayers.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{t("lobby.yourStation")}</p>
                {localPlayers.map(p => (
                  <div key={p.id} className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-md px-3 py-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="text-sm flex-1">{p.name}</span>
                    {isHost && localPlayers.length > 1 && (
                      <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => handleRemovePlayer(p.id, p.name)} aria-label={t("lobby.removePlayer", { name: p.name })}>
                        <Trash2 className="w-3 h-3" aria-hidden="true" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Other station players */}
            {otherPlayers.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{t("lobby.otherStations")}</p>
                {otherPlayers.map(p => (
                  <div key={p.id} className="flex items-center gap-2 bg-secondary/30 rounded-md px-3 py-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="text-sm flex-1">{p.name}</span>
                    {isHost && (
                      <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => handleRemovePlayer(p.id, p.name)} aria-label={t("lobby.removePlayer", { name: p.name })}>
                        <UserMinus className="w-3 h-3" aria-hidden="true" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Add player to station */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={newPlayerName}
                  onChange={e => setNewPlayerName(e.target.value)}
                  placeholder={t("lobby.addToStation")}
                  className="h-9 text-sm"
                  maxLength={20}
                  onKeyDown={e => e.key === "Enter" && handleAddPlayerToStation()}
                />
                <Button size="sm" className="h-9 gap-1 shrink-0" onClick={handleAddPlayerToStation} disabled={addingPlayer || !newPlayerName.trim()}>
                  {addingPlayer ? <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" /> : <Plus className="w-3 h-3" aria-hidden="true" />}
                  {t("common.add")}
                </Button>
              </div>
              <Input
                value={newPlayerExternalId}
                onChange={e => setNewPlayerExternalId(e.target.value)}
                placeholder="Player ID (optional)"
                className="h-8 text-xs font-mono"
                maxLength={32}
                list="recent-player-ids"
              />
            </div>

            <p className="text-xs text-muted-foreground text-center">
              {t("lobby.waitingForPlayers")}
            </p>
          </div>

          {isHost && (
            <Button
              className="w-full font-bold text-lg h-12"
              disabled={sessionPlayers.length < 2}
              onClick={startMultiplayerGame}
            >
              {t("lobby.startGame", { count: sessionPlayers.length })}
            </Button>
          )}
          {!isHost && (
            <p className="text-sm text-center text-muted-foreground">
              {t("lobby.waitingForHost")}
            </p>
          )}
          {isHost && sessionPlayers.length < 2 && (
            <p className="text-xs text-center text-muted-foreground">{t("lobby.needPlayers")}</p>
          )}

          {/* Leave button */}
          <Button
            variant="outline"
            className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={handleLeaveSession}
          >
            <DoorOpen className="w-4 h-4" aria-hidden="true" /> {t("lobby.leaveGame")}
          </Button>
        </motion.div>
        <datalist id="recent-player-ids">
          {recentIds.map(id => <option key={id} value={id} />)}
        </datalist>
        <PlayerLookupDialog open={lookupOpen} onOpenChange={setLookupOpen} />
      </main>
    );
  }

  const playerNameInputsJsx = (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">{t("lobby.playersAtStation")}</label>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => setLookupOpen(true)} className="text-xs gap-1 h-7">
            <Search className="w-3 h-3" aria-hidden="true" /> Lookup
          </Button>
          <Button size="sm" variant="ghost" onClick={addNameField} className="text-xs gap-1 h-7">
            <Plus className="w-3 h-3" aria-hidden="true" /> {t("lobby.addPlayer")}
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        {playerNames.map((name, idx) => (
          <div key={idx} className="space-y-1">
            <div className="flex gap-2">
              <Input
                value={name}
                onChange={e => updateName(idx, e.target.value)}
                placeholder={t("lobby.playerPlaceholder", { n: idx + 1 })}
                className="h-10 text-sm"
                maxLength={20}
              />
              {playerNames.length > 1 && (
                <Button size="icon" variant="ghost" onClick={() => removeNameField(idx)} className="h-10 w-10 shrink-0 text-muted-foreground hover:text-destructive" aria-label={t("lobby.removePlayerField")}>
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </Button>
              )}
            </div>
            <Input
              value={playerIds[idx] || ""}
              onChange={e => updateId(idx, e.target.value)}
              placeholder="Player ID (optional — auto-generated if blank)"
              className="h-8 text-xs font-mono"
              maxLength={32}
              list="recent-player-ids"
            />
          </div>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground">{t("lobby.addAllPlayers")}</p>
    </div>
  );

  const recentIdsDatalist = (
    <datalist id="recent-player-ids">
      {recentIds.map(id => <option key={id} value={id} />)}
    </datalist>
  );

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {view === "welcome" && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-card rounded-xl p-8 max-w-md w-full space-y-8"
          >
            <header className="text-center space-y-2 relative">
              <div className="absolute top-0 right-0"><SettingsPanel /></div>
              <img src={c4kLogo} alt="C4K" className="w-12 h-12 mx-auto" />
              <h1 className="text-3xl font-display font-bold text-foreground">{t("lobby.title")}</h1>
              <p className="text-sm text-muted-foreground">{t("lobby.subtitle")}</p>
            </header>

            <div className="space-y-3">
              <Button
                className="w-full h-14 text-lg font-bold gap-3"
                onClick={() => setView("create")}
              >
                <Plus className="w-5 h-5" aria-hidden="true" /> {t("lobby.createGame")}
              </Button>
              <Button
                variant="outline"
                className="w-full h-14 text-lg font-bold gap-3"
                onClick={() => setView("join")}
              >
                <LogIn className="w-5 h-5" aria-hidden="true" /> {t("lobby.joinGame")}
              </Button>
            </div>

            <footer className="text-[10px] text-muted-foreground/70 text-center">
              {t("lobby.createdBy")}
              <br />{t("lobby.uvaCredit")}
            </footer>
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
            <header className="flex items-center gap-3">
              <Button size="icon" variant="ghost" onClick={() => setView("welcome")} aria-label={t("lobby.goBack")}>
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              </Button>
              <div className="flex-1">
                <h2 className="text-xl font-display font-bold text-foreground">{t("lobby.createGame")}</h2>
                <p className="text-xs text-muted-foreground">{t("lobby.createSubtitle")}</p>
              </div>
              <SettingsPanel />
            </header>

            {playerNameInputsJsx}

            <Button
              className="w-full h-12 text-lg font-bold"
              onClick={handleCreate}
              disabled={isLoading || validNames.length === 0}
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : t("lobby.creating", { count: validNames.length })}
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
            <header className="flex items-center gap-3">
              <Button size="icon" variant="ghost" onClick={() => setView("welcome")} aria-label={t("lobby.goBack")}>
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              </Button>
              <div className="flex-1">
                <h2 className="text-xl font-display font-bold text-foreground">{t("lobby.joinGame")}</h2>
                <p className="text-xs text-muted-foreground">{t("lobby.joinSubtitle")}</p>
              </div>
              <SettingsPanel />
            </header>

            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">{t("lobby.gameCode")}</label>
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
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : t("lobby.joining", { count: validNames.length })}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
};

export default Lobby;
