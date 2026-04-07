import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";
import type { Team } from "@/context/GameContext";

type GameSession = Tables<"game_sessions">;
type SessionPlayer = Tables<"session_players">;
type SessionShot = Tables<"session_shots">;

const PLAYER_COLORS = [
  "#3b82f6", "#ef4444", "#22c55e", "#f59e0b",
  "#8b5cf6", "#ec4899", "#06b6d4", "#f97316",
];

function getDeviceId(): string {
  let id = localStorage.getItem("bb-device-id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("bb-device-id", id);
  }
  return id;
}

function generateGameCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

interface MultiplayerState {
  isMultiplayer: boolean;
  session: GameSession | null;
  sessionPlayers: SessionPlayer[];
  sessionShots: SessionShot[];
  localPlayerIds: string[];
  isHost: boolean;
  isConnected: boolean;
  isLoading: boolean;
  teamAssignments: Team[] | null;
  createGame: (playerNames: string[]) => Promise<void>;
  joinGame: (code: string, playerNames: string[]) => Promise<void>;
  leaveGame: () => void;
  addMultiplayerShot: (shot: { playerId: string; zone: number; made: boolean; x: number; y: number }) => Promise<void>;
  removeMultiplayerShot: (shotId: string) => Promise<void>;
  clearMultiplayerShots: () => Promise<void>;
  startMultiplayerGame: () => Promise<void>;
  resetMultiplayerGame: () => Promise<void>;
  updateGameMode: (mode: string) => Promise<void>;
  finishIndividualMode: () => Promise<void>;
  startTeamMode: (teams: Team[]) => Promise<void>;
  addPlayerToStation: (name: string) => Promise<void>;
  removePlayer: (playerId: string) => Promise<void>;
  leaveSession: () => Promise<void>;
}

const MultiplayerContext = createContext<MultiplayerState | null>(null);

export const useMultiplayer = () => {
  const ctx = useContext(MultiplayerContext);
  if (!ctx) throw new Error("useMultiplayer must be inside MultiplayerProvider");
  return ctx;
};

