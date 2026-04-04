import { useGame, ZONE_LABELS, ZONE_POINTS } from "@/context/GameContext";
import { ZONE_PATHS, ZONE_LABEL_POS, COURT_VIEWBOX } from "@/lib/courtGeometry";
import { motion } from "framer-motion";
import courtImage from "@/assets/court-layout.png";

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

const legendItems = [
  { label: "0–12.5%", color: "bg-heat-ice" },
  { label: "12.5–25%", color: "bg-heat-cold" },
  { label: "25–37.5%", color: "bg-heat-cool" },
  { label: "37.5–50%", color: "bg-heat-warm" },
  { label: "50–100%", color: "bg-heat-hot" },
];

const CourtLines = () => (
  <g>
    <rect x="0" y="0" width="400" height="500" fill="none" stroke={courtLineColor} strokeWidth="2" />
    {/* Paint */}
    <rect x="140" y="300" width="120" height="200" fill="none" stroke={courtLineColor} strokeWidth="1.5" />
    {/* Backboard */}
    <line x1="175" y1="465" x2="225" y2="465" stroke={courtLineColor} strokeWidth="2" />
    {/* Basket */}
    <circle cx="200" cy="450" r="8" fill="none" stroke={courtLineColor} strokeWidth="1.5" />
    {/* Free throw semicircle */}
    <path d="M 140,300 Q 140,240 200,240 Q 260,240 260,300" fill="none" stroke={courtLineColor} strokeWidth="1" strokeDasharray="6,3" />
    {/* 3pt arc */}
    <path d="M 40,500 Q 40,100 200,100 Q 360,100 360,500" fill="none" stroke={courtLineColor} strokeWidth="1.5" strokeDasharray="6,3" />
    {/* Half court line */}
    <line x1="0" y1="0" x2="400" y2="0" stroke={courtLineColor} strokeWidth="1" opacity="0.3" />
    {/* Center circle at top */}
    <circle cx="200" cy="60" r="30" fill="none" stroke={courtLineColor} strokeWidth="1" opacity="0.3" />
  </g>
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

        <CourtLines />
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
