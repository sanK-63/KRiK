import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import { io, Socket } from "socket.io-client";

const SocketContext = createContext<Socket | null>(null);

function sendNativeNotification(title: string, body: string) {
  if (window.electronAPI?.showNotification) {
    window.electronAPI.showNotification(title, body)
  } else if (Notification.permission === 'granted') {
    new Notification(title, { body })
  }
}

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

        s.on("notification:new", (data: { title: string; body: string }) => {
            sendNativeNotification(data.title, data.body)
        });

        s.on("recipe:created", () => {
            sendNativeNotification("Новый рецепт", "Кто-то добавил рецепт в Таверну")
        });

        s.on("movie:created", () => {
            sendNativeNotification("Новый фильм", "Добавлен новый фильм в Кинотеатр")
        });

        s.on("meme:created", () => {
            sendNativeNotification("Новый мем", "Кто-то добавил мем")
        });

        s.on("event:created", () => {
            sendNativeNotification("Новое событие", "Добавлено новое событие")
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