export const MultiplayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<GameSession | null>(null);
  const [sessionPlayers, setSessionPlayers] = useState<SessionPlayer[]>([]);
  const [sessionShots, setSessionShots] = useState<SessionShot[]>([]);
  const [localPlayerIds, setLocalPlayerIds] = useState<string[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const deviceId = getDeviceId();

  // Parse team assignments from session JSON
  const teamAssignments: Team[] | null = (() => {
    if (!session) return null;
    const raw = (session as any).team_assignments;
    if (!raw) return null;
    try {
      if (typeof raw === "string") return JSON.parse(raw);
      if (Array.isArray(raw)) return raw as Team[];
      return null;
    } catch {
      return null;
    }
  })();

  const subscribeToSession = useCallback((sessionId: string) => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`session-${sessionId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "session_players", filter: `session_id=eq.${sessionId}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setSessionPlayers(prev => {
              if (prev.find(p => p.id === (payload.new as SessionPlayer).id)) return prev;
              return [...prev, payload.new as SessionPlayer];
            });
          } else if (payload.eventType === "DELETE") {
            setSessionPlayers(prev => prev.filter(p => p.id !== payload.old.id));
          } else if (payload.eventType === "UPDATE") {
            setSessionPlayers(prev => prev.map(p => p.id === (payload.new as SessionPlayer).id ? payload.new as SessionPlayer : p));
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "session_shots", filter: `session_id=eq.${sessionId}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setSessionShots(prev => {
              if (prev.find(s => s.id === (payload.new as SessionShot).id)) return prev;
              return [...prev, payload.new as SessionShot];
            });
          } else if (payload.eventType === "DELETE") {
            setSessionShots(prev => prev.filter(s => s.id !== payload.old.id));
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "game_sessions", filter: `id=eq.${sessionId}` },
        (payload) => {
          setSession(payload.new as GameSession);
        }
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    channelRef.current = channel;
  }, []);

  const createGame = useCallback(async (playerNames: string[]) => {
    setIsLoading(true);
    try {
      const gameCode = generateGameCode();
      const { data: sessionData, error: sessionError } = await supabase
        .from("game_sessions")
        .insert({ game_code: gameCode, host_device_id: deviceId, status: "waiting" })
        .select()
        .single();

      if (sessionError || !sessionData) throw sessionError || new Error("Failed to create session");

      const playersToInsert = playerNames.map((name, i) => ({
        session_id: sessionData.id,
        name: name.trim(),
        device_id: deviceId,
        color: PLAYER_COLORS[i % PLAYER_COLORS.length],
      }));

      const { data: playerData, error: playerError } = await supabase
        .from("session_players")
        .insert(playersToInsert)
        .select();

      if (playerError || !playerData) throw playerError || new Error("Failed to add players");

      setSession(sessionData);
      setSessionPlayers(playerData);
      setSessionShots([]);
      setLocalPlayerIds(playerData.map(p => p.id));
      setIsHost(true);

      subscribeToSession(sessionData.id);
      toast.success(`Game created! Code: ${gameCode}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create game");
    } finally {
      setIsLoading(false);
    }
  }, [deviceId, subscribeToSession]);

  const joinGame = useCallback(async (code: string, playerNames: string[]) => {
    setIsLoading(true);
    try {
      const normalizedCode = code.trim().toUpperCase();
      const { data: sessionData, error: sessionError } = await supabase
        .from("game_sessions")
        .select()
        .eq("game_code", normalizedCode)
        .single();

      if (sessionError || !sessionData) {
        toast.error("Invalid game code. Please check and try again.");
        return;
      }

      const { data: existingPlayers } = await supabase
        .from("session_players")
        .select()
        .eq("session_id", sessionData.id);

      const existingFromDevice = existingPlayers?.filter(p => p.device_id === deviceId) || [];
      if (existingFromDevice.length > 0) {
        setSession(sessionData);
        setSessionPlayers(existingPlayers || []);
        setLocalPlayerIds(existingFromDevice.map(p => p.id));
        setIsHost(sessionData.host_device_id === deviceId);

        const { data: shots } = await supabase
          .from("session_shots")
          .select()
          .eq("session_id", sessionData.id);
        setSessionShots(shots || []);

        subscribeToSession(sessionData.id);
        toast.success(`Rejoined game ${normalizedCode}!`);
        return;
      }

      const existingCount = existingPlayers?.length || 0;
      const existingNames = new Set(existingPlayers?.map(p => p.name.toLowerCase()) || []);

      const playersToInsert = playerNames.map((name, i) => {
        let finalName = name.trim();
        if (existingNames.has(finalName.toLowerCase())) {
          finalName = `${finalName} (2)`;
        }
        existingNames.add(finalName.toLowerCase());
        return {
          session_id: sessionData.id,
          name: finalName,
          device_id: deviceId,
          color: PLAYER_COLORS[(existingCount + i) % PLAYER_COLORS.length],
        };
      });

      const { data: playerData, error: playerError } = await supabase
        .from("session_players")
        .insert(playersToInsert)
        .select();

      if (playerError || !playerData) throw playerError || new Error("Failed to join");

      setSession(sessionData);
      setSessionPlayers([...(existingPlayers || []), ...playerData]);
      setLocalPlayerIds(playerData.map(p => p.id));
      setIsHost(sessionData.host_device_id === deviceId);

      const { data: shots } = await supabase
        .from("session_shots")
        .select()
        .eq("session_id", sessionData.id);
      setSessionShots(shots || []);

      subscribeToSession(sessionData.id);
      toast.success(`Joined game ${normalizedCode} with ${playerNames.length} player${playerNames.length > 1 ? "s" : ""}!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to join game");
    } finally {
      setIsLoading(false);
    }
  }, [deviceId, subscribeToSession]);

  const leaveGame = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    setSession(null);
    setSessionPlayers([]);
    setSessionShots([]);
    setLocalPlayerIds([]);
    setIsHost(false);
    setIsConnected(false);
  }, []);

  const addMultiplayerShot = useCallback(async (shot: { playerId: string; zone: number; made: boolean; x: number; y: number }) => {
    if (!session) return;
    const { error } = await supabase
      .from("session_shots")
      .insert({
        session_id: session.id,
        player_id: shot.playerId,
        zone: shot.zone,
        made: shot.made,
        x: shot.x,
        y: shot.y,
      });
    if (error) toast.error("Failed to record shot");
  }, [session]);

  const removeMultiplayerShot = useCallback(async (shotId: string) => {
    const { error } = await supabase
      .from("session_shots")
      .delete()
      .eq("id", shotId);
    if (error) toast.error("Failed to undo shot");
  }, []);

  const clearMultiplayerShots = useCallback(async () => {
    if (!session) return;
    const { error } = await supabase
      .from("session_shots")
      .delete()
      .eq("session_id", session.id);
    if (error) toast.error("Failed to clear shots");
    else setSessionShots([]);
  }, [session]);

  const startMultiplayerGame = useCallback(async () => {
    if (!session) return;
    await supabase
      .from("game_sessions")
      .update({ status: "playing" })
      .eq("id", session.id);
  }, [session]);

  const resetMultiplayerGame = useCallback(async () => {
    if (!session) return;
    await supabase
      .from("session_shots")
      .delete()
      .eq("session_id", session.id);
    await supabase
      .from("game_sessions")
      .update({ status: "waiting", game_mode: "individual", team_assignments: null } as any)
      .eq("id", session.id);
    setSessionShots([]);
  }, [session]);

  const updateGameMode = useCallback(async (mode: string) => {
    if (!session) return;
    await supabase
      .from("game_sessions")
      .update({ game_mode: mode })
      .eq("id", session.id);
  }, [session]);

  // Host signals that individual mode is done — all devices will see status change
  const finishIndividualMode = useCallback(async () => {
    if (!session) return;
    await supabase
      .from("game_sessions")
      .update({ status: "individual_done" } as any)
      .eq("id", session.id);
  }, [session]);

  // Host starts team mode — clears shots, sets teams, updates status atomically
  const startTeamMode = useCallback(async (teams: Team[]) => {
    if (!session) return;
    // Clear shots first
    await supabase
      .from("session_shots")
      .delete()
      .eq("session_id", session.id);
    setSessionShots([]);

    // Update session with team data and new status
    await supabase
      .from("game_sessions")
      .update({
        status: "team_playing",
        game_mode: "team",
        team_assignments: teams as any,
      } as any)
      .eq("id", session.id);
  }, [session]);

  // Add a player to this station in the waiting room
  const addPlayerToStation = useCallback(async (name: string) => {
    if (!session) return;
    const existingCount = sessionPlayers.length;
    const existingNames = new Set(sessionPlayers.map(p => p.name.toLowerCase()));
    let finalName = name.trim();
    if (existingNames.has(finalName.toLowerCase())) {
      finalName = `${finalName} (2)`;
    }
    const { data, error } = await supabase
      .from("session_players")
      .insert({
        session_id: session.id,
        name: finalName,
        device_id: deviceId,
        color: PLAYER_COLORS[existingCount % PLAYER_COLORS.length],
      })
      .select()
      .single();
    if (error || !data) { toast.error("Failed to add player"); return; }
    setLocalPlayerIds(prev => [...prev, data.id]);
    toast.success(`${finalName} added!`);
  }, [session, sessionPlayers, deviceId]);

  // Host removes any player; non-host can only remove own (enforced in UI)
  const removePlayer = useCallback(async (playerId: string) => {
    const { error } = await supabase
      .from("session_players")
      .delete()
      .eq("id", playerId);
    if (error) { toast.error("Failed to remove player"); return; }
    setLocalPlayerIds(prev => prev.filter(id => id !== playerId));
  }, []);

  // Leave the session entirely (delete all local players, reset state)
  const leaveSession = useCallback(async () => {
    if (!session) return;
    // Delete all players from this device
    await supabase
      .from("session_players")
      .delete()
      .eq("session_id", session.id)
      .eq("device_id", deviceId);
    leaveGame();
  }, [session, deviceId, leaveGame]);

  // Detect being kicked: if we have a session but all our local players are gone
  useEffect(() => {
    if (!session || session.status !== "waiting") return;
    if (localPlayerIds.length === 0) return;
    const stillHavePlayers = localPlayerIds.some(id => sessionPlayers.find(p => p.id === id));
    if (!stillHavePlayers) {
      toast.error("You've been removed from this session. Try again!");
      leaveGame();
    }
  }, [session, sessionPlayers, localPlayerIds, leaveGame]);

  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  return (
    <MultiplayerContext.Provider value={{
      isMultiplayer: !!session,
      session,
      sessionPlayers,
      sessionShots,
      localPlayerIds,
      isHost,
      isConnected,
      isLoading,
      teamAssignments,
      createGame,
      joinGame,
      leaveGame,
      addMultiplayerShot,
      removeMultiplayerShot,
      clearMultiplayerShots,
      startMultiplayerGame,
      resetMultiplayerGame,
      updateGameMode,
      finishIndividualMode,
      startTeamMode,
      addPlayerToStation,
      removePlayer,
      leaveSession,
    }}>
      {children}
    </MultiplayerContext.Provider>
  );
};
