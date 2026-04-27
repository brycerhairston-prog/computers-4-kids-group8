import { useMultiplayer } from "@/context/MultiplayerContext";
import { useGame, ZONE_POINTS } from "@/context/GameContext";
import { ZONE_PATHS, ZONE_LABEL_POS, COURT_VIEWBOX } from "@/lib/courtGeometry";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import courtImage from "@/assets/court-layout.png";

const getHeatColor = (fgPct: number): string => {
  if (fgPct === 0) return "rgba(59, 130, 246, 0.65)";
  if (fgPct <= 20) return "rgba(6, 182, 212, 0.7)";
  if (fgPct <= 40) return "rgba(239, 68, 68, 0.85)";
  if (fgPct <= 60) return "rgba(234, 179, 8, 0.75)";
  if (fgPct <= 80) return "rgba(249, 115, 22, 0.75)";
  return "rgba(34, 197, 94, 0.8)";
};

const HeatMap = () => {
  const { t } = useTranslation();
  const { getZoneStats, selectedPlayerId } = useGame();

  return (
    <div className="glass-card rounded-lg p-4 space-y-3 border-t-2 border-primary/30">
      <h2 className="text-lg font-display font-bold text-foreground">
        <span className="border-b-2 border-primary pb-0.5">{t("heatMap.title")}</span>
      </h2>

      <svg viewBox={COURT_VIEWBOX} className="w-full rounded-md overflow-hidden" style={{ background: "white" }}>
        <defs>
          {[1, 2, 3, 4, 5, 6].map((zone) => (
            <clipPath key={`clip-${zone}`} id={`zone-clip-${zone}`}>
              <path d={ZONE_PATHS[zone]} />
            </clipPath>
          ))}
        </defs>

        <image href={courtImage} x="0" y="0" width="400" height="500" preserveAspectRatio="none" />

        {[1, 2, 3, 4, 5, 6].map((zone) => {
          const stats = getZoneStats(zone, selectedPlayerId || undefined);
          if (stats.attempts === 0) return null;
          return (
            <motion.rect
              key={`heat-${zone}`}
              x="0"
              y="0"
              width="400"
              height="500"
              fill={getHeatColor(stats.fgPct)}
              clipPath={`url(#zone-clip-${zone})`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.55 }}
            />
          );
        })}

        {[1, 2, 3, 4, 5, 6].map((zone) => {
          const stats = getZoneStats(zone, selectedPlayerId || undefined);
          const pos = ZONE_LABEL_POS[zone];
          return (
            <g key={`label-${zone}`}>
              <rect x={pos.x - 28} y={pos.y - 24} width="56" height="36" rx="4" fill="white" fillOpacity="0.85" />
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
    </div>
  );
};

export default HeatMap;
