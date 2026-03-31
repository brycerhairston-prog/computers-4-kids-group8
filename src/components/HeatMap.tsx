import { useGame, ZONE_LABELS } from "@/context/GameContext";
import { motion } from "framer-motion";

const getHeatColor = (fgPct: number): string => {
  if (fgPct === 0) return "hsl(var(--muted))";
  if (fgPct <= 12.5) return "hsl(var(--heat-ice))";
  if (fgPct <= 25) return "hsl(var(--heat-cold))";
  if (fgPct <= 37.5) return "hsl(var(--heat-cool))";
  if (fgPct <= 50) return "hsl(var(--heat-warm))";
  return "hsl(var(--heat-hot))";
};

const getHeatOpacity = (fgPct: number): number => {
  if (fgPct === 0) return 0.3;
  return 0.5 + (fgPct / 100) * 0.4;
};

// Zone polygons for a half-court (viewBox 0 0 400 300)
const ZONE_PATHS: Record<number, string> = {
  1: "M 130,200 L 130,300 L 200,300 L 200,200 Z",       // Left paint
  2: "M 200,200 L 200,300 L 270,300 L 270,200 Z",       // Right paint
  3: "M 50,140 L 50,300 L 130,300 L 130,200 L 160,140 Z",  // Left mid
  4: "M 240,140 L 270,200 L 270,300 L 350,300 L 350,140 Z", // Right mid
  5: "M 0,0 L 0,300 L 50,300 L 50,140 L 160,140 L 200,0 Z",  // Left three
  6: "M 200,0 L 240,140 L 350,140 L 350,300 L 400,300 L 400,0 Z", // Right three
};

const ZONE_LABEL_POS: Record<number, { x: number; y: number }> = {
  1: { x: 165, y: 260 },
  2: { x: 235, y: 260 },
  3: { x: 90, y: 230 },
  4: { x: 310, y: 230 },
  5: { x: 60, y: 80 },
  6: { x: 340, y: 80 },
};

const legendItems = [
  { label: "0–12.5%", color: "bg-heat-ice" },
  { label: "12.5–25%", color: "bg-heat-cold" },
  { label: "25–37.5%", color: "bg-heat-cool" },
  { label: "37.5–50%", color: "bg-heat-warm" },
  { label: "50–100%", color: "bg-heat-hot" },
];

const HeatMap = () => {
  const { getZoneStats, selectedPlayerId } = useGame();

  return (
    <div className="glass-card rounded-lg p-4 space-y-3">
      <h2 className="text-lg font-display font-bold text-foreground">
        🔥 Shooting Heat Map
      </h2>
      <p className="text-xs text-muted-foreground">
        Colors show Field Goal % (FG%) — the percentage of shots made. Hotter = more accurate shooting zone.
      </p>

      <svg viewBox="0 0 400 300" className="w-full rounded-md overflow-hidden" style={{ background: "hsl(var(--court-bg))" }}>
        {/* Court lines */}
        <rect x="0" y="0" width="400" height="300" fill="none" stroke="hsl(var(--court-line))" strokeWidth="2" />
        {/* Three-point arc approximation */}
        <path d="M 50,300 Q 50,60 200,40 Q 350,60 350,300" fill="none" stroke="hsl(var(--court-line))" strokeWidth="1.5" strokeDasharray="6,3" />
        {/* Paint box */}
        <rect x="130" y="200" width="140" height="100" fill="none" stroke="hsl(var(--court-line))" strokeWidth="1.5" />
        {/* Free throw circle */}
        <circle cx="200" cy="200" r="40" fill="none" stroke="hsl(var(--court-line))" strokeWidth="1" strokeDasharray="4,3" />
        {/* Basket */}
        <circle cx="200" cy="285" r="6" fill="none" stroke="hsl(var(--court-line))" strokeWidth="1.5" />
        <line x1="190" y1="295" x2="210" y2="295" stroke="hsl(var(--court-line))" strokeWidth="2" />

        {/* Zone overlays */}
        {[1, 2, 3, 4, 5, 6].map(zone => {
          const stats = getZoneStats(zone, selectedPlayerId || undefined);
          const color = getHeatColor(stats.fgPct);
          const opacity = getHeatOpacity(stats.fgPct);
          const pos = ZONE_LABEL_POS[zone];
          return (
            <g key={zone}>
              <motion.path
                d={ZONE_PATHS[zone]}
                fill={color}
                opacity={opacity}
                initial={{ opacity: 0 }}
                animate={{ opacity }}
                transition={{ duration: 0.5 }}
              />
              <text x={pos.x} y={pos.y - 10} textAnchor="middle" fill="white" fontSize="11" fontWeight="700">
                {stats.makes}/{stats.attempts}
              </text>
              <text x={pos.x} y={pos.y + 5} textAnchor="middle" fill="white" fontSize="10" opacity="0.8">
                {stats.fgPct.toFixed(0)}%
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 justify-center">
        {legendItems.map(item => (
          <div key={item.label} className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className={`w-3 h-3 rounded-sm ${item.color}`} />
            {item.label}
          </div>
        ))}
      </div>

      {/* Zone key */}
      <div className="grid grid-cols-3 gap-1 text-[10px] text-muted-foreground">
        {[1, 2, 3, 4, 5, 6].map(z => (
          <span key={z}>Z{z}: {ZONE_LABELS[z]}</span>
        ))}
      </div>
    </div>
  );
};

export default HeatMap;
