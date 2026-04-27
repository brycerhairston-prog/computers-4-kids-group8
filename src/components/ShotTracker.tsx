import {
  useGame,
  ZONE_POINTS,
  INDIVIDUAL_SHOT_LIMIT,
  TEAM_SHOT_LIMIT,
  PRACTICE_SHOT_LIMIT,
} from "@/context/GameContext";
import { useMultiplayer } from "@/context/MultiplayerContext";
import courtImage from "@/assets/court-layout.png";
import { useState, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Undo2, Lock, Ban } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

const COURT_VIEWBOX = "0 0 400 500";

// Calculation logic for mapping clicks to zones
const getZoneFromPoint = (xPct: number, yPct: number): number => {
  const x = (xPct / 100) * 400;
  const y = (yPct / 100) * 500;

  // Zone 1: The Paint
  if (x >= 132 && x <= 268 && y <= 200) return 1;

  // Calculate distance from hoop (approx x: 200, y: 45) to determine 3pt line
  const dist = Math.sqrt(Math.pow(x - 200, 2) + Math.pow(y - 45, 2));

  if (dist < 240) {
    return x < 200 ? 2 : 3; // Mid-range
  } else {
    if (x < 150) return 4; // Left Wing/Corner 3
    if (x > 250) return 6; // Right Wing/Corner 3
    return 5; // Top 3
  }
};

const ShotTracker = () => {
  const { t } = useTranslation();
  const {
    addShot,
    removeShot,
    players,
    selectedPlayerId,
    selectPlayer,
    gameMode,
    teams,
    getPlayerShotCount,
    getTeamShotCount,
    getPlayerTeam,
    isGameOver,
    individualShots,
    teamShots,
    practiceShots,
    isPlayerInPractice,
    getPlayerPracticeShotCount,
    getPlayerShotLimit,
  } = useGame();
  const mp = useMultiplayer();
  const courtRef = useRef<SVGSVGElement>(null);
  const [pendingPos, setPendingPos] = useState<{ x: number; y: number; zone: number } | null>(null);

  const activePlayerId = selectedPlayerId || (players.length > 0 ? players[0].id : null);
  const activePlayer = players.find((p) => p.id === activePlayerId);
  const isLocalPlayer = activePlayerId ? !mp.isMultiplayer || mp.localPlayerIds.includes(activePlayerId) : false;
  const inPractice = activePlayerId ? isPlayerInPractice(activePlayerId) : false;

  const handleCourtClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!activePlayerId || isGameOver || !isLocalPlayer) return;
    const svg = courtRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    const zone = getZoneFromPoint(xPct, yPct);

    setPendingPos({ x: xPct, y: yPct, zone });
  };

  const confirmShot = (made: boolean) => {
    if (!pendingPos || !activePlayerId) return;
    const shotData = {
      playerId: activePlayerId,
      zone: pendingPos.zone,
      made,
      x: pendingPos.x,
      y: pendingPos.y,
      mode: inPractice ? "practice" : gameMode,
    };
    mp.isMultiplayer ? mp.addMultiplayerShot(shotData) : addShot(shotData);
    setPendingPos(null);
  };

  return (
    <div className="glass-card rounded-lg p-4 space-y-3 border-t-2 border-primary/30">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-display font-bold text-foreground">
          <span className="border-b-2 border-primary pb-0.5">{t("shotTracker.title")}</span>
        </h2>
        {activePlayerId && (
          <Button size="sm" variant="ghost" onClick={() => removeShot("last")} className="gap-1 text-xs">
            <Undo2 className="w-3 h-3" /> {t("shotTracker.undo")}
          </Button>
        )}
      </div>

      <div className="relative">
        <svg
          ref={courtRef}
          viewBox={COURT_VIEWBOX}
          className={`w-full rounded-md ${isLocalPlayer ? "cursor-crosshair" : "cursor-not-allowed"}`}
          style={{ background: "#f8fafc" }}
          onClick={handleCourtClick}
        >
          <image href={courtImage} x="0" y="0" width="400" height="500" preserveAspectRatio="none" />

          <AnimatePresence>
            {(gameMode === "team" ? teamShots : individualShots).map((shot) => (
              <motion.circle
                key={shot.id}
                cx={(shot.x / 100) * 400}
                cy={(shot.y / 100) * 500}
                r="6"
                fill={shot.made ? "#22c55e" : "#ef4444"}
                stroke="white"
                strokeWidth="1.5"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              />
            ))}
          </AnimatePresence>

          {pendingPos && (
            <motion.circle
              cx={(pendingPos.x / 100) * 400}
              cy={(pendingPos.y / 100) * 500}
              r="8"
              fill="hsl(var(--primary))"
              stroke="white"
              strokeWidth="2"
              className="animate-pulse"
            />
          )}
        </svg>

        {pendingPos && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            <Button onClick={() => confirmShot(true)} className="bg-green-600 hover:bg-green-700 text-white">
              Made
            </Button>
            <Button onClick={() => confirmShot(false)} className="bg-red-600 hover:bg-red-700 text-white">
              Missed
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShotTracker;
