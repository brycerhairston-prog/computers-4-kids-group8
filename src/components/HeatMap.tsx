import { useMultiplayer } from "@/context/MultiplayerContext";
import { useGame, ZONE_LABELS, ZONE_POINTS } from "@/context/GameContext";
import { ZONE_PATHS, ZONE_LABEL_POS, COURT_VIEWBOX } from "@/lib/courtGeometry";
import ZoneDebugOverlay from "@/components/ZoneDebugOverlay";
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
  const { isMultiplayer, sessionPlayers } = useMultiplayer();

  return (
    <div className="glass-card rounded-lg p-4 space-y-3 border-t-2 border-primary/30">
      <h2 className="text-lg font-display font-bold text-foreground">
        <span className="border-b-2 border-primary pb-0.5">{t("heatMap.title")}</span>
      </h2>
      <p className="text-xs text-muted-foreground">
        {t("heatMap.description")}
      </p>

      <svg viewBox={COURT_VIEWBOX} className="w-full rounded-md overflow-hidden" preserveAspectRatio="xMidYMid meet" style={{ background: "white" }}>
        <defs>
          {[1, 2, 3, 4, 5, 6].map(zone => (
            <clipPath key={`clip-${zone}`} id={`zone-clip-${zone}`}>
              <path d={ZONE_PATHS[zone]} />
            </clipPath>
          ))}
        </defs>

        <CourtBackground />

        {[1, 2, 3, 4, 5, 6].map(zone => {
          const stats = getZoneStats(zone, selectedPlayerId || undefined);
          if (stats.attempts === 0) return null;
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

        {[1, 2, 3, 4, 5, 6].map(zone => {
          const pos = ZONE_LABEL_POS[zone];
          return (
            <text key={`zone-num-${zone}`} x={pos.x} y={pos.y + 22}
              textAnchor="middle" fill="black" fontSize="11"
              fontWeight="700" opacity="0.5" style={{ pointerEvents: "none" }}>
              Z{zone}
            </text>
          );
        })}

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
        <ZoneDebugOverlay />
      </svg>

      <div className="flex flex-wrap gap-2 justify-center">
        {legendItems.map(item => (
          <div key={item.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={`w-4 h-4 rounded-md ${item.color} shadow-sm`} />
            {item.label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-1 text-[10px] text-muted-foreground">
        {[1, 2, 3, 4, 5, 6].map(z => (
          <span key={z}>Z{z}: {t(`zones.${z}`)} ({ZONE_POINTS[z]}pt)</span>
        ))}
      </div>
    </div>
  );
};

export default HeatMap;
