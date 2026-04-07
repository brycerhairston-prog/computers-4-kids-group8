import { GameProvider, useGame, type Player, type Shot, type GamePhase, type GameMode, type Team, type TeamSelectionMode } from "@/context/GameContext";
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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

let idCounter = 0;
const genId = () => `team-${++idCounter}-${Date.now()}`;

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const PlayingDashboard = () => {
  const { resetGame, shots, gameMode, teams, players, isGameOver, gamePhase } = useGame();
  const mp = useMultiplayer();

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
  const game = useGame();
  const mp = useMultiplayer();
  const hasFinishedRef = useRef(false);

  // Host auto-finishes individual mode when all players hit 20 shots
  useEffect(() => {
    if (
      mp.isMultiplayer &&
      mp.isHost &&
      game.isGameOver &&
      game.gameMode === "individual" &&
      mp.session?.status === "playing" &&
      !hasFinishedRef.current
    ) {
      hasFinishedRef.current = true;
      mp.finishIndividualMode();
    }
  }, [mp.isMultiplayer, mp.isHost, game.isGameOver, game.gameMode, mp.session?.status]);

  // Reset the ref when going back to playing
  useEffect(() => {
    if (mp.session?.status === "playing") {
      hasFinishedRef.current = false;
    }
  }, [mp.session?.status]);

  const handleStartTeamMode = useCallback(async (selectionMode: TeamSelectionMode, teamCount: number, manualTeams?: Team[]) => {
    let computedTeams: Team[];
    const TEAM_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    if (selectionMode === "manual" && manualTeams) {
      computedTeams = manualTeams;
    } else if (selectionMode === "fair") {
      // Snake draft: sort by points desc, then alternate direction across teams
      const sorted = [...game.players].sort((a, b) => {
        const aStats = game.getPlayerStats(a.id);
        const bStats = game.getPlayerStats(b.id);
        return bStats.totalPoints - aStats.totalPoints;
      });
      const teamBuckets: string[][] = Array.from({ length: teamCount }, () => []);
      let direction = 1;
      let idx = 0;
      for (const p of sorted) {
        teamBuckets[idx].push(p.id);
        if ((direction === 1 && idx === teamCount - 1) || (direction === -1 && idx === 0)) {
          direction *= -1;
        } else {
          idx += direction;
        }
      }
      computedTeams = teamBuckets.map((ids, i) => ({
        id: `team-${i}-${Date.now()}`,
        name: `Team ${TEAM_LETTERS[i]}`,
        playerIds: ids,
      }));
    } else {
      // Random: shuffle then round-robin
      const shuffled = shuffleArray(game.players);
      const teamBuckets: string[][] = Array.from({ length: teamCount }, () => []);
      shuffled.forEach((p, i) => {
        teamBuckets[i % teamCount].push(p.id);
      });
      computedTeams = teamBuckets.map((ids, i) => ({
        id: `team-${i}-${Date.now()}`,
        name: `Team ${TEAM_LETTERS[i]}`,
        playerIds: ids,
      }));
    }

    if (mp.isMultiplayer && mp.session) {
      await mp.startTeamMode(computedTeams);
    } else {
      game.startGame({ mode: "team", teams: computedTeams });
    }
  }, [game, mp]);

  // Determine what to show
  const sessionStatus = mp.session?.status;

  if (!mp.isMultiplayer) return <Lobby />;
  if (sessionStatus === "waiting") return <Lobby />;

  // Individual done — show summary (all devices)
  if (sessionStatus === "individual_done") {
    return (
      <GameSummary
        onStartTeamMode={mp.isHost ? handleStartTeamMode : undefined}
      />
    );
  }

  // Team playing — show playing dashboard
  if (sessionStatus === "team_playing") {
    // If team game is over, show summary
    if (game.isGameOver) {
      return <GameSummary />;
    }
    return <PlayingDashboard />;
  }

  // Playing (individual mode)
  if (sessionStatus === "playing") {
    // Local isGameOver for individual — host will trigger finishIndividualMode
    if (game.isGameOver) {
      return (
        <GameSummary
          onStartTeamMode={mp.isHost ? handleStartTeamMode : undefined}
        />
      );
    }
    return <PlayingDashboard />;
  }

  return <Lobby />;
};

const MultiplayerGameWrapper = () => {
  const { isMultiplayer, session, sessionPlayers, sessionShots, teamAssignments } = useMultiplayer();

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
      mode: (s as any).mode || "individual",
    })),
    [sessionShots]
  );

  const phase: GamePhase | undefined = isMultiplayer
    ? (() => {
        const status = session?.status;
        if (status === "playing" || status === "team_playing") return "playing";
        if (status === "individual_done") return "summary";
        return "setup";
      })()
    : undefined;

  const externalGameMode: GameMode | undefined = isMultiplayer
    ? (session?.game_mode === "team" ? "team" : "individual")
    : undefined;

  return (
    <GameProvider
      externalPlayers={isMultiplayer ? players : undefined}
      externalShots={isMultiplayer ? shots : undefined}
      externalPhase={phase}
      externalTeams={isMultiplayer ? (teamAssignments ?? undefined) : undefined}
      externalGameMode={externalGameMode}
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
