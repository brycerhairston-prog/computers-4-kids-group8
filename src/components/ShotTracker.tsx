import { useGame, ZONE_LABELS, ZONE_POINTS } from "@/context/GameContext";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Undo2 } from "lucide-react";

// Determine zone from click position (percentage-based)
const getZone = (xPct: number, yPct: number): number => {
  // y > 66% = paint area, mid section = mid-range, top = three
  const isLeft = xPct < 50;

  if (yPct > 66) {
    // Paint
    if (xPct >= 32 && xPct <= 68) return isLeft ? 1 : 2;
    // If outside paint box but bottom, still mid-range
    return isLeft ? 3 : 4;
  }
  if (yPct > 33) {
    return isLeft ? 3 : 4;
  }
  return isLeft ? 5 : 6;
};

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
    const zone = getZone(xPct, yPct);
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
          viewBox="0 0 400 300"
          className="w-full rounded-md cursor-crosshair"
          style={{ background: "hsl(var(--court-bg))" }}
          onClick={handleCourtClick}
        >
          {/* Court lines */}
          <rect x="0" y="0" width="400" height="300" fill="none" stroke="hsl(var(--court-line))" strokeWidth="2" />
          <path d="M 50,300 Q 50,60 200,40 Q 350,60 350,300" fill="none" stroke="hsl(var(--court-line))" strokeWidth="1.5" strokeDasharray="6,3" />
          <rect x="130" y="200" width="140" height="100" fill="none" stroke="hsl(var(--court-line))" strokeWidth="1.5" />
          <circle cx="200" cy="200" r="40" fill="none" stroke="hsl(var(--court-line))" strokeWidth="1" strokeDasharray="4,3" />
          <circle cx="200" cy="285" r="6" fill="none" stroke="hsl(var(--court-line))" strokeWidth="1.5" />
          <line x1="190" y1="295" x2="210" y2="295" stroke="hsl(var(--court-line))" strokeWidth="2" />

          {/* Zone labels */}
          {[1, 2, 3, 4, 5, 6].map(z => {
            const positions: Record<number, { x: number; y: number }> = {
              1: { x: 165, y: 270 }, 2: { x: 235, y: 270 },
              3: { x: 80, y: 230 }, 4: { x: 320, y: 230 },
              5: { x: 60, y: 70 }, 6: { x: 340, y: 70 },
            };
            const pos = positions[z];
            return (
              <text key={z} x={pos.x} y={pos.y} textAnchor="middle" fill="hsl(var(--court-line))" fontSize="10" opacity="0.5">
                Z{z} ({ZONE_POINTS[z]}pt)
              </text>
            );
          })}

          {/* Shot pins */}
          <AnimatePresence>
            {visibleShots.map(shot => (
              <motion.circle
                key={shot.id}
                cx={(shot.x / 100) * 400}
                cy={(shot.y / 100) * 300}
                r="5"
                fill={shot.made ? "hsl(var(--shot-made))" : "hsl(var(--shot-missed))"}
                stroke="white"
                strokeWidth="1"
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
              cy={(pendingPos.y / 100) * 300}
              r="8"
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
              <Button
                onClick={() => confirmShot(true)}
                className="bg-shot-made hover:bg-shot-made/80 text-primary-foreground font-bold shadow-lg"
              >
                ✓ Made
              </Button>
              <Button
                onClick={() => confirmShot(false)}
                className="bg-shot-missed hover:bg-shot-missed/80 text-primary-foreground font-bold shadow-lg"
              >
                ✗ Missed
              </Button>
              <Button
                variant="outline"
                onClick={() => setPendingPos(null)}
                className="text-xs"
              >
                Cancel
              </Button>
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
