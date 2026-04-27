import { useMultiplayer } from "@/context/MultiplayerContext";
import { useGame, ZONE_LABELS, ZONE_POINTS } from "@/context/GameContext";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import courtImage from "@/assets/court-layout.png";

// Updated geometry to fit the black lines of the reference image
const COURT_VIEWBOX = "0 0 400 500";

const ZONE_PATHS: Record<number, string> = {
  1: "M 132,0 L 268,0 L 268,200 L 132,200 Z", // The Paint
  2: "M 32,0 L 132,0 L 132,200 C 132,240 100,285 32,285 Z", // Left Mid
  3: "M 268,0 L 368,0 L 368,285 C 300,285 268,240 268,200 Z", // Right Mid
  4: "M 0,0 L 32,0 L 32,285 C 80,285 130,330 160,500 L 0,500 Z", // Left 3pt
  5: "M 160,500 C 130,330 270,330 240,500 Z", // Top 3pt
  6: "M 368,0 L 400,0 L 400,500 L 240,500 C 270,330 320,285 368,285 Z", // Right 3pt
};

const ZONE_LABEL_POS: Record<number, { x: number; y: number }> = {
  1: { x: 200, y: 100 },
  2: { x: 90, y: 120 },
  3: { x: 310, y: 120 },
  4: { x: 60, y: 400 },
  5: { x: 200, y: 420 },
  6: { x: 340, y: 400 },
};

const getHeatColor = (fgPct: number): string => {
  if (fgPct === 0) return "rgba(59, 130, 246, 0.65)";
  if (fgPct <= 20) return "rgba(6, 182, 212, 0.7)";
  if (fgPct <= 40) return "rgba(239, 68, 68, 0.85)";
  if (fgPct <= 60) return "rgba(234, 179, 8, 0.75)";
  if (fgPct <= 80) return "rgba(249, 115, 22, 0.75)";
  return "rgba(34, 197, 94, 0.8)";
};

const legendItems = [
  { label: "0%", color: "bg-blue-500" },
  { label: "1–20%", color: "bg-cyan-500" },
  { label: "21–40%", color: "bg-red-500" },
  { label: "41–60%", color: "bg-yellow-500" },
  { label: "61–80%", color: "bg-orange-500" },
  { label: "81–100%", color: "bg-green-500" },
];

const CourtBackground = () => (
  <image href={courtImage} x="0" y="0" width="400" height="500" preserveAspectRatio="none" />
);

const HeatMap = () => {
  const { t } = useTranslation();
  const { getZoneStats, selectedPlayerId } = useGame();

  return (
    <div className="glass-card rounded-lg p-4 space-y-3 border-t-2 border-primary/30">
      <h2 className="text-lg font-display font-bold text-foreground">
        <span className="border-b-2 border-primary pb-0.5">{t("heatMap.title")}</span>
      </h2>

      <svg
        viewBox={COURT_VIEWBOX}
        className="w-full rounded-md overflow-hidden"
        preserveAspectRatio="xMidYMid meet"
        style={{ background: "white" }}
      >
        <defs>
          {[1, 2, 3, 4, 5, 6].map((zone) => (
            <clipPath key={`clip-${zone}`} id={`zone-clip-${zone}`}>
              <path d={ZONE_PATHS[zone]} />
            </clipPath>
          ))}
        </defs>

        <CourtBackground />

        {[1, 2, 3, 4, 5, 6].map((zone) => {
          const stats = getZoneStats(zone, selectedPlayerId || undefined);
          if (stats.attempts === 0) return null;
          const color = getHeatColor(stats.fgPct);
          return (
            <motion.rect
              key={`heat-${zone}`}
              x="0"
              y="0"
              width="400"
              height="500"
              fill={color}
              clipPath={`url(#zone-clip-${zone})`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.55 }}
              transition={{ duration: 0.5 }}
            />
          );
        })}

        {[1, 2, 3, 4, 5, 6].map((zone) => {
          const pos = ZONE_LABEL_POS[zone];
          const stats = getZoneStats(zone, selectedPlayerId || undefined);
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

      <div className="flex flex-wrap gap-2 justify-center">
        {legendItems.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={`w-4 h-4 rounded-md ${item.color} shadow-sm`} />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
};

export default HeatMap;
