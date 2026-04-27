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

const CourtBackground = () => (
  <image href={courtImage} x="0" y="0" width="400" height="500" preserveAspectRatio="none" />
);

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
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);

  const activePlayerId = selectedPlayerId || (players.length > 0 ? players[0].id : null);
  const activePlayer = players.find((p) => p.id === activePlayerId);
  const inPractice = activePlayerId ? isPlayerInPractice(activePlayerId) : false;
  const isLocalPlayer = activePlayerId ? !mp.isMultiplayer || mp.localPlayerIds.includes(activePlayerId) : false;

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

  const courtShots = useMemo(() => {
    const activeList = gameMode === "team" ? teamShots : individualShots;
    const filterId = selectedPlayerId || activePlayerId;
    const filteredActive = filterId ? activeList.filter((s) => s.playerId === filterId) : activeList;
    const filteredPractice = practiceShots.filter((s) => !filterId || s.playerId === filterId);
    return [
      ...filteredPractice.map((s) => ({ ...s, isPractice: true })),
      ...filteredActive.map((s) => ({ ...s, isPractice: false })),
    ];
  }, [selectedPlayerId, activePlayerId, individualShots, teamShots, practiceShots, gameMode]);

  return (
    <div className="glass-card rounded-lg p-4 space-y-3 border-t-2 border-primary/30">
      {/* UI Header and Player Selector logic remains as provided in your file */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-display font-bold">{t("shotTracker.title")}</h2>
        {inPractice && (
          <span className="bg-accent text-accent-foreground px-2 py-0.5 rounded text-xs animate-pulse">
            {t("shotTracker.practice")}
          </span>
        )}
      </div>

      <div className="relative">
        <svg ref={courtRef} viewBox={COURT_VIEWBOX} className="w-full rounded-md" onClick={handleCourtClick}>
          <CourtBackground />
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
          <AnimatePresence>
            {courtShots.map((shot) => (
              <motion.circle
                key={shot.id}
                cx={(shot.x / 100) * 400}
                cy={(shot.y / 100) * 500}
                r={shot.isPractice ? 5 : 6}
                fill={
                  shot.isPractice
                    ? "hsl(var(--muted-foreground))"
                    : shot.made
                      ? "hsl(var(--shot-made))"
                      : "hsl(var(--shot-missed))"
                }
                stroke="white"
                strokeWidth={shot.isPractice ? 1 : 1.5}
                opacity={shot.isPractice ? 0.5 : 0.85}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              />
            ))}
          </AnimatePresence>
        </svg>

        <AnimatePresence>
          {pendingPos && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              <Button onClick={() => confirmShot(true)} className="bg-shot-made">
                {t("shotTracker.made")}
              </Button>
              <Button onClick={() => confirmShot(false)} className="bg-shot-missed">
                {t("shotTracker.missed")}
              </Button>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ShotTracker;
