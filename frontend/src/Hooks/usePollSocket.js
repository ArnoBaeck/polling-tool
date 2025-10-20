import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { API } from "../lib/api";

export function usePollSocket(pollId, onResults) {
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(API, {
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
      timeout: 10000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join-poll", { pollId });
    });
    socket.on("results:update", (payload) => {
      if (payload?.pollId === pollId) onResults?.(payload.series);
    });
    socket.on("connect_error", (err) => {
      console.warn("Socket connect_error:", err?.message || err);
    });
    socket.on("error", (err) => {
      console.warn("Socket error:", err);
    });

    return () => {
      try { socket.emit("leave-poll", { pollId }); } catch {}
      socket.off("results:update");
      socket.disconnect();
    };
  }, [pollId, onResults]);
}