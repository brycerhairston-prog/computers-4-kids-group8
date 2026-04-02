import { GameProvider, useGame } from "@/context/GameContext";
import HeatMap from "@/components/HeatMap";
import DataTable from "@/components/DataTable";
import ShotTracker from "@/components/ShotTracker";
import GameSetup from "@/components/GameSetup";
import GameSummary from "@/components/GameSummary";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect } from "react";

const PlayingDashboard = () => {
  const { resetGame, shots, gameMode, teams, players, isGameOver, gamePhase } = useGame();

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
                {gameMode === "individual" ? "Individual Mode" : `Team Mode · ${teams.map(t => t.name).join(" vs ")}`}
                {" · "}{shots.length} shots
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isGameOver && (
              <span className="text-xs font-bold text-primary animate-pulse">Game Over!</span>
            )}
            <Button size="sm" variant="outline" onClick={resetGame} className="gap-1 text-xs">
              <RotateCcw className="w-3 h-3" /> New Game
            </Button>
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
            <ShotTracker />
            <HeatMap />
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

  if (gamePhase === "setup") return <GameSetup />;
  if (gamePhase === "playing" && isGameOver) return <GameSummary />;
  if (gamePhase === "playing") return <PlayingDashboard />;
  return <GameSetup />;
};

const Index = () => (
  <GameProvider>
    <GameRouter />
  </GameProvider>
);

export default Index;
