import { useGame, ZONE_POINTS, ZONE_LABELS } from "@/context/GameContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Plus, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const DataTable = () => {
  const { players, addPlayer, removePlayer, getPlayerStats, selectedPlayerId, selectPlayer, exportCSV } = useGame();
  const [newName, setNewName] = useState("");

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) return;
    addPlayer(name);
    setNewName("");
  };

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
    <div className="glass-card rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-display font-bold text-foreground">📊 Player Stats</h2>
        <Button size="sm" variant="outline" onClick={handleExport} className="gap-1 text-xs">
          <Download className="w-3 h-3" /> CSV
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Click a player row to filter the heat map. Each zone shows makes/attempts.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="text-left py-2 px-1">Player</th>
              {[1, 2, 3, 4, 5, 6].map(z => (
                <Tooltip key={z}>
                  <TooltipTrigger asChild>
                    <th className="text-center py-2 px-1 cursor-help">
                      Z{z}
                      <span className="block text-[9px] font-normal opacity-60">{ZONE_POINTS[z]}pt</span>
                    </th>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="text-xs">{ZONE_LABELS[z]} — {ZONE_POINTS[z]} point{ZONE_POINTS[z] > 1 ? "s" : ""}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
              <th className="text-center py-2 px-1">Makes</th>
              <th className="text-center py-2 px-1">Pts</th>
              
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
                      isSelected ? "bg-primary/10" : "hover:bg-secondary/50"
                    }`}
                  >
                    <td className="py-2 px-1 font-medium truncate max-w-[100px]">{player.name}</td>
                    {[1, 2, 3, 4, 5, 6].map(z => {
                      const zs = stats.zones[z];
                      return (
                        <td key={z} className="text-center py-2 px-1 tabular-nums">
                          {zs.attempts > 0 ? `${zs.makes}/${zs.attempts}` : "—"}
                        </td>
                      );
                    })}
                    <td className="text-center py-2 px-1 font-semibold text-accent tabular-nums">{stats.makes}</td>
                    <td className="text-center py-2 px-1 font-bold text-primary tabular-nums">{stats.totalPoints}</td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      <div className="flex gap-2">
        <Input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleAdd()}
          placeholder="New player name..."
          className="h-8 text-sm bg-secondary/50"
        />
        <Button size="sm" onClick={handleAdd} className="gap-1 shrink-0">
          <Plus className="w-3 h-3" /> Add
        </Button>
      </div>
    </div>
  );
};

export default DataTable;
