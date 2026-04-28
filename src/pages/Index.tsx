import { GameProvider, useGame, type Player, type Shot, type GamePhase, type GameMode, type Team, type TeamSelectionMode } from "@/context/GameContext";
import { MultiplayerProvider, useMultiplayer } from "@/context/MultiplayerContext";
import { lazy, Suspense } from "react";
const HeatMap = lazy(() => import("@/components/HeatMap"));
import DataTable from "@/components/DataTable";
import ShotTracker from "@/components/ShotTracker";
import GameSetup from "@/components/GameSetup";
import GameSummary from "@/components/GameSummary";
import Lobby from "@/components/Lobby";
import SmartCoachPanel from "@/components/SmartCoachPanel";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RotateCcw, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import SettingsPanel from "@/components/SettingsPanel";
import FeedbackDialog from "@/components/FeedbackDialog";
import { motion } from "framer-motion";
import c4kLogo from "@/assets/c4k-logo.png";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b-2 border-primary/30 bg-card/80 backdrop-blur-sm sticky top-0 z-10 shadow-[0_2px_12px_-4px_hsl(var(--primary)/0.2)]">
        <div className="container flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <img src={c4kLogo} alt="C4K" className="w-8 h-8" />
            <div>
              <h1 className="text-lg font-display font-bold text-foreground leading-tight">
                {t("game.appTitle")}
              </h1>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full inline-block ${gameMode === "team" ? "bg-blue-500" : "bg-orange-500"}`} />
                  {mp.isMultiplayer && mp.session ? `Game: ${mp.session.game_code} · ` : ""}
                  {mp.isMultiplayer ? `${mp.sessionPlayers.length} ${t("lobby.players").toLowerCase()}` : (gameMode === "individual" ? t("game.individualMode") : `${t("game.teamMode")} · ${teams.map(tm => tm.name).join(" vs ")}`)}
                  <span className="inline-flex items-center gap-1 ml-1 bg-primary/10 text-primary font-bold rounded-full px-2 py-0.5">🏀 {shots.length}</span>
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
              <span className="text-xs font-bold bg-primary text-primary-foreground rounded-full px-3 py-1 animate-pulse shadow-lg">{t("game.gameOver")}</span>
            )}
              <SettingsPanel />
              <FeedbackDialog />
              {mp.isMultiplayer ? (
                <>
                  {mp.isHost && (
                    <Button size="sm" variant="outline" onClick={mp.resetMultiplayerGame} className="gap-1 text-xs">
                      <RotateCcw className="w-3 h-3" aria-hidden="true" /> Reset
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={mp.leaveGame} className="gap-1 text-xs">
                    {t("common.leave")}
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="outline" onClick={resetGame} className="gap-1 text-xs">
                  <RotateCcw className="w-3 h-3" aria-hidden="true" /> {t("common.newGame")}
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
            <SmartCoachPanel />
            <Tabs defaultValue="tracker" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="tracker" className="flex-1">{t("game.shotTracker")}</TabsTrigger>
                <TabsTrigger value="heatmap" className="flex-1">{t("game.heatMap")}</TabsTrigger>
              </TabsList>
              <TabsContent value="tracker">
                <ShotTracker />
              </TabsContent>
              <TabsContent value="heatmap">
                <HeatMap />
              </TabsContent>
            </Tabs>
            <Collapsible defaultOpen className="glass-card rounded-lg p-4 space-y-2">
              <CollapsibleTrigger className="flex items-center justify-between w-full group">
                <h3 className="text-sm font-display font-bold text-primary">{t("game.howToUse")}</h3>
                <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform group-data-[state=closed]:rotate-[-90deg]" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <ul className="text-xs text-muted-foreground space-y-1.5 pt-1">
                  <li><strong className="text-foreground">Shot Tracker:</strong> Select your player, then tap a zone on the court to log a shot. Green pins = made, red pins = missed. Your shot count updates in the progress bar above.</li>
                  <li><strong className="text-foreground">Heat Map:</strong> Switch to the Heat Map tab to see color-coded zones. Colors range from blue (cold / low accuracy) to green (hot / high accuracy). Each zone shows makes/attempts and FG%.</li>
                  <li><strong className="text-foreground">Stats Table:</strong> The table on the right tracks each player's attempts, makes, FG%, and total points in real time. Tap a player name to filter the heat map to just their shots.</li>
                  <li><strong className="text-foreground">Settings (⚙️):</strong> Adjust dark/light mode, colorblind mode, and text size from the gear icon in the header.</li>
                </ul>
              </CollapsibleContent>
            </Collapsible>
          </div>
          <div className="space-y-4">
            <DataTable />
            <Collapsible defaultOpen className="glass-card rounded-lg p-4 space-y-2">
              <CollapsibleTrigger className="flex items-center justify-between w-full group">
                <h3 className="text-sm font-display font-bold text-primary">{t("game.dataTips")}</h3>
                <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform group-data-[state=closed]:rotate-[-90deg]" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <ul className="text-xs text-muted-foreground space-y-1.5 pt-1">
                  <li><strong className="text-foreground">FG% (Field Goal Percentage)</strong> = Makes ÷ Attempts × 100.</li>
                  <li><strong className="text-foreground">Hot Zones</strong> show where a player shoots best.</li>
                  <li><strong className="text-foreground">Pattern Recognition:</strong> Look for clusters of green pins.</li>
                  <li className="pt-2"><strong className="text-primary">🎯 Strategy & Decision-Making</strong></li>
                  <li>• <strong className="text-foreground">Take Smart Shots:</strong> Focus on zones where your FG% is highest.</li>
                  <li>• <strong className="text-foreground">Risk vs Reward:</strong> 3-point shots are worth more, but often have lower success rates.</li>
                  <li>• <strong className="text-foreground">Adjust in Real Time:</strong> If you're missing from a zone, try switching areas.</li>
                  <li className="pt-2"><strong className="text-primary">🔍 Pattern Recognition</strong></li>
                  <li>• <strong className="text-foreground">Hot Streaks vs Cold Streaks:</strong> Look for changes in performance over time.</li>
                  <li>• <strong className="text-foreground">Shot Clustering:</strong> Groups of makes in one area suggest a strong zone.</li>
                  <li>• <strong className="text-foreground">Avoid Cold Zones:</strong> Repeated misses in a zone may indicate a weakness.</li>
                  <li className="pt-2"><strong className="text-primary">🧪 Experimental Thinking</strong></li>
                  <li>• <strong className="text-foreground">Test Hypotheses:</strong> Try focusing on one zone and see if your performance improves.</li>
                  <li>• <strong className="text-foreground">Change Variables:</strong> Move your shot location and observe how results change.</li>
                  <li>• <strong className="text-foreground">Learn from Data:</strong> Use results to adjust your strategy, not guess.</li>
                </ul>
              </CollapsibleContent>
            </Collapsible>
            <Collapsible defaultOpen className="glass-card rounded-lg p-4 space-y-2">
              <CollapsibleTrigger className="flex items-center justify-between w-full group">
                <h3 className="text-sm font-display font-bold text-accent">{t("game.gameRules")}</h3>
                <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform group-data-[state=closed]:rotate-[-90deg]" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <ul className="text-xs text-muted-foreground space-y-1.5 pt-1">
                  <li><strong className="text-foreground">Individual Mode:</strong> 20 shots per player. Can't shoot the same zone twice in a row.</li>
                  <li><strong className="text-foreground">Team Mode:</strong> 30 shots per team. Teams can block 2 zones on opponents' boards.</li>
                  <li><strong className="text-foreground">Scoring:</strong> Zone 1 = 1pt · Zones 2–3 = 2pts · Zones 4–6 = 3pts.</li>
                  <li><strong className="text-foreground">Practice Round:</strong> 5 bonus shots, any zone allowed.</li>
                </ul>
              </CollapsibleContent>
            </Collapsible>
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

    // If fully configured teams are passed in (with blockedZones/shotAllocations), use them directly
    if (manualTeams && manualTeams.length > 0) {
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
