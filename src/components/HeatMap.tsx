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

const getHeatOpacity = (_fgPct: number): number => {
  return 1;
};

const legendItems = [
  { label: "0%", color: "bg-blue-500" },
  { label: "1–20%", color: "bg-indigo-500" },
  { label: "21–40%", color: "bg-purple-500" },
  { label: "41–60%", color: "bg-orange-600" },
  { label: "61–80%", color: "bg-red-500" },
  { label: "81–100%", color: "bg-red-700" },
];

const CourtBackground = () => (
  <image href={courtImage} x="0" y="0" width="400" height="500" preserveAspectRatio="none" />
);

const HeatMap = () => {
  const { getZoneStats, selectedPlayerId } = useGame();

  return (
    <div className="glass-card rounded-lg p-4 space-y-3">
      <h2 className="text-lg font-display font-bold text-foreground">🔥 Shooting Heat Map</h2>
      <p className="text-xs text-muted-foreground">
        Colors show Field Goal % (FG%) — the percentage of shots made. Hotter = more accurate zone.
      </p>

      <svg viewBox={COURT_VIEWBOX} className="w-full rounded-md overflow-hidden" preserveAspectRatio="xMidYMid meet" style={{ background: "white" }}>
        <defs>
          {[1, 2, 3, 4, 5, 6].map(zone => (
            <clipPath key={`clip-${zone}`} id={`zone-clip-${zone}`}>
              <path d={ZONE_PATHS[zone]} />
            </clipPath>
          ))}
        </defs>

        {/* Layer 1: Court background */}
        <CourtBackground />

        {/* Layer 2: Heat map zones (clipped to exact boundaries) */}
        {[1, 2, 3, 4, 5, 6].map(zone => {
          const stats = getZoneStats(zone, selectedPlayerId || undefined);
          const color = getHeatColor(stats.fgPct);
          return (
            <motion.rect
              key={`heat-${zone}`}
              x="0" y="0" width="400" height="500"
              fill={color}
              clipPath={`url(#zone-clip-${zone})`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.55 }}
              transition={{ duration: 0.5 }}
            />
          );
        })}

        {/* Layer 3: Court image again on top for crisp lines */}
        <CourtBackground />
        <rect x="0" y="0" width="400" height="500" fill="none" />

        {/* Layer 4: Zone stat labels on top */}
        {[1, 2, 3, 4, 5, 6].map(zone => {
          const stats = getZoneStats(zone, selectedPlayerId || undefined);
          const pos = ZONE_LABEL_POS[zone];
          return (
            <g key={`label-${zone}`}>
              <rect x={pos.x - 28} y={pos.y - 24} width="56" height="36" rx="4" fill="white" fillOpacity="0.75" />
              <text x={pos.x} y={pos.y - 8} textAnchor="middle" fill="black" fontSize="13" fontWeight="700">
                {stats.makes}/{stats.attempts}
              </text>
              <text x={pos.x} y={pos.y + 8} textAnchor="middle" fill="black" fontSize="11" opacity="0.8">
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
          <span key={z}>Z{z}: {ZONE_LABELS[z]} ({ZONE_POINTS[z]}pt)</span>
        ))}
      </div>
    </div>
  );
};

export default HeatMap;
