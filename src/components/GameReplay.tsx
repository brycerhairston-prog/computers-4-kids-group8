import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Pause, RotateCcw, SkipForward, SkipBack, Film } from "lucide-react";
import courtImage from "@/assets/court-layout.png";
import { COURT_VIEWBOX, ZONE_PATHS } from "@/lib/courtGeometry";
import type { Shot, Player } from "@/context/GameContext";
import { ZONE_POINTS } from "@/context/GameContext";

interface GameReplayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shots: Shot[];
  players: Player[];
}

const SPEEDS: Array<{ label: string; delay: number }> = [
  { label: "1x", delay: 800 },
  { label: "2x", delay: 400 },
  { label: "5x", delay: 150 },
];

const PLAYER_COLORS = [
  "hsl(25, 95%, 55%)", "hsl(170, 70%, 45%)", "hsl(280, 68%, 60%)", "hsl(217, 91%, 60%)",
  "hsl(45, 93%, 47%)", "hsl(340, 75%, 55%)", "hsl(142, 71%, 45%)", "hsl(190, 90%, 50%)",
];

export default function GameReplay({ open, onOpenChange, shots, players }: GameReplayProps) {
  const [filterPlayerId, setFilterPlayerId] = useState<string>("all");
  const [speedIdx, setSpeedIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const timerRef = useRef<number | null>(null);

  const playerColor = useMemo(() => {
    const map: Record<string, string> = {};
    players.forEach((p, i) => {
      map[p.id] = p.color || PLAYER_COLORS[i % PLAYER_COLORS.length];
    });
    return map;
  }, [players]);

  const playerName = useMemo(() => {
    const m: Record<string, string> = {};
    players.forEach(p => { m[p.id] = p.name; });
    return m;
  }, [players]);

  const replayShots = useMemo(() => {
    const filtered = filterPlayerId === "all"
      ? shots
      : shots.filter(s => s.playerId === filterPlayerId);
    // Shots are already inserted in order; preserve insertion order as the timeline.
    return filtered;
  }, [shots, filterPlayerId]);

  // Reset when opening or when filter/shots change
  useEffect(() => {
    if (!open) {
      setIsPlaying(false);
      setCurrentIndex(-1);
      if (timerRef.current) { window.clearTimeout(timerRef.current); timerRef.current = null; }
    }
  }, [open]);

  useEffect(() => {
    setCurrentIndex(-1);
    setIsPlaying(false);
  }, [filterPlayerId]);

  // Playback engine
  useEffect(() => {
    if (!isPlaying) return;
    if (replayShots.length === 0) { setIsPlaying(false); return; }
    if (currentIndex >= replayShots.length - 1) { setIsPlaying(false); return; }
    const delay = SPEEDS[speedIdx].delay;
    timerRef.current = window.setTimeout(() => {
      setCurrentIndex((i) => i + 1);
    }, currentIndex === -1 ? 250 : delay);
    return () => {
      if (timerRef.current) { window.clearTimeout(timerRef.current); timerRef.current = null; }
    };
  }, [isPlaying, currentIndex, speedIdx, replayShots.length]);

  const handlePlayPause = () => {
    if (replayShots.length === 0) return;
    if (currentIndex >= replayShots.length - 1) {
      setCurrentIndex(-1);
      setIsPlaying(true);
    } else {
      setIsPlaying(p => !p);
    }
  };

  const handleRestart = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setCurrentIndex(-1);
    setIsPlaying(true);
  };

  const handleStep = (dir: 1 | -1) => {
    setIsPlaying(false);
    setCurrentIndex((i) => Math.min(replayShots.length - 1, Math.max(-1, i + dir)));
  };

  const visibleShots = currentIndex >= 0 ? replayShots.slice(0, currentIndex + 1) : [];
  const currentShot = currentIndex >= 0 ? replayShots[currentIndex] : null;

  // Live tally
  const tally = useMemo(() => {
    let makes = 0, attempts = 0, points = 0;
    visibleShots.forEach(s => {
      attempts++;
      if (s.made) { makes++; points += ZONE_POINTS[s.zone] || 0; }
    });
    return { makes, attempts, points, fg: attempts ? Math.round((makes / attempts) * 100) : 0 };
  }, [visibleShots]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <Film className="w-5 h-5 text-primary" /> Game Replay
          </DialogTitle>
        </DialogHeader>

        {replayShots.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Film className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>No replay available</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Filter + speed */}
            <div className="flex flex-wrap items-center gap-2">
              <Select value={filterPlayerId} onValueChange={setFilterPlayerId}>
                <SelectTrigger className="w-[180px] h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Players</SelectItem>
                  {players.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1 ml-auto">
                <span className="text-xs text-muted-foreground mr-1">Speed</span>
                {SPEEDS.map((s, i) => (
                  <Button
                    key={s.label}
                    size="sm"
                    variant={speedIdx === i ? "default" : "outline"}
                    onClick={() => setSpeedIdx(i)}
                    className="h-8 px-3 text-xs font-bold"
                  >
                    {s.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Court */}
            <div className="relative w-full max-w-md mx-auto aspect-[4/5] rounded-lg overflow-hidden border border-border/50 bg-card">
              <img src={courtImage} alt="Court" className="absolute inset-0 w-full h-full object-cover opacity-90" />
              <svg viewBox={COURT_VIEWBOX} className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                {/* Highlight current shot's zone */}
                {currentShot && (
                  <motion.path
                    key={`zone-${currentShot.id}`}
                    d={ZONE_PATHS[currentShot.zone]}
                    fill={currentShot.made ? "hsl(142, 71%, 45%)" : "hsl(0, 84%, 60%)"}
                    fillOpacity={0.18}
                    stroke={currentShot.made ? "hsl(142, 71%, 45%)" : "hsl(0, 84%, 60%)"}
                    strokeWidth={2}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.6, 0.2, 0.6] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  />
                )}

                {/* Past shots */}
                <AnimatePresence>
                  {visibleShots.map((shot, idx) => {
                    const isCurrent = idx === visibleShots.length - 1;
                    const color = playerColor[shot.playerId] || "hsl(var(--primary))";
                    const cx = (shot.x / 100) * 400;
                    const cy = (shot.y / 100) * 400;

                    if (shot.made) {
                      return (
                        <motion.g key={shot.id}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: isCurrent ? 1.4 : 1, opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ type: "spring", stiffness: 300, damping: 18 }}
                          style={{ transformOrigin: `${cx}px ${cy}px` }}
                        >
                          {isCurrent && (
                            <motion.circle cx={cx} cy={cy} r={18}
                              fill="none" stroke={color} strokeWidth={2}
                              initial={{ opacity: 0.8, r: 8 }}
                              animate={{ opacity: 0, r: 28 }}
                              transition={{ duration: 1, repeat: Infinity }}
                            />
                          )}
                          <circle cx={cx} cy={cy} r={isCurrent ? 9 : 6}
                            fill={color} stroke="white" strokeWidth={1.5} />
                        </motion.g>
                      );
                    }
                    return (
                      <motion.g key={shot.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isCurrent ? 0.95 : 0.55 }}
                        transition={{ duration: 0.25 }}
                      >
                        <line x1={cx - 6} y1={cy - 6} x2={cx + 6} y2={cy + 6}
                          stroke={color} strokeWidth={isCurrent ? 3.5 : 2.5} strokeLinecap="round" />
                        <line x1={cx + 6} y1={cy - 6} x2={cx - 6} y2={cy + 6}
                          stroke={color} strokeWidth={isCurrent ? 3.5 : 2.5} strokeLinecap="round" />
                      </motion.g>
                    );
                  })}
                </AnimatePresence>
              </svg>

              {/* SWISH overlay */}
              <AnimatePresence>
                {currentShot?.made && (
                  <motion.div
                    key={`swish-${currentShot.id}`}
                    initial={{ scale: 0.5, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ type: "spring", stiffness: 260, damping: 18 }}
                    className="absolute top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-green-500/95 text-white font-display font-extrabold text-lg shadow-lg tracking-wide"
                  >
                    SWISH
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Now-showing card */}
            <div className="glass-card rounded-lg p-3 flex items-center justify-between text-sm">
              <div>
                <div className="text-[10px] uppercase text-muted-foreground tracking-wide">Now showing</div>
                {currentShot ? (
                  <div className="font-bold text-foreground">
                    Shot {currentIndex + 1} / {replayShots.length} ·{" "}
                    <span style={{ color: playerColor[currentShot.playerId] }}>
                      {playerName[currentShot.playerId] || "Player"}
                    </span>{" "}
                    · Zone {currentShot.zone} ·{" "}
                    <span className={currentShot.made ? "text-green-500" : "text-red-500"}>
                      {currentShot.made ? `MADE (+${ZONE_POINTS[currentShot.zone]})` : "MISS"}
                    </span>
                  </div>
                ) : (
                  <div className="font-bold text-muted-foreground">Press play to begin</div>
                )}
              </div>
              <div className="text-right text-xs">
                <div className="font-bold text-foreground">{tally.makes}/{tally.attempts} ({tally.fg}%)</div>
                <div className="text-muted-foreground">{tally.points} pts</div>
              </div>
            </div>

            {/* Progress */}
            <div className="h-1.5 w-full bg-muted/40 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${replayShots.length ? ((currentIndex + 1) / replayShots.length) * 100 : 0}%` }}
              />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-2">
              <Button size="icon" variant="outline" onClick={() => handleStep(-1)} disabled={currentIndex <= -1}>
                <SkipBack className="w-4 h-4" />
              </Button>
              <Button size="lg" onClick={handlePlayPause} className="gap-2 font-bold px-6">
                {isPlaying ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4" /> Play</>}
              </Button>
              <Button size="icon" variant="outline" onClick={handleRestart}>
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="outline" onClick={() => handleStep(1)} disabled={currentIndex >= replayShots.length - 1}>
                <SkipForward className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
