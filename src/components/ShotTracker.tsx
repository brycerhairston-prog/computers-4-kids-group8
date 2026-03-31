import { useGame, ZONE_LABELS, ZONE_POINTS } from "@/context/GameContext";
import { ZONE_PATHS, ZONE_LABEL_POS, COURT_VIEWBOX, courtLineColor, getZoneFromPoint } from "@/lib/courtGeometry";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Undo2 } from "lucide-react";

const CourtLines = () => (
  <g>
    <rect x="0" y="0" width="400" height="500" fill="none" stroke={courtLineColor} strokeWidth="2" />
    <rect x="140" y="0" width="120" height="200" fill="none" stroke={courtLineColor} strokeWidth="1.5" />
    <line x1="175" y1="35" x2="225" y2="35" stroke={courtLineColor} strokeWidth="2" />
    <circle cx="200" cy="50" r="8" fill="none" stroke={courtLineColor} strokeWidth="1.5" />
    <path d="M 140,200 Q 140,260 200,260 Q 260,260 260,200" fill="none" stroke={courtLineColor} strokeWidth="1" strokeDasharray="6,3" />
    <path d="M 40,0 Q 40,400 200,400 Q 360,400 360,0" fill="none" stroke={courtLineColor} strokeWidth="1.5" strokeDasharray="6,3" />
    <circle cx="200" cy="440" r="30" fill="none" stroke={courtLineColor} strokeWidth="1" opacity="0.3" />
    {/* Zone number labels */}
    {[1, 2, 3, 4, 5, 6].map(z => {
      const pos = ZONE_LABEL_POS[z];
      return (
        <text key={z} x={pos.x} y={pos.y + 22} textAnchor="middle" fill={courtLineColor} fontSize="10" opacity="0.4">
          Z{z} ({ZONE_POINTS[z]}pt)
        </text>
      );
    })}
  </g>
);

const ShotTracker = () => {
  const { shots, addShot, removeShot, players, selectedPlayerId, selectPlayer } = useGame();
  const courtRef = useRef<SVGSVGElement>(null);
  const [pendingPos, setPendingPos] = useState<{ x: number; y: number; zone: number } | null>(null);

  const activePlayerId = selectedPlayerId || (players.length > 0 ? players[0].id : null);
  const activePlayer = players.find(p => p.id === activePlayerId);

  const handleCourtClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!activePlayerId) return;
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
    addShot({
      playerId: activePlayerId,
      zone: pendingPos.zone,
      made,
      x: pendingPos.x,
      y: pendingPos.y,
    });
    setPendingPos(null);
  };

  const visibleShots = selectedPlayerId ? shots.filter(s => s.playerId === selectedPlayerId) : shots;
  const lastShot = shots.length > 0 ? shots[shots.length - 1] : null;

  return (
    <div className="glass-card rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-display font-bold text-foreground">📍 Shot Tracker</h2>
        {lastShot && (
          <Button size="sm" variant="ghost" onClick={() => removeShot(lastShot.id)} className="gap-1 text-xs">
            <Undo2 className="w-3 h-3" /> Undo
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Click on the court to place a shot, then mark it as Made or Missed.
        <span className="text-shot-made font-medium"> Green</span> = made,
        <span className="text-shot-missed font-medium"> Red</span> = missed.
      </p>

      {/* Player selector */}
      <div className="flex gap-1 flex-wrap">
        {players.map(p => (
          <Button
            key={p.id}
            size="sm"
            variant={activePlayerId === p.id ? "default" : "outline"}
            onClick={() => selectPlayer(p.id)}
            className="text-xs h-7"
          >
            {p.name}
          </Button>
        ))}
      </div>

      {/* Court */}
      <div className="relative">
        <svg
          ref={courtRef}
          viewBox={COURT_VIEWBOX}
          className="w-full rounded-md cursor-crosshair"
          style={{ background: "hsl(var(--court-bg))" }}
          onClick={handleCourtClick}
        >
          <CourtLines />

          {/* Shot pins */}
          <AnimatePresence>
            {visibleShots.map(shot => (
              <motion.circle
                key={shot.id}
                cx={(shot.x / 100) * 400}
                cy={(shot.y / 100) * 500}
                r="6"
                fill={shot.made ? "hsl(var(--shot-made))" : "hsl(var(--shot-missed))"}
                stroke="white"
                strokeWidth="1.5"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.85 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300 }}
              />
            ))}
          </AnimatePresence>

          {/* Pending shot */}
          {pendingPos && (
            <motion.circle
              cx={(pendingPos.x / 100) * 400}
              cy={(pendingPos.y / 100) * 500}
              r="9"
              fill="hsl(var(--primary))"
              stroke="white"
              strokeWidth="2"
              className="animate-pulse-glow"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            />
          )}
        </svg>

        {/* Made/Missed buttons */}
        <AnimatePresence>
          {pendingPos && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2"
            >
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
