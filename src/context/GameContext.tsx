import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";

export interface Shot {
  id: string;
  playerId: string;
  zone: number;
  made: boolean;
  x: number;
  y: number;
}

export interface Player {
  id: string;
  name: string;
  color?: string;
}

export interface Team {
  id: string;
  name: string;
  playerIds: string[];
}

export type GameMode = "individual" | "team";
export type TeamSelectionMode = "random" | "manual" | "fair";
export type GamePhase = "setup" | "playing" | "summary";

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

export const INDIVIDUAL_SHOT_LIMIT = 20;
export const TEAM_SHOT_LIMIT = 30;

interface StartGameParams {
  mode?: GameMode;
  teams?: Team[];
}

interface GameState {
  players: Player[];
  teams: Team[];
  shots: Shot[];
  selectedPlayerId: string | null;
  gameMode: GameMode;
  gamePhase: GamePhase;
  teamSelectionMode: TeamSelectionMode;
  addPlayer: (name: string) => void;
  removePlayer: (id: string) => void;
  selectPlayer: (id: string | null) => void;
  addShot: (shot: Omit<Shot, "id">) => void;
  removeShot: (id: string) => void;
  getZoneStats: (zone: number, playerId?: string) => ZoneStats;
  getPlayerStats: (playerId: string) => { makes: number; attempts: number; totalPoints: number; zones: Record<number, ZoneStats> };
  getTeamStats: (teamId: string) => { makes: number; attempts: number; totalPoints: number; zones: Record<number, ZoneStats> };
  resetGame: () => void;
  exportCSV: () => string;
  setGameMode: (mode: GameMode) => void;
  setTeamSelectionMode: (mode: TeamSelectionMode) => void;
  setTeams: (teams: Team[]) => void;
  startGame: (params?: StartGameParams) => void;
  isGameOver: boolean;
  getPlayerShotCount: (playerId: string) => number;
  getTeamShotCount: (teamId: string) => number;
  getPlayerTeam: (playerId: string) => Team | undefined;
  setExternalPlayers: (players: Player[]) => void;
  setExternalShots: (shots: Shot[]) => void;
  setGamePhaseExternal: (phase: GamePhase) => void;
}

const GameContext = createContext<GameState | null>(null);

export const useGame = () => {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
};

let idCounter = 0;
const genId = () => `id-${++idCounter}-${Date.now()}`;

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface GameProviderProps {
  children: React.ReactNode;
  externalPlayers?: Player[];
  externalShots?: Shot[];
  externalPhase?: GamePhase;
  externalTeams?: Team[];
  externalGameMode?: GameMode;
}

