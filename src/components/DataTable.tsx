import { useGame, ZONE_POINTS } from "@/context/GameContext";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const DataTable = () => {
  const { t } = useTranslation();
  const { players, getPlayerStats, selectedPlayerId, selectPlayer, exportCSV } = useGame();

  const handleExport = () => {
    const csv = exportCSV();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "basketball-analytics.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="glass-card rounded-lg p-4 space-y-3 border-t-2 border-primary/30">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-display font-bold text-foreground">
          <span className="border-b-2 border-primary pb-0.5">{t("dataTable.title")}</span>
        </h2>
        <Button size="sm" variant="outline" onClick={handleExport} className="gap-1 text-xs">
          <Download className="w-3 h-3" aria-hidden="true" /> CSV
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {t("dataTable.description")}
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="text-left py-2 px-1">{t("dataTable.player")}</th>
              {[1, 2, 3, 4, 5, 6].map(z => (
                <Tooltip key={z}>
                  <TooltipTrigger asChild>
                    <th className="text-center py-2 px-1 cursor-help">
                      Z{z}
                      <span className="block text-[9px] font-normal opacity-60">{ZONE_POINTS[z]}pt</span>
                    </th>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="text-xs">
                      {t(ZONE_POINTS[z] > 1 ? "dataTable.pointsTooltip_plural" : "dataTable.pointsTooltip", {
                        zone: t(`zones.${z}`),
                        points: ZONE_POINTS[z],
                      })}
                    </p>
                  </TooltipContent>
                </Tooltip>
              ))}
              <th className="text-center py-2 px-1">{t("dataTable.makes")}</th>
              <th className="text-center py-2 px-1">{t("dataTable.points")}</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {players.map(player => {
                const stats = getPlayerStats(player.id);
                const isSelected = selectedPlayerId === player.id;
                return (
                  <motion.tr
                    key={player.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    onClick={() => selectPlayer(isSelected ? null : player.id)}
                    className={`border-b border-border/50 cursor-pointer transition-colors ${
                      isSelected ? "bg-primary/10 border-l-2 border-l-primary" : "hover:bg-secondary/50"
                    }`}
                  >
                    <td className="py-2 px-1 font-medium truncate max-w-[120px]">
                      <span className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0" style={{ background: player.color || "hsl(var(--primary))" }}>
                          {player.name.charAt(0).toUpperCase()}
                        </span>
                        {player.name}
                      </span>
                    </td>
                    {[1, 2, 3, 4, 5, 6].map(z => {
                      const zs = stats.zones[z];
                      const fgPct = zs.attempts > 0 ? (zs.makes / zs.attempts) * 100 : -1;
                      const fgColor = fgPct < 0 ? "" : fgPct >= 60 ? "text-green-500 font-semibold" : fgPct >= 30 ? "text-orange-500" : "text-red-400";
                      return (
                        <td key={z} className={`text-center py-2 px-1 tabular-nums ${fgColor}`}>
                          {zs.attempts > 0 ? `${zs.makes}/${zs.attempts}` : "—"}
                        </td>
                      );
                    })}
                    <td className="text-center py-2 px-1 font-semibold text-green-500 tabular-nums">{stats.makes}</td>
                    <td className="text-center py-2 px-1 font-bold text-primary tabular-nums text-base">{stats.totalPoints}</td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default DataTable;
