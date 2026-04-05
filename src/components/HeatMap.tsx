import { useGame, ZONE_LABELS, ZONE_POINTS } from "@/context/GameContext";
import { ZONE_PATHS, ZONE_LABEL_POS, COURT_VIEWBOX } from "@/lib/courtGeometry";
import { motion } from "framer-motion";
import courtImage from "@/assets/court-layout.png";

const getHeatColor = (fgPct: number): string => {
  if (fgPct === 0) return "rgba(59, 130, 246, 0.6)"; // blue
  if (fgPct <= 20) return "rgba(99, 102, 241, 0.7)"; // indigo
  if (fgPct <= 40) return "rgba(168, 85, 247, 0.7)"; // purple
  if (fgPct <= 60) return "rgba(234, 88, 12, 0.7)";  // orange
  if (fgPct <= 80) return "rgba(239, 68, 68, 0.75)";  // red
  return "rgba(220, 38, 38, 0.85)"; // deep red
};

const getHeatOpacity = (fgPct: number): number => {
  if (fgPct === 0) return 0.3;
  return 0.5 + (fgPct / 100) * 0.4;
};

const legendItems = [
  { label: "0–12.5%", color: "bg-heat-ice" },
  { label: "12.5–25%", color: "bg-heat-cold" },
  { label: "25–37.5%", color: "bg-heat-cool" },
  { label: "37.5–50%", color: "bg-heat-warm" },
  { label: "50–100%", color: "bg-heat-hot" },
];

const CourtBackground = () => (
  <image href={courtImage} x="0" y="0" width="400" height="500" preserveAspectRatio="xMidYMid slice" />
);

const HeatMap = () => {
  const { getZoneStats, selectedPlayerId } = useGame();

  return (
    <div className="glass-card rounded-lg p-4 space-y-3">
      <h2 className="text-lg font-display font-bold text-foreground">🔥 Shooting Heat Map</h2>
      <p className="text-xs text-muted-foreground">
        Colors show Field Goal % (FG%) — the percentage of shots made. Hotter = more accurate zone.
      </p>

      <svg viewBox={COURT_VIEWBOX} className="w-full rounded-md overflow-hidden" style={{ background: "hsl(var(--court-bg))" }}>
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
              <text x={pos.x} y={pos.y - 12} textAnchor="middle" fill="white" fontSize="13" fontWeight="700">
                {stats.makes}/{stats.attempts}
              </text>
              <text x={pos.x} y={pos.y + 6} textAnchor="middle" fill="white" fontSize="11" opacity="0.8">
                {stats.fgPct.toFixed(0)}%
              </text>
            </g>
          );
        })}

        <CourtBackground />
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
          <span key={z}>Z{z}: {ZONE_LABELS[z]} ({ZONE_POINTS[z]}pt)</span>
        ))}
      </div>
    </div>
  );
};

export default HeatMap;
