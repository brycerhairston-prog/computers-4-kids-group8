import { GameProvider, useGame, type Player, type Shot, type GamePhase } from "@/context/GameContext";
import { MultiplayerProvider, useMultiplayer } from "@/context/MultiplayerContext";
import HeatMap from "@/components/HeatMap";
import DataTable from "@/components/DataTable";
import ShotTracker from "@/components/ShotTracker";
import GameSetup from "@/components/GameSetup";
import GameSummary from "@/components/GameSummary";
import Lobby from "@/components/Lobby";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useMemo } from "react";

const PlayingDashboard = () => {
  const { resetGame, shots, gameMode, teams, players, isGameOver, gamePhase } = useGame();
  const mp = useMultiplayer();

  // Auto-transition to summary when game over
  useEffect(() => {
    if (isGameOver && gamePhase === "playing") {
      // Small delay for the last shot animation
      const t = setTimeout(() => {
        // We need to set phase to summary - but we handle this in the parent
      }, 500);
      return () => clearTimeout(t);
    }
  }, [isGameOver, gamePhase]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏀</span>
            <div>
              <h1 className="text-lg font-display font-bold text-foreground leading-tight">
                Tabletop Basketball Analytics
              </h1>
              <p className="text-[10px] text-muted-foreground">
                  {mp.isMultiplayer && mp.session ? `Game: ${mp.session.game_code} · ` : ""}
                  {mp.isMultiplayer ? `${mp.sessionPlayers.length} players` : (gameMode === "individual" ? "Individual Mode" : `Team Mode · ${teams.map(t => t.name).join(" vs ")}`)}
                  {" · "}{shots.length} shots
                  {mp.isMultiplayer && (
                    <span className="ml-1 inline-flex items-center gap-0.5">
                      <span className={`w-1.5 h-1.5 rounded-full inline-block ${mp.isConnected ? "bg-green-500" : "bg-yellow-500"}`} />
                    </span>
                  )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isGameOver && (
              <span className="text-xs font-bold text-primary animate-pulse">Game Over!</span>
            )}
              {mp.isMultiplayer ? (
                <>
                  {mp.isHost && (
                    <Button size="sm" variant="outline" onClick={mp.resetMultiplayerGame} className="gap-1 text-xs">
                      <RotateCcw className="w-3 h-3" /> Reset
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={mp.leaveGame} className="gap-1 text-xs">
                    Leave
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="outline" onClick={resetGame} className="gap-1 text-xs">
                  <RotateCcw className="w-3 h-3" /> New Game
                </Button>
              )}
          </div>
        </div>
      </header>

      <main className="container py-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        >
          <div className="space-y-4">
            <Tabs defaultValue="tracker" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="tracker" className="flex-1">📍 Shot Tracker</TabsTrigger>
                <TabsTrigger value="heatmap" className="flex-1">🔥 Heat Map</TabsTrigger>
              </TabsList>
              <TabsContent value="tracker">
                <ShotTracker />
              </TabsContent>
              <TabsContent value="heatmap">
                <HeatMap />
              </TabsContent>
            </Tabs>
          </div>
          <div className="space-y-4">
            <DataTable />
            <div className="glass-card rounded-lg p-4 space-y-2">
              <h3 className="text-sm font-display font-bold text-primary">🧠 Data Science Tips</h3>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                <li>
                  <strong className="text-foreground">FG% (Field Goal Percentage)</strong> = Makes ÷ Attempts × 100.
                </li>
                <li>
                  <strong className="text-foreground">Hot Zones</strong> show where a player shoots best.
                </li>
                <li>
                  <strong className="text-foreground">Pattern Recognition:</strong> Look for clusters of green pins.
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

const GameRouter = () => {
  const { gamePhase, isGameOver } = useGame();
  const { isMultiplayer, session } = useMultiplayer();

  if (!isMultiplayer) return <Lobby />;
  if (session?.status === "waiting") return <Lobby />;
  if (isGameOver) return <GameSummary />;
  return <PlayingDashboard />;
};

const MultiplayerGameWrapper = () => {
  const { isMultiplayer, session, sessionPlayers, sessionShots } = useMultiplayer();

  const players: Player[] = useMemo(() =>
    sessionPlayers.map(p => ({ id: p.id, name: p.name, color: p.color })),
    [sessionPlayers]
  );

  const shots: Shot[] = useMemo(() =>
    sessionShots.map(s => ({
      id: s.id,
      playerId: s.player_id,
      zone: s.zone,
      made: s.made,
      x: s.x,
      y: s.y,
    })),
    [sessionShots]
  );

  const phase: GamePhase | undefined = isMultiplayer
    ? (session?.status === "playing" ? "playing" : "setup")
    : undefined;

  return (
    <GameProvider
      externalPlayers={isMultiplayer ? players : undefined}
      externalShots={isMultiplayer ? shots : undefined}
      externalPhase={phase}
    >
      <GameRouter />
    </GameProvider>
  );
};

const Index = () => (
  <MultiplayerProvider>
    <MultiplayerGameWrapper />
  </MultiplayerProvider>
);

export default Index;
