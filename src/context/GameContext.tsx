import React, { createContext, useContext, useState, useCallback } from "react";

export interface Shot {
  id: string;
  playerId: string;
  zone: number; // 1-6
  made: boolean;
  x: number; // percentage position on court
  y: number;
}

export interface Player {
  id: string;
  name: string;
}

// Zone 1=paint(1pt), 2-3=mid-range(2pt), 4-6=three-point(3pt)
export const ZONE_POINTS: Record<number, number> = { 1: 1, 2: 2, 3: 2, 4: 3, 5: 3, 6: 3 };

export const ZONE_LABELS: Record<number, string> = {
  1: "Paint",
  2: "Left Mid-Range",
  3: "Right Mid-Range",
  4: "Left Corner Three",
  5: "Center Three",
  6: "Right Corner Three",
};

export interface ZoneStats {
  makes: number;
  attempts: number;
  fgPct: number;
}

interface GameState {
  players: Player[];
  shots: Shot[];
  selectedPlayerId: string | null;
  addPlayer: (name: string) => void;
  removePlayer: (id: string) => void;
  selectPlayer: (id: string | null) => void;
  addShot: (shot: Omit<Shot, "id">) => void;
  removeShot: (id: string) => void;
  getZoneStats: (zone: number, playerId?: string) => ZoneStats;
  getPlayerStats: (playerId: string) => { makes: number; totalPoints: number; zones: Record<number, ZoneStats> };
  resetGame: () => void;
  exportCSV: () => string;
}

const GameContext = createContext<GameState | null>(null);

export const useGame = () => {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
};

let idCounter = 0;
const genId = () => `id-${++idCounter}-${Date.now()}`;

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [players, setPlayers] = useState<Player[]>([
    { id: genId(), name: "Player 1" },
  ]);
  const [shots, setShots] = useState<Shot[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  const addPlayer = useCallback((name: string) => {
    setPlayers(prev => [...prev, { id: genId(), name }]);
  }, []);

  const removePlayer = useCallback((id: string) => {
    setPlayers(prev => prev.filter(p => p.id !== id));
    setShots(prev => prev.filter(s => s.playerId !== id));
    setSelectedPlayerId(prev => (prev === id ? null : prev));
  }, []);

  const selectPlayer = useCallback((id: string | null) => setSelectedPlayerId(id), []);

  const addShot = useCallback((shot: Omit<Shot, "id">) => {
    setShots(prev => [...prev, { ...shot, id: genId() }]);
  }, []);

  const removeShot = useCallback((id: string) => {
    setShots(prev => prev.filter(s => s.id !== id));
  }, []);

  const getZoneStats = useCallback((zone: number, playerId?: string): ZoneStats => {
    const filtered = shots.filter(s => s.zone === zone && (!playerId || s.playerId === playerId));
    const makes = filtered.filter(s => s.made).length;
    const attempts = filtered.length;
    return { makes, attempts, fgPct: attempts > 0 ? (makes / attempts) * 100 : 0 };
  }, [shots]);

  const getPlayerStats = useCallback((playerId: string) => {
    const playerShots = shots.filter(s => s.playerId === playerId);
    const makes = playerShots.filter(s => s.made).length;
    const totalPoints = playerShots.filter(s => s.made).reduce((sum, s) => sum + ZONE_POINTS[s.zone], 0);
    const zones: Record<number, ZoneStats> = {};
    for (let z = 1; z <= 6; z++) {
      const zoneShots = playerShots.filter(s => s.zone === z);
      const zm = zoneShots.filter(s => s.made).length;
      zones[z] = { makes: zm, attempts: zoneShots.length, fgPct: zoneShots.length > 0 ? (zm / zoneShots.length) * 100 : 0 };
    }
    return { makes, totalPoints, zones };
  }, [shots]);

  const resetGame = useCallback(() => {
    setShots([]);
  }, []);

  const exportCSV = useCallback(() => {
    const header = "Player,Zone 1,Zone 2,Zone 3,Zone 4,Zone 5,Zone 6,Total Makes,Total Points\n";
    const rows = players.map(p => {
      const stats = getPlayerStats(p.id);
      const zoneCols = [1, 2, 3, 4, 5, 6].map(z => `${stats.zones[z].makes}/${stats.zones[z].attempts}`);
      return `${p.name},${zoneCols.join(",")},${stats.makes},${stats.totalPoints}`;
    });
    return header + rows.join("\n");
  }, [players, getPlayerStats]);

  return (
    <GameContext.Provider value={{
      players, shots, selectedPlayerId,
      addPlayer, removePlayer, selectPlayer,
      addShot, removeShot, getZoneStats, getPlayerStats,
      resetGame, exportCSV,
    }}>
      {children}
    </GameContext.Provider>
  );
};
