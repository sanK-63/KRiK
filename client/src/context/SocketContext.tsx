import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import { io, Socket } from "socket.io-client";

const SocketContext = createContext<Socket | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const s = io(import.meta.env.VITE_API_URL, {
            auth: token ? { token } : undefined,
            transports: ["websocket", "polling"],
        });

        s.on("connect", () => {
            console.log("[Socket] Connected:", s.id);
        });

        s.on("disconnect", (reason) => {
            console.log("[Socket] Disconnected:", reason);
        });

        socketRef.current = s;

        return () => {
            s.disconnect();
        };
    }, []);

    return (
        <SocketContext.Provider value={socketRef.current}>
            {children}
        </SocketContext.Provider>
    );
}

export function useSocket(): Socket | null {
    return useContext(SocketContext);
}
