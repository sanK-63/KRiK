import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import UserMenu from "./UserMenu";
import { useSocket } from "../../context/SocketContext";

interface Props {
    onToggleSidebar: () => void;
}

interface Notification {
    id: number;
    title: string;
    body: string;
    type: string;
    read: number;
    createdAt: string;
}

export default function Header({ onToggleSidebar }: Props) {
    const [query, setQuery] = useState("");
    const navigate = useNavigate();
    const socket = useSocket();
    const [unread, setUnread] = useState(0);
    const [showNotifs, setShowNotifs] = useState(false);
    const [notifs, setNotifs] = useState<Notification[]>([]);
    const notifRef = useRef<HTMLDivElement>(null);

    const token = localStorage.getItem("token");

    useEffect(() => {
        if (!showNotifs) return;
        const handleClick = (e: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
                setShowNotifs(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [showNotifs]);

    useEffect(() => {
        if (!token) return;
        fetch(`${import.meta.env.VITE_API_URL}/api/notifications/unread-count`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => { if (data) setUnread(data.count); })
            .catch(() => {});
    }, [token]);

    useEffect(() => {
        if (!socket) return;
        socket.on("notification:new", () => {
            setUnread((u) => u + 1);
        });
        return () => { socket.off("notification:new"); };
    }, [socket]);

    const toggleNotifs = async () => {
        if (showNotifs) {
            setShowNotifs(false);
            return;
        }
        setShowNotifs(true);
        if (!token) return;
        try {
            const r = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (r.ok) {
                const data = await r.json();
                setNotifs(data.slice(0, 20));
            }
        } catch {}
        if (unread > 0) {
            fetch(`${import.meta.env.VITE_API_URL}/api/notifications/read-all`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` },
            }).catch(() => {});
            setUnread(0);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            navigate(`/search?q=${encodeURIComponent(query.trim())}`);
        }
    };

    return (
        <header className="border-b border-[#393939] bg-[#252525] shrink-0">
            <div className="h-12 sm:h-14 mx-auto flex items-center justify-between px-2 sm:px-4 lg:px-6">
                <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                    <button
                        onClick={onToggleSidebar}
                        className="text-gray-400 hover:text-white transition-colors cursor-pointer text-lg shrink-0"
                    >
                        ☰
                    </button>
                    <h1
                        className="text-[#FA6814] text-[8px] sm:text-xs leading-tight whitespace-nowrap"
                        style={{ fontFamily: '"Press Start 2P", system-ui' }}
                    >
                        Рога и Копыта
                    </h1>
                </div>

                <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                    <form onSubmit={handleSearch}>
                        <input
                            type="text"
                            placeholder="Поиск..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-28 sm:w-48 lg:w-72 bg-[#1e1e1e] border border-[#3a3a3a] text-xs text-gray-300 px-3 py-1.5 outline-none focus:border-[#FA6814] transition-colors"
                        />
                    </form>
                    {token && (
                        <div className="relative" ref={notifRef}>
                            <button
                                onClick={toggleNotifs}
                                className="relative text-gray-400 hover:text-white transition-colors cursor-pointer text-lg"
                            >
                                🔔
                                {unread > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 bg-[#D32F2F] text-white text-[8px] font-bold w-4 h-4 flex items-center justify-center">
                                        {unread > 9 ? "9+" : unread}
                                    </span>
                                )}
                            </button>
                            {showNotifs && (
                                <div
                                    className="absolute right-0 top-full mt-2 w-80 max-h-[400px] overflow-y-auto bg-[#2a2a2a] border border-[#3b3b3b] z-50"
                                    style={{ scrollbarWidth: "thin", scrollbarColor: "#3a3a3a #2a2a2a" }}
                                >
                                    <div className="p-3 border-b border-[#3b3b3b]">
                                        <span className="text-[10px] uppercase text-gray-400 font-semibold">Уведомления</span>
                                    </div>
                                    {notifs.length === 0 ? (
                                        <div className="p-4 text-center text-xs text-gray-500">Нет уведомлений</div>
                                    ) : (
                                        notifs.map((n) => (
                                            <div
                                                key={n.id}
                                                className={`p-3 border-b border-[#2a2a2a] hover:bg-[#303030] transition-colors ${n.read ? "opacity-60" : ""}`}
                                            >
                                                <p className="text-xs text-white font-medium mb-0.5">{n.title}</p>
                                                {n.body && <p className="text-[10px] text-gray-400">{n.body}</p>}
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    <UserMenu />
                </div>
            </div>
        </header>
    );
}
