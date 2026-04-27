import { useGame, ZONE_LABELS, ZONE_POINTS, INDIVIDUAL_SHOT_LIMIT, TEAM_SHOT_LIMIT, PRACTICE_SHOT_LIMIT } from "@/context/GameContext";
import { useMultiplayer } from "@/context/MultiplayerContext";
import { ZONE_PATHS, ZONE_LABEL_POS, COURT_VIEWBOX, getZoneFromPoint } from "@/lib/courtGeometry";
import courtImage from "@/assets/court-layout.png";
import { useState, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Undo2, ChevronDown, ChevronRight, Lock, Ban } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { expectedFgForZone } from "@/lib/smartCoach";

const CourtBackground = () => (
  <image href={courtImage} x="0" y="0" width="400" height="500" preserveAspectRatio="none" />
);

const ShotTracker = () => {
  const { t } = useTranslation();
  const zoneName = (z: number) => t(`zones.${z}`);
  const {
    shots, addShot, removeShot, players, selectedPlayerId, selectPlayer,
    gameMode, teams, getPlayerShotCount, getTeamShotCount, getPlayerTeam, isGameOver,
    individualShots, teamShots, practiceShots,
    isPlayerInPractice, getPlayerPracticeShotCount, getPlayerShotLimit,
    isZoneBlockedForPlayer,
  } = useGame();
  const mp = useMultiplayer();
  const courtRef = useRef<SVGSVGElement>(null);
  const [pendingPos, setPendingPos] = useState<{ x: number; y: number; zone: number } | null>(null);
  const [hoveredZone, setHoveredZone] = useState<number | null>(null);
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);

  // Active shots for current mode (for display on court)
  const activeShots = useMemo(() => {
    if (gameMode === "team") return teamShots;
    return individualShots;
  }, [gameMode, individualShots, teamShots]);

  const activePlayerId = selectedPlayerId || (players.length > 0 ? players[0].id : null);
  const activePlayer = players.find(p => p.id === activePlayerId);

  const effectiveExpandedTeam = expandedTeam ?? (teams.length > 0 ? teams[0].id : null);

  // Ownership check
  const isLocalPlayer = activePlayerId
    ? !mp.isMultiplayer || mp.localPlayerIds.includes(activePlayerId)
    : false;

  // Practice mode check
  const inPractice = activePlayerId ? isPlayerInPractice(activePlayerId) : false;
  const practiceCount = activePlayerId ? getPlayerPracticeShotCount(activePlayerId) : 0;

  // Same-zone restriction: only in individual mode AND not in practice
  const lockedZone = useMemo(() => {
    if (gameMode !== "individual" || !activePlayerId || inPractice) return null;
    const playerIndividualShots = individualShots.filter(s => s.playerId === activePlayerId);
    const lastShot = playerIndividualShots.at(-1);
    return lastShot ? lastShot.zone : null;
  }, [gameMode, activePlayerId, individualShots, inPractice]);

  // Blocked zones for current player in team mode
  const blockedZones = useMemo(() => {
    if (gameMode !== "team" || !activePlayerId) return [];
    const team = teams.find(t => t.playerIds.includes(activePlayerId));
    return (team?.blockedZones || []).map(Number);
  }, [gameMode, activePlayerId, teams]);

  // Check if current player/team can still shoot
  const canShoot = (() => {
    if (!activePlayerId || isGameOver || !isLocalPlayer) return false;
    if (inPractice) return true; // always can shoot during practice
    if (gameMode === "individual") {
      return getPlayerShotCount(activePlayerId) < INDIVIDUAL_SHOT_LIMIT;
    } else {
      const team = getPlayerTeam(activePlayerId);
      if (!team) return false;
      const teamDone = getTeamShotCount(team.id) >= TEAM_SHOT_LIMIT;
      if (teamDone) return false;
      // Per-player limit in team mode
      const playerLimit = getPlayerShotLimit(activePlayerId);
      const playerCount = getPlayerShotCount(activePlayerId);
      return playerCount < playerLimit;
    }
  })();

  // Shot count display
  const shotCountDisplay = (() => {
    if (!activePlayerId) return "";
    if (inPractice) return t("shotTracker.practiceCount", { count: practiceCount, limit: PRACTICE_SHOT_LIMIT });
    if (gameMode === "individual") {
      const count = getPlayerShotCount(activePlayerId);
      return t("shotTracker.shotsCount", { count, limit: INDIVIDUAL_SHOT_LIMIT });
    } else {
      const team = getPlayerTeam(activePlayerId);
      if (!team) return "";
      const teamCount = getTeamShotCount(team.id);
      const playerCount = getPlayerShotCount(activePlayerId);
      const playerLimit = getPlayerShotLimit(activePlayerId);
      return t("shotTracker.teamPlayerCount", { team: team.name, teamCount, teamLimit: TEAM_SHOT_LIMIT, player: activePlayer?.name, playerCount, playerLimit });
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

    // Same-zone restriction (individual, non-practice)
    if (lockedZone !== null && zone === lockedZone) {
      toast.error(t("shotTracker.lockedZoneToast", { zone: zoneName(zone) }));
      return;
    }

    // Blocked zone (team mode)
    if (blockedZones.includes(zone)) {
      toast.error(t("shotTracker.blockedZoneToast", { zone: zoneName(zone) }));
      return;
    }

    setPendingPos({ x: xPct, y: yPct, zone });
  };

  const confirmShot = (made: boolean) => {
    if (!pendingPos || !activePlayerId) return;
    const shotMode = inPractice ? "practice" : gameMode;
    const shotData = {
      playerId: activePlayerId,
      zone: pendingPos.zone,
      made,
      x: pendingPos.x,
      y: pendingPos.y,
      mode: shotMode,
    };
    if (mp.isMultiplayer) {
      mp.addMultiplayerShot(shotData);
    } else {
      addShot(shotData);
    }
    setPendingPos(null);

    // Toast when practice ends
    if (inPractice && practiceCount + 1 >= PRACTICE_SHOT_LIMIT) {
      toast.success(t("shotTracker.practiceComplete", { name: activePlayer?.name }));
    }
  };

  // Show practice shots with different styling, plus active shots
  const courtShots = useMemo(() => {
    const filterId = selectedPlayerId || activePlayerId;
    const base = filterId ? activeShots.filter(s => s.playerId === filterId) : activeShots;
    if (gameMode === "individual" && activePlayerId) {
      const pShots = practiceShots.filter(s => !filterId || s.playerId === filterId);
      return [...pShots.map(s => ({ ...s, isPractice: true })), ...base.map(s => ({ ...s, isPractice: false }))];
    }
    return base.map(s => ({ ...s, isPractice: false }));
  }, [selectedPlayerId, activePlayerId, activeShots, gameMode, practiceShots]);

  const lastShot = useMemo(() => {
    // For undo: consider practice + active shots
    const allCurrentShots = [...practiceShots, ...activeShots];
    return allCurrentShots.length > 0 ? allCurrentShots[allCurrentShots.length - 1] : null;
  }, [practiceShots, activeShots]);

  return (
    <div className="glass-card rounded-lg p-4 space-y-3 border-t-2 border-primary/30">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-display font-bold text-foreground">
          <span className="border-b-2 border-primary pb-0.5">{t("shotTracker.title")}</span>
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground tabular-nums">{shotCountDisplay}</span>
          {inPractice && (
            <span className="text-xs font-semibold text-accent-foreground bg-accent rounded-full px-2 py-0.5 border border-accent-foreground/20 animate-pulse">{t("shotTracker.practice")}</span>
          )}
          {!isLocalPlayer && mp.isMultiplayer && activePlayerId && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Lock className="w-3 h-3" aria-hidden="true" /> {t("shotTracker.viewOnly")}
            </span>
          )}
          {lastShot && isLocalPlayer && (
            <Button size="sm" variant="ghost" onClick={() => mp.isMultiplayer ? mp.removeMultiplayerShot(lastShot.id) : removeShot(lastShot.id)} className="gap-1 text-xs">
              <Undo2 className="w-3 h-3" aria-hidden="true" /> {t("shotTracker.undo")}
            </Button>
          )}
        </div>
      </div>

      {!canShoot && !isGameOver && activePlayerId && !inPractice && (
        <p className="text-xs text-primary font-semibold text-center">
          {gameMode === "team"
            ? (() => {
                const playerLimit = getPlayerShotLimit(activePlayerId);
                const playerCount = getPlayerShotCount(activePlayerId);
                if (playerCount >= playerLimit) {
                  return t("shotTracker.playerLimitReached", { name: activePlayer?.name, limit: playerLimit });
                }
                return t("shotTracker.teamLimitReached", { team: getPlayerTeam(activePlayerId)?.name ?? "Team" });
              })()
            : t("shotTracker.individualLimitReached", { name: activePlayer?.name })}
        </p>
      )}

      {lockedZone !== null && canShoot && (
        <div className="text-xs text-center bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2">
          {t("shotTracker.lockedZone", { zone: zoneName(lockedZone) })}
        </div>
      )}

      {blockedZones.length > 0 && gameMode === "team" && (
        <div className="text-xs text-center bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">
          {t("shotTracker.blockedZones", { zones: blockedZones.map(z => zoneName(z)).join(", ") })}
        </div>
      )}

      {/* Player selector */}
      <div className="space-y-2">
        {gameMode === "team" ? (
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
                    {teamDone && <span className="text-[10px] text-primary font-semibold">{t("shotTracker.done")}</span>}
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {t("shotTracker.teamShotsLabel", { count: teamShotCount, limit: TEAM_SHOT_LIMIT })}
                  </span>
                </button>
                {isExpanded && (
                <div className="px-3 pb-2 space-y-2">
                    <div className="flex gap-1 flex-wrap">
                      {teamPlayers.map(p => {
                        const playerShots = getPlayerShotCount(p.id);
                        const playerLimit = getPlayerShotLimit(p.id);
                        const playerDone = playerShots >= playerLimit;
                        const isLocal = !mp.isMultiplayer || mp.localPlayerIds.includes(p.id);
                        return (
                          <Button key={p.id} size="sm"
                            variant={activePlayerId === p.id ? "default" : "outline"}
                            onClick={() => selectPlayer(p.id)}
                            className={`text-xs h-7 gap-1 ${!isLocal ? "opacity-70" : ""}`}
                            disabled={(teamDone || playerDone) && isLocal}>
                            {!isLocal && <Lock className="w-2.5 h-2.5" />}
                            {p.name} ({playerShots}/{playerLimit})
                          </Button>
                        );
                      })}
                    </div>
                    {team.blockedZones && team.blockedZones.length > 0 && (
                      <p className="text-[11px] text-destructive flex items-center gap-1">
                        <Ban className="w-3 h-3" />
                        {t("shotTracker.blockedTeam", { zones: team.blockedZones.map(z => zoneName(z)).join(", ") })}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="flex gap-1.5 flex-wrap">
            {players.map(p => {
              const pInPractice = isPlayerInPractice(p.id);
              const done = !pInPractice && getPlayerShotCount(p.id) >= INDIVIDUAL_SHOT_LIMIT;
              const isLocal = !mp.isMultiplayer || mp.localPlayerIds.includes(p.id);
              const pCount = pInPractice ? getPlayerPracticeShotCount(p.id) : getPlayerShotCount(p.id);
              const pLimit = pInPractice ? PRACTICE_SHOT_LIMIT : INDIVIDUAL_SHOT_LIMIT;
              const pctDone = (pCount / pLimit) * 100;
              const progressColor = pctDone >= 80 ? "bg-red-500" : pctDone >= 50 ? "bg-orange-500" : "bg-green-500";
              return (
                <Button key={p.id} size="sm"
                  variant={activePlayerId === p.id ? "default" : "outline"}
                  onClick={() => selectPlayer(p.id)}
                  className={`text-xs h-auto py-1 px-2 gap-1.5 flex-col items-start relative overflow-hidden ${done && isLocal ? "opacity-50" : ""} ${!isLocal ? "opacity-70" : ""}`}
                  disabled={done && isLocal}>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0 border border-white/30" style={{ background: p.color || "hsl(var(--primary))" }} />
                    {!isLocal && <Lock className="w-2.5 h-2.5" />}
                    {pInPractice && "🏋️ "}
                    {p.name}
                  </span>
                  <span className="flex items-center gap-1 w-full">
                    <span className="text-[10px] tabular-nums opacity-80">{pCount}/{pLimit}</span>
                    <span className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
                      <span className={`block h-full ${progressColor} rounded-full transition-all`} style={{ width: `${Math.min(pctDone, 100)}%` }} />
                    </span>
                  </span>
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


          {/* Blocked zone overlays */}
          {blockedZones.map(zone => {
            const pos = ZONE_LABEL_POS[zone];
            return (
              <g key={`blocked-${zone}`}>
                <path d={ZONE_PATHS[zone]} fill="hsl(0 84% 60% / 0.2)" stroke="hsl(0 84% 60% / 0.5)" strokeWidth="2" strokeDasharray="8 4" />
                <line x1={pos.x - 12} y1={pos.y - 12} x2={pos.x + 12} y2={pos.y + 12} stroke="hsl(0 84% 60%)" strokeWidth="4" strokeLinecap="round" />
                <line x1={pos.x + 12} y1={pos.y - 12} x2={pos.x - 12} y2={pos.y + 12} stroke="hsl(0 84% 60%)" strokeWidth="4" strokeLinecap="round" />
              </g>
            );
          })}

          {/* Invisible hover overlays for predictive feedback */}
          {[1, 2, 3, 4, 5, 6].map(zone => (
            <path
              key={`hover-${zone}`}
              d={ZONE_PATHS[zone]}
              fill="transparent"
              stroke={hoveredZone === zone ? "hsl(var(--primary))" : "transparent"}
              strokeWidth="2"
              strokeDasharray="4 3"
              style={{ cursor: canShoot ? "crosshair" : "not-allowed", pointerEvents: pendingPos ? "none" : "auto" }}
              onMouseEnter={() => setHoveredZone(zone)}
              onMouseLeave={() => setHoveredZone(prev => (prev === zone ? null : prev))}
            />
          ))}

          {[1, 2, 3, 4, 5, 6].map(zone => {
            const pos = ZONE_LABEL_POS[zone];
            return (
              <text key={`zone-num-${zone}`} x={pos.x} y={pos.y}
                textAnchor="middle" dominantBaseline="central"
                fill="white" fontSize="24" fontWeight="900"
                opacity="0.8" stroke="black" strokeWidth="3" paintOrder="stroke"
                style={{ pointerEvents: "none" }}>
                {zone}
              </text>
            );
          })}

          <AnimatePresence>
            {courtShots.map(shot => (
              <motion.circle key={shot.id}
                cx={(shot.x / 100) * 400} cy={(shot.y / 100) * 500} r={shot.isPractice ? 5 : 6}
                fill={shot.isPractice ? "hsl(var(--muted-foreground))" : (shot.made ? "hsl(var(--shot-made))" : "hsl(var(--shot-missed))")}
                stroke="white" strokeWidth={shot.isPractice ? 1 : 1.5}
                strokeDasharray={shot.isPractice ? "3 2" : undefined}
                opacity={shot.isPractice ? 0.5 : 0.85}
                initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: shot.isPractice ? 0.5 : 0.85 }}
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
              <Button onClick={() => confirmShot(true)} className="bg-shot-made hover:bg-shot-made/80 text-primary-foreground font-bold shadow-lg shadow-green-500/30 ring-2 ring-green-400/20">
                {t("shotTracker.made")}
              </Button>
              <Button onClick={() => confirmShot(false)} className="bg-shot-missed hover:bg-shot-missed/80 text-primary-foreground font-bold shadow-lg shadow-red-500/30 ring-2 ring-red-400/20">
                {t("shotTracker.missed")}
              </Button>
              <Button variant="outline" onClick={() => setPendingPos(null)} className="text-xs">{t("shotTracker.cancel")}</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {activePlayer && pendingPos && (
        <p className="text-xs text-center text-muted-foreground">
          {inPractice && <span className="text-accent-foreground font-semibold">{t("shotTracker.practicePrefix")} </span>}
          {t("shotTracker.placingShot", { name: activePlayer.name, zone: zoneName(pendingPos.zone), points: ZONE_POINTS[pendingPos.zone] })}
        </p>
      )}
    </div>
  );
};

export default ShotTracker;
