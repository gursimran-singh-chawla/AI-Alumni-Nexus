import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (!user) return;
    const userId = user._id || user.id;
    if (!userId) return;
    const socket = io(import.meta.env.VITE_API_URL || "http://localhost:5000", {
      transports: ["websocket", "polling"]
    });
    socketRef.current = socket;
    socket.emit("user:online", userId);
    socket.on("users:online", setOnlineUsers);
    return () => { socket.disconnect(); socketRef.current = null; };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext) || { socket: null, onlineUsers: [] };

