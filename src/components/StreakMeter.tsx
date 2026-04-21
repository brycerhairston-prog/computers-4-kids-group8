import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useGame } from "@/context/GameContext";
import { useEffect, useRef, useState } from "react";

const SEGMENTS = 6;

const segmentColor = (level: number, filled: boolean) => {
  if (!filled) return "hsl(var(--muted) / 0.4)";
  // level is 1-indexed (1..6)
  if (level >= 6) return "hsl(210 90% 55%)"; // blue glow
  if (level === 5) return "hsl(140 70% 45%)"; // bright green
  if (level === 4) return "hsl(95 65% 50%)"; // light green
  if (level === 3) return "hsl(48 95% 55%)"; // yellow
  if (level === 2) return "hsl(28 95% 55%)"; // orange
  return "hsl(0 80% 55%)"; // red
};

interface StreakMeterProps {
  playerId: string;
  compact?: boolean;
}

const StreakMeter = ({ playerId, compact = false }: StreakMeterProps) => {
  const { t } = useTranslation();
  const { getPlayerStreak } = useGame();
  const { current } = getPlayerStreak(playerId);
  const prevRef = useRef(current);
  const [resetFlash, setResetFlash] = useState(false);

  useEffect(() => {
    if (prevRef.current > 0 && current === 0) {
      setResetFlash(true);
      const t = setTimeout(() => setResetFlash(false), 500);
      return () => clearTimeout(t);
    }
    prevRef.current = current;
  }, [current]);

  const filledLevels = Math.min(current, SEGMENTS);
  const isHot = current >= 3;
  const isMax = current >= SEGMENTS;

  if (compact) {
    return (
      <span className="inline-flex items-center gap-0.5" aria-label={t("streak.current", { count: current })}>
        <span className="flex flex-col-reverse gap-[1px]">
          {Array.from({ length: SEGMENTS }).map((_, i) => {
            const level = i + 1;
            const filled = level <= filledLevels;
            return (
              <span
                key={i}
                className="w-2 h-[3px] rounded-sm transition-colors"
                style={{ background: segmentColor(filledLevels, filled) }}
              />
            );
          })}
        </span>
        <span className={`text-[10px] tabular-nums font-bold ${isHot ? "text-orange-400" : "text-muted-foreground"}`}>
          {current}
        </span>
      </span>
    );
  }

  return (
    <motion.div
      animate={resetFlash ? { x: [0, -4, 4, -4, 4, 0] } : { x: 0 }}
      transition={{ duration: 0.4 }}
      className="flex items-center gap-3 p-2 rounded-md bg-card/50 border border-border/50"
    >
      <div className="flex flex-col-reverse gap-1" role="meter" aria-valuenow={current} aria-valuemin={0} aria-label={t("streak.label")}>
        {Array.from({ length: SEGMENTS }).map((_, i) => {
          const level = i + 1;
          const filled = level <= filledLevels;
          return (
            <motion.span
              key={i}
              initial={false}
              animate={{
                background: segmentColor(filledLevels, filled),
                scale: filled && level === filledLevels ? [1, 1.15, 1] : 1,
              }}
              transition={{ duration: 0.3 }}
              className={`w-5 h-3 rounded-sm border border-border/30 ${isMax && filled ? "shadow-[0_0_8px_hsl(210_90%_55%)]" : ""}`}
            />
          );
        })}
      </div>
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground font-medium">{t("streak.label")}</span>
        <AnimatePresence mode="wait">
          <motion.span
            key={current}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="text-xl font-display font-bold text-foreground tabular-nums"
          >
            {current}
          </motion.span>
        </AnimatePresence>
        {isHot && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-[10px] font-bold text-orange-400 animate-pulse"
          >
            {t("streak.hot")}
          </motion.span>
        )}
      </div>
    </motion.div>
  );
};

export default StreakMeter;
