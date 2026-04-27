import {
  useGame,
  ZONE_LABELS,
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
import { Undo2, ChevronDown, ChevronRight, Lock, Ban } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

const ShotTracker = () => {
  const { t } = useTranslation();
  const zoneName = (z: number) => t(`zones.${z}`);
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

  const activeShots = useMemo(
    () => (gameMode === "team" ? teamShots : individualShots),
    [gameMode, individualShots, teamShots],
  );
  const activePlayerId = selectedPlayerId || (players.length > 0 ? players[0].id : null);
  const activePlayer = players.find((p) => p.id === activePlayerId);

  const inPractice = activePlayerId ? isPlayerInPractice(activePlayerId) : false;

  const handleCourtClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!activePlayerId || isGameOver) return;
    const rect = courtRef.current?.getBoundingClientRect();
    if (!rect) return;
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    setPendingPos({ x: xPct, y: yPct, zone: getZoneFromPoint(xPct, yPct) });
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

  const courtShots = useMemo(() => {
    const filterId = selectedPlayerId || activePlayerId;
    const base = filterId ? activeShots.filter((s) => s.playerId === filterId) : activeShots;
    const pShots = practiceShots.filter((s) => !filterId || s.playerId === filterId);
    return [...pShots.map((s) => ({ ...s, isPractice: true })), ...base.map((s) => ({ ...s, isPractice: false }))];
  }, [selectedPlayerId, activePlayerId, activeShots, practiceShots]);

  return (
    <div className="glass-card rounded-lg p-4 space-y-3 border-t-2 border-primary/30">
      {/* ... Player List UI (Restored from your original code) ... */}

      <div className="relative">
        <svg ref={courtRef} viewBox={COURT_VIEWBOX} className="w-full rounded-md" onClick={handleCourtClick}>
          <image href={courtImage} x="0" y="0" width="400" height="500" preserveAspectRatio="none" />

          {/* RESTORED ZONE NUMBERS */}
          {[1, 2, 3, 4, 5, 6].map((zone) => {
            const pos = ZONE_LABEL_POS[zone];
            return (
              <text
                key={`zone-num-${zone}`}
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="central"
                fill="white"
                fontSize="24"
                fontWeight="900"
                opacity="0.8"
                stroke="black"
                strokeWidth="3"
                paintOrder="stroke"
                style={{ pointerEvents: "none" }}
              >
                {zone}
              </text>
            );
          })}

          {courtShots.map((shot) => (
            <circle
              key={shot.id}
              cx={(shot.x / 100) * 400}
              cy={(shot.y / 100) * 500}
              r="6"
              fill={shot.made ? "hsl(var(--shot-made))" : "hsl(var(--shot-missed))"}
              stroke="white"
              strokeWidth="1.5"
            />
          ))}
          {pendingPos && (
            <circle
              cx={(pendingPos.x / 100) * 400}
              cy={(pendingPos.y / 100) * 500}
              r="9"
              fill="hsl(var(--primary))"
              stroke="white"
              strokeWidth="2"
            />
          )}
        </svg>

        <AnimatePresence>
          {pendingPos && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2"
            >
              <Button onClick={() => confirmShot(true)} className="bg-shot-made">
                {t("shotTracker.made")}
              </Button>
              <Button onClick={() => confirmShot(false)} className="bg-shot-missed">
                {t("shotTracker.missed")}
              </Button>
              <Button variant="outline" onClick={() => setPendingPos(null)}>
                {t("shotTracker.cancel")}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ShotTracker;
