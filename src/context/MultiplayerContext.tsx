import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

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
  localPlayerId: string | null;
  isHost: boolean;
  isConnected: boolean;
  isLoading: boolean;
  createGame: (playerName: string) => Promise<void>;
  joinGame: (code: string, playerName: string) => Promise<void>;
  leaveGame: () => void;
  addMultiplayerShot: (shot: { playerId: string; zone: number; made: boolean; x: number; y: number }) => Promise<void>;
  removeMultiplayerShot: (shotId: string) => Promise<void>;
  startMultiplayerGame: () => Promise<void>;
  resetMultiplayerGame: () => Promise<void>;
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
  const [localPlayerId, setLocalPlayerId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const deviceId = getDeviceId();

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

  const createGame = useCallback(async (playerName: string) => {
    setIsLoading(true);
    try {
      const gameCode = generateGameCode();
      const { data: sessionData, error: sessionError } = await supabase
        .from("game_sessions")
        .insert({ game_code: gameCode, host_device_id: deviceId, status: "waiting" })
        .select()
        .single();

      if (sessionError || !sessionData) throw sessionError || new Error("Failed to create session");

      const color = PLAYER_COLORS[0];
      const { data: playerData, error: playerError } = await supabase
        .from("session_players")
        .insert({ session_id: sessionData.id, name: playerName.trim(), device_id: deviceId, color })
        .select()
        .single();

      if (playerError || !playerData) throw playerError || new Error("Failed to add player");

      setSession(sessionData);
      setSessionPlayers([playerData]);
      setSessionShots([]);
      setLocalPlayerId(playerData.id);
      setIsHost(true);

      subscribeToSession(sessionData.id);
      toast.success(`Game created! Code: ${gameCode}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create game");
    } finally {
      setIsLoading(false);
    }
  }, [deviceId, subscribeToSession]);

  const joinGame = useCallback(async (code: string, playerName: string) => {
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

      // Check if this device already has a player in this session
      const { data: existingPlayers } = await supabase
        .from("session_players")
        .select()
        .eq("session_id", sessionData.id);

      const existing = existingPlayers?.find(p => p.device_id === deviceId);
      if (existing) {
        // Rejoin
        setSession(sessionData);
        setSessionPlayers(existingPlayers || []);
        setLocalPlayerId(existing.id);
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

      // Check for duplicate names
      const nameTaken = existingPlayers?.some(p => p.name.toLowerCase() === playerName.trim().toLowerCase());
      const finalName = nameTaken ? `${playerName.trim()} (2)` : playerName.trim();

      const color = PLAYER_COLORS[(existingPlayers?.length || 0) % PLAYER_COLORS.length];
      const { data: playerData, error: playerError } = await supabase
        .from("session_players")
        .insert({ session_id: sessionData.id, name: finalName, device_id: deviceId, color })
        .select()
        .single();

      if (playerError || !playerData) throw playerError || new Error("Failed to join");

      setSession(sessionData);
      setSessionPlayers([...(existingPlayers || []), playerData]);
      setLocalPlayerId(playerData.id);
      setIsHost(sessionData.host_device_id === deviceId);

      const { data: shots } = await supabase
        .from("session_shots")
        .select()
        .eq("session_id", sessionData.id);
      setSessionShots(shots || []);

      subscribeToSession(sessionData.id);
      toast.success(`Joined game ${normalizedCode}!`);
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
    setLocalPlayerId(null);
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
      .update({ status: "waiting" })
      .eq("id", session.id);
    setSessionShots([]);
  }, [session]);

  // Cleanup on unmount
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
      localPlayerId,
      isHost,
      isConnected,
      isLoading,
      createGame,
      joinGame,
      leaveGame,
      addMultiplayerShot,
      removeMultiplayerShot,
      startMultiplayerGame,
      resetMultiplayerGame,
    }}>
      {children}
    </MultiplayerContext.Provider>
  );
};