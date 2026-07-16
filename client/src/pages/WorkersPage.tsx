import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketContext";

interface WorkerUser {
    id: number;
    username: string;
    displayName: string;
    surname: string | null;
    patronymic: string | null;
    avatar: string | null;
    email: string;
    phone: string | null;
    dateOfBirth: string | null;
    isOnline: boolean;
    roles: { roleId: number; name: string; color: string | null }[];
    profile: { country: string | null; bio: string | null; discord: string | null; steam: string | null } | null;
}

const roleColors: Record<string, string> = {
    Administrator: "#D32F2F",
    Moderator: "#FFB020",
    Judge: "#3CB371",
    Captain: "#FA6814",
    User: "#A5A5A5",
};

export default function WorkersPage() {
    const navigate = useNavigate();
    const socket = useSocket();
    const [users, setUsers] = useState<WorkerUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/api/users`, {
            credentials: "include",
        })
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then((data) => setUsers(data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!socket) return;
        socket.on("user:online", ({ userId }: { userId: number }) => {
            setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, isOnline: true } : u));
        });
        return () => { socket.off("user:online"); };
    }, [socket]);

    const filtered = users.filter((u) => {
        const q = search.toLowerCase();
        const fullName = [u.displayName, u.surname, u.patronymic].filter(Boolean).join(" ").toLowerCase();
        return fullName.includes(q) || u.username.toLowerCase().includes(q);
    });

    const onlineCount = users.filter((u) => u.isOnline).length;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-sm text-[#FA6814]" style={{ fontFamily: '"Press Start 2P", system-ui' }}>
                    Работяги
                </h1>
                <span className="text-xs text-gray-500">
                    {onlineCount} из {users.length} онлайн
                </span>
            </div>

            <input
                type="text"
                placeholder="Поиск..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-72 bg-[#1e1e1e] border border-[#3a3a3a] text-xs text-gray-300 px-3 py-2 outline-none focus:border-[#FA6814] transition-colors"
            />

            {loading ? (
                <p className="text-xs text-gray-500">Загрузка...</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    {filtered.map((u) => {
                        const fullName = [u.displayName, u.surname, u.patronymic].filter(Boolean).join(" ");
                        const initial = (u.displayName?.[0] || u.username?.[0] || "?").toUpperCase();
                        const mainRole = u.roles[0];

                        return (
                            <div
                                key={u.id}
                                className="p-4 flex items-start gap-4 cursor-pointer hover:border-[#FA6814] transition-colors"
                                style={{ background: "#2a2a2a", border: "1px solid #3b3b3b", borderRadius: 4 }}
                                onClick={() => navigate(`/user/${u.id}`)}
                            >
                                <div className="relative shrink-0">
                                    <div className="w-14 h-14 bg-[#212121] border border-[#3b3b3b] flex items-center justify-center text-lg text-[#FA6814] font-bold overflow-hidden">
                                        {u.avatar ? (
                                            <img src={u.avatar} alt={u.username} className="w-full h-full object-cover object-top" />
                                        ) : (
                                            initial
                                        )}
                                    </div>
                                    <div
                                        className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#2a2a2a]"
                                        style={{ background: u.isOnline ? "#4CAF50" : "#666" }}
                                    />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-xs font-bold text-white truncate">{fullName || u.username}</h3>
                                        <span className="text-[9px] text-gray-500 shrink-0">@{u.username}</span>
                                    </div>
                                    {mainRole && (
                                        <span
                                            className="inline-block text-[9px] px-1.5 py-0.5 mt-1 border"
                                            style={{
                                                color: mainRole.color || roleColors[mainRole.name] || "#A5A5A5",
                                                borderColor: mainRole.color || roleColors[mainRole.name] || "#A5A5A5",
                                            }}
                                        >
                                            {mainRole.name}
                                        </span>
                                    )}
                                    {u.profile?.country && (
                                        <p className="text-[10px] text-gray-500 mt-1">{u.profile.country}</p>
                                    )}
                                </div>

                                <div className="flex flex-col items-end gap-2 shrink-0">
                                    <span className="text-[10px] block" style={{ color: u.isOnline ? "#4CAF50" : "#666" }}>
                                        {u.isOnline ? "Онлайн" : "Оффлайн"}
                                    </span>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); alert("Мессенджер в разработке"); }}
                                        className="flex items-center gap-1.5 text-[10px] px-2 py-1 bg-[#FA6814] text-white hover:bg-[#FF7D30] transition-colors cursor-pointer"
                                        title="Написать сообщение"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="2" y="4" width="20" height="16" rx="2"/>
                                            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                                        </svg>
                                        Написать
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
