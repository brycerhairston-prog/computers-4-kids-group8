import { useGame, ZONE_LABELS, ZONE_POINTS, INDIVIDUAL_SHOT_LIMIT, TEAM_SHOT_LIMIT } from "@/context/GameContext";
import { useMultiplayer } from "@/context/MultiplayerContext";
import { ZONE_PATHS, ZONE_LABEL_POS, COURT_VIEWBOX, courtLineColor, getZoneFromPoint } from "@/lib/courtGeometry";
import courtImage from "@/assets/court-layout.png";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Undo2, ChevronDown, ChevronRight, Lock } from "lucide-react";

const CourtBackground = () => (
  <image href={courtImage} x="0" y="0" width="400" height="500" preserveAspectRatio="none" />
);

const ShotTracker = () => {
  const {
    shots, addShot, removeShot, players, selectedPlayerId, selectPlayer,
    gameMode, teams, getPlayerShotCount, getTeamShotCount, getPlayerTeam, isGameOver,
  } = useGame();
  const mp = useMultiplayer();
  const courtRef = useRef<SVGSVGElement>(null);
  const [pendingPos, setPendingPos] = useState<{ x: number; y: number; zone: number } | null>(null);
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);

  const activePlayerId = selectedPlayerId || (players.length > 0 ? players[0].id : null);
  const activePlayer = players.find(p => p.id === activePlayerId);

  // Auto-expand the first team if none expanded
  const effectiveExpandedTeam = expandedTeam ?? (teams.length > 0 ? teams[0].id : null);

  // Check if current player/team can still shoot
  const canShoot = (() => {
    if (!activePlayerId || isGameOver) return false;
    if (gameMode === "individual") {
      return getPlayerShotCount(activePlayerId) < INDIVIDUAL_SHOT_LIMIT;
    } else {
      const team = getPlayerTeam(activePlayerId);
      if (!team) return false;
      return getTeamShotCount(team.id) < TEAM_SHOT_LIMIT;
    }
  })();

  // Shot count display
  const shotCountDisplay = (() => {
    if (!activePlayerId) return "";
    if (gameMode === "individual") {
      const count = getPlayerShotCount(activePlayerId);
      return `${count}/${INDIVIDUAL_SHOT_LIMIT} shots`;
    } else {
      const team = getPlayerTeam(activePlayerId);
      if (!team) return "";
      const count = getTeamShotCount(team.id);
      return `${team.name}: ${count}/${TEAM_SHOT_LIMIT} shots`;
    }
  })();

  const handleCourtClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!activePlayerId || !canShoot) return;
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
    };
    if (mp.isMultiplayer) {
      mp.addMultiplayerShot(shotData);
    } else {
      addShot(shotData);
    }
    setPendingPos(null);
  };

  const visibleShots = selectedPlayerId ? shots.filter(s => s.playerId === selectedPlayerId) : shots;
  const lastShot = shots.length > 0 ? shots[shots.length - 1] : null;

  return (
    <div className="glass-card rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-display font-bold text-foreground">📍 Shot Tracker</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground tabular-nums">{shotCountDisplay}</span>
          {lastShot && (
            <Button size="sm" variant="ghost" onClick={() => mp.isMultiplayer ? mp.removeMultiplayerShot(lastShot.id) : removeShot(lastShot.id)} className="gap-1 text-xs">
              <Undo2 className="w-3 h-3" /> Undo
            </Button>
          )}
        </div>
      </div>

      {!canShoot && !isGameOver && activePlayerId && (
        <p className="text-xs text-primary font-semibold text-center">
          {gameMode === "team"
            ? `${getPlayerTeam(activePlayerId)?.name ?? "Team"} has reached their shot limit! Select another team.`
            : `${activePlayer?.name} has reached their shot limit! Select another player.`}
        </p>
      )}

      {/* Player selector */}
      <div className="space-y-2">
        {gameMode === "team" ? (
          // Team mode: collapsible Team A / Team B sections
          teams.map(team => {
            const isExpanded = effectiveExpandedTeam === team.id;
            const teamShotCount = getTeamShotCount(team.id);
            const teamDone = teamShotCount >= TEAM_SHOT_LIMIT;
            const teamPlayers = players.filter(p => team.playerIds.includes(p.id));

            return (
              <div key={team.id} className={`rounded-lg border transition-colors ${
                isExpanded ? "border-primary/50 bg-primary/5" : "border-border"
              } ${teamDone ? "opacity-60" : ""}`}>
                <button
                  onClick={() => setExpandedTeam(isExpanded ? null : team.id)}
                  className="w-full flex items-center justify-between px-3 py-2 text-left"
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                    <span className="text-sm font-bold text-foreground">{team.name}</span>
                    {teamDone && <span className="text-[10px] text-primary font-semibold">✓ Done</span>}
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {teamShotCount}/{TEAM_SHOT_LIMIT} shots
                  </span>
                </button>
                {isExpanded && (
                  <div className="px-3 pb-2 flex gap-1 flex-wrap">
                    {teamPlayers.map(p => {
                      const playerShots = getPlayerShotCount(p.id);
                      return (
                        <Button key={p.id} size="sm"
                          variant={activePlayerId === p.id ? "default" : "outline"}
                          onClick={() => selectPlayer(p.id)}
                          className="text-xs h-7"
                          disabled={teamDone}>
                          {p.name} ({playerShots})
                        </Button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="flex gap-1 flex-wrap">
            {players.map(p => {
              const done = getPlayerShotCount(p.id) >= INDIVIDUAL_SHOT_LIMIT;
              return (
                <Button key={p.id} size="sm"
                  variant={activePlayerId === p.id ? "default" : "outline"}
                  onClick={() => selectPlayer(p.id)}
                  className={`text-xs h-7 ${done ? "opacity-50" : ""}`}
                  disabled={done}>
                  {p.name} ({getPlayerShotCount(p.id)}/{INDIVIDUAL_SHOT_LIMIT})
                </Button>
              );
            })}
          </div>
        )}
      </div>

      {/* Court */}
      <div className="relative">
        <svg ref={courtRef} viewBox={COURT_VIEWBOX}
          className={`w-full rounded-md ${canShoot ? "cursor-crosshair" : "cursor-not-allowed opacity-70"}`}
          style={{ background: "hsl(var(--court-bg))" }}
          onClick={handleCourtClick}>
          <CourtBackground />
          <AnimatePresence>
            {visibleShots.map(shot => (
              <motion.circle key={shot.id}
                cx={(shot.x / 100) * 400} cy={(shot.y / 100) * 500} r="6"
                fill={shot.made ? "hsl(var(--shot-made))" : "hsl(var(--shot-missed))"}
                stroke="white" strokeWidth="1.5"
                initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 0.85 }}
                exit={{ scale: 0, opacity: 0 }} transition={{ type: "spring", stiffness: 300 }} />
            ))}
          </AnimatePresence>
          {pendingPos && (
            <motion.circle
              cx={(pendingPos.x / 100) * 400} cy={(pendingPos.y / 100) * 500} r="9"
              fill="hsl(var(--primary))" stroke="white" strokeWidth="2"
              className="animate-pulse-glow" initial={{ scale: 0 }} animate={{ scale: 1 }} />
          )}
        </svg>

        <AnimatePresence>
          {pendingPos && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              <Button onClick={() => confirmShot(true)} className="bg-shot-made hover:bg-shot-made/80 text-primary-foreground font-bold shadow-lg">
                ✓ Made
              </Button>
              <Button onClick={() => confirmShot(false)} className="bg-shot-missed hover:bg-shot-missed/80 text-primary-foreground font-bold shadow-lg">
                ✗ Missed
              </Button>
              <Button variant="outline" onClick={() => setPendingPos(null)} className="text-xs">Cancel</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {activePlayer && pendingPos && (
        <p className="text-xs text-center text-muted-foreground">
          Placing shot for <span className="text-primary font-semibold">{activePlayer.name}</span> in{" "}
          <span className="font-medium">{ZONE_LABELS[pendingPos.zone]}</span> ({ZONE_POINTS[pendingPos.zone]}pt zone)
        </p>
      )}
    </div>
  );
};

export default ShotTracker;