export const GameProvider: React.FC<GameProviderProps> = ({
  children, externalPlayers, externalShots, externalPhase, externalTeams, externalGameMode,
}) => {
  const [players, setPlayers] = useState<Player[]>([{ id: genId(), name: "Player 1" }]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [shots, setShots] = useState<Shot[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>("individual");
  const [gamePhase, setGamePhase] = useState<GamePhase>("setup");
  const [teamSelectionMode, setTeamSelectionMode] = useState<TeamSelectionMode>("random");

  // Sync external data (multiplayer)
  useEffect(() => {
    if (externalPlayers) setPlayers(externalPlayers);
  }, [externalPlayers]);

  useEffect(() => {
    if (externalShots) setShots(externalShots);
  }, [externalShots]);

  useEffect(() => {
    if (externalPhase) setGamePhase(externalPhase);
  }, [externalPhase]);

  useEffect(() => {
    if (externalTeams) setTeams(externalTeams);
  }, [externalTeams]);

  useEffect(() => {
    if (externalGameMode) setGameMode(externalGameMode);
  }, [externalGameMode]);

  const setExternalPlayers = useCallback((p: Player[]) => setPlayers(p), []);
  const setExternalShots = useCallback((s: Shot[]) => setShots(s), []);
  const setGamePhaseExternal = useCallback((p: GamePhase) => setGamePhase(p), []);

  const addPlayer = useCallback((name: string) => {
    setPlayers(prev => [...prev, { id: genId(), name }]);
  }, []);

  const removePlayer = useCallback((id: string) => {
    setPlayers(prev => prev.filter(p => p.id !== id));
    setShots(prev => prev.filter(s => s.playerId !== id));
    setSelectedPlayerId(prev => (prev === id ? null : prev));
  }, []);

  const selectPlayer = useCallback((id: string | null) => setSelectedPlayerId(id), []);

  const getPlayerShotCount = useCallback((playerId: string) => {
    return shots.filter(s => s.playerId === playerId).length;
  }, [shots]);

  const getTeamShotCount = useCallback((teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return 0;
    return shots.filter(s => team.playerIds.includes(s.playerId)).length;
  }, [shots, teams]);

  const getPlayerTeam = useCallback((playerId: string) => {
    return teams.find(t => t.playerIds.includes(playerId));
  }, [teams]);

  const isGameOver = useMemo(() => {
    if (gamePhase !== "playing") return false;
    if (gameMode === "individual") {
      return players.length > 0 && players.every(p => shots.filter(s => s.playerId === p.id).length >= INDIVIDUAL_SHOT_LIMIT);
    } else {
      return teams.length > 0 && teams.every(t => {
        const teamShots = shots.filter(s => t.playerIds.includes(s.playerId)).length;
        return teamShots >= TEAM_SHOT_LIMIT;
      });
    }
  }, [gamePhase, gameMode, players, teams, shots]);

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
    return { makes, attempts: playerShots.length, totalPoints, zones };
  }, [shots]);

  const getTeamStats = useCallback((teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return { makes: 0, attempts: 0, totalPoints: 0, zones: {} as Record<number, ZoneStats> };
    const teamShots = shots.filter(s => team.playerIds.includes(s.playerId));
    const makes = teamShots.filter(s => s.made).length;
    const totalPoints = teamShots.filter(s => s.made).reduce((sum, s) => sum + ZONE_POINTS[s.zone], 0);
    const zones: Record<number, ZoneStats> = {};
    for (let z = 1; z <= 6; z++) {
      const zoneShots = teamShots.filter(s => s.zone === z);
      const zm = zoneShots.filter(s => s.made).length;
      zones[z] = { makes: zm, attempts: zoneShots.length, fgPct: zoneShots.length > 0 ? (zm / zoneShots.length) * 100 : 0 };
    }
    return { makes, attempts: teamShots.length, totalPoints, zones };
  }, [shots, teams]);

  const resetGame = useCallback(() => {
    setShots([]);
    setTeams([]);
    setGamePhase("setup");
    setGameMode("individual");
    setSelectedPlayerId(null);
  }, []);

  const startGame = useCallback((params?: StartGameParams) => {
    const effectiveMode = params?.mode ?? gameMode;
    const effectiveTeams = params?.teams;

    setShots([]);
    setGameMode(effectiveMode);

    if (effectiveMode === "team") {
      if (effectiveTeams && effectiveTeams.length > 0) {
        // Teams provided explicitly — use them directly
        setTeams(effectiveTeams);
      } else if (teams.length === 0) {
        // Auto-generate teams based on selection mode
        if (teamSelectionMode === "random") {
          const shuffled = shuffleArray(players);
          const mid = Math.ceil(shuffled.length / 2);
          setTeams([
            { id: genId(), name: "Team A", playerIds: shuffled.slice(0, mid).map(p => p.id) },
            { id: genId(), name: "Team B", playerIds: shuffled.slice(mid).map(p => p.id) },
          ]);
        } else if (teamSelectionMode === "fair") {
          const sorted = [...players].sort((a, b) => {
            const aStats = getPlayerStats(a.id);
            const bStats = getPlayerStats(b.id);
            return bStats.totalPoints - aStats.totalPoints;
          });
          const teamA: string[] = [];
          const teamB: string[] = [];
          sorted.forEach((p, i) => {
            if (i % 2 === 0) teamA.push(p.id);
            else teamB.push(p.id);
          });
          setTeams([
            { id: genId(), name: "Team A", playerIds: teamA },
            { id: genId(), name: "Team B", playerIds: teamB },
          ]);
        }
      }
    }

    setGamePhase("playing");
    setSelectedPlayerId(null);
  }, [gameMode, teams.length, teamSelectionMode, players, getPlayerStats]);

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
      players, teams, shots, selectedPlayerId, gameMode, gamePhase, teamSelectionMode,
      addPlayer, removePlayer, selectPlayer,
      addShot, removeShot, getZoneStats, getPlayerStats, getTeamStats,
      resetGame, exportCSV, setGameMode, setTeamSelectionMode, setTeams, startGame,
      isGameOver, getPlayerShotCount, getTeamShotCount, getPlayerTeam,
      setExternalPlayers, setExternalShots, setGamePhaseExternal,
    }}>
      {children}
    </GameContext.Provider>
  );
};
