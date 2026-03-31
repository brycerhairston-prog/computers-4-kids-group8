import { GameProvider, useGame } from "@/context/GameContext";
import HeatMap from "@/components/HeatMap";
import DataTable from "@/components/DataTable";
import ShotTracker from "@/components/ShotTracker";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { motion } from "framer-motion";

const Dashboard = () => {
  const { resetGame, shots } = useGame();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏀</span>
            <div>
              <h1 className="text-lg font-display font-bold text-foreground leading-tight">
                Tabletop Basketball Analytics
              </h1>
              <p className="text-[10px] text-muted-foreground">
                Computers for Kids · Learn data science through sports
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground tabular-nums">{shots.length} shots</span>
            <Button
              size="sm"
              variant="outline"
              onClick={resetGame}
              className="gap-1 text-xs"
            >
              <RotateCcw className="w-3 h-3" /> New Game
            </Button>
          </div>
        </div>
      </header>

      {/* Main grid */}
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
            {/* Educational callout */}
            <div className="glass-card rounded-lg p-4 space-y-2">
              <h3 className="text-sm font-display font-bold text-primary">🧠 Data Science Tips</h3>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                <li>
                  <strong className="text-foreground">FG% (Field Goal Percentage)</strong> = Makes ÷ Attempts × 100. 
                  A higher FG% means more accurate shooting.
                </li>
                <li>
                  <strong className="text-foreground">Hot Zones</strong> show where a player shoots best. 
                  Teams use this data to decide where to take shots!
                </li>
                <li>
                  <strong className="text-foreground">Pattern Recognition:</strong> Look for clusters of green pins 
                  — those areas are strengths. Red clusters reveal areas to improve.
                </li>
                <li>
                  <strong className="text-foreground">Strategic Thinking:</strong> If a player has 80% FG% from Zone 1 
                  but only 10% from Zone 6, where should they shoot more?
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

const Index = () => (
  <GameProvider>
    <Dashboard />
  </GameProvider>
);

export default Index;
