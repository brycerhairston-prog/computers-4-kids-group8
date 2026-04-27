import {
  useGame,
  ZONE_POINTS,
  INDIVIDUAL_SHOT_LIMIT,
  TEAM_SHOT_LIMIT,
  PRACTICE_SHOT_LIMIT,
} from "@/context/GameContext";
import { useMultiplayer } from "@/context/MultiplayerContext";
import { ZONE_PATHS, ZONE_LABEL_POS, COURT_VIEWBOX, getZoneFromPoint } from "@/lib/courtGeometry";
import courtImage from "@/assets/court-layout.png";
import { useState, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

const ShotTracker = () => {
  const { t } = useTranslation();
  const {
    addShot,
    players,
    selectedPlayerId,
    gameMode,
    individualShots,
    teamShots,
    practiceShots,
    isPlayerInPractice,
    getPlayerShotCount,
    isGameOver,
  } = useGame();
  const mp = useMultiplayer();
  const courtRef = useRef<SVGSVGElement>(null);
  const [pendingPos, setPendingPos] = useState<{ x: number; y: number; zone: number } | null>(null);

  const handleCourtClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isGameOver || !courtRef.current) return;
    const rect = courtRef.current.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;

    setPendingPos({ x: xPct, y: yPct, zone: getZoneFromPoint(xPct, yPct) });
  };

  const confirmShot = (made: boolean) => {
    if (!pendingPos || !selectedPlayerId) return;
    const shotData = {
      playerId: selectedPlayerId,
      zone: pendingPos.zone,
      made,
      x: pendingPos.x,
      y: pendingPos.y,
      mode: isPlayerInPractice(selectedPlayerId) ? "practice" : gameMode,
    };
    mp.isMultiplayer ? mp.addMultiplayerShot(shotData) : addShot(shotData);
    setPendingPos(null);
  };

  return (
    <div className="glass-card rounded-lg p-4 space-y-3">
      <svg ref={courtRef} viewBox={COURT_VIEWBOX} className="w-full rounded-md" onClick={handleCourtClick}>
        <image href={courtImage} x="0" y="0" width="400" height="500" preserveAspectRatio="none" />

        {/* Markers are positioned relative to the 400x500 grid */}
        {individualShots.concat(teamShots).map((shot) => (
          <circle
            key={shot.id}
            cx={(shot.x / 100) * 400}
            cy={(shot.y / 100) * 500}
            r="6"
            fill={shot.made ? "#22c55e" : "#ef4444"}
            stroke="white"
          />
        ))}

        {pendingPos && (
          <circle cx={(pendingPos.x / 100) * 400} cy={(pendingPos.y / 100) * 500} r="9" fill="#3b82f6" stroke="white" />
        )}
      </svg>
      {pendingPos && (
        <div className="flex gap-2 justify-center">
          <Button onClick={() => confirmShot(true)} className="bg-green-500">
            Made
          </Button>
          <Button onClick={() => confirmShot(false)} className="bg-red-500">
            Missed
          </Button>
        </div>
      )}
    </div>
  );
};

export default ShotTracker;
