import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { useSocket } from "../context/SocketContext";
import ChatWindow from "../components/ChatWindow";

interface Conversation {
    id: number;
    title: string | null;
    isGroup: boolean;
    createdAt: string;
    otherUser: { id: number; username: string; displayName: string | null; avatar: string | null } | null;
    otherUsers?: { id: number; username: string; displayName: string | null; avatar: string | null }[];
    lastMessage: { content: string | null; senderId: number; createdAt: string; attachmentName: string | null } | null;
    unreadCount: number;
}

interface User {
    id: number;
    username: string;
    displayName: string | null;
    avatar: string | null;
}

const API = import.meta.env.VITE_API_URL;

export default function MessagesPage() {
    const { id: paramUserId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useUser();
    const socket = useSocket();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConvId, setActiveConvId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [showNewChat, setShowNewChat] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [users, setUsers] = useState<User[]>([]);
    const [searchingUsers, setSearchingUsers] = useState(false);

    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    const loadConversations = () => {
        fetch(`${API}/api/messages/conversations`, { headers })
            .then((r) => r.json())
            .then((data) => { setConversations(data); setLoading(false); })
            .catch(() => setLoading(false));
    };

    useEffect(() => { loadConversations(); }, []);

    useEffect(() => {
        if (!paramUserId) return;
        fetch(`${API}/api/messages/find-or-create/${paramUserId}`, { headers })
            .then((r) => r.json())
            .then((conv) => {
                setActiveConvId(conv.id);
                loadConversations();
            })
            .catch(() => {});
    }, [paramUserId]);

    useEffect(() => {
        if (!socket) return;
        const handler = () => { loadConversations(); };
        socket.on("message:new", handler);
        return () => { socket.off("message:new", handler); };
    }, [socket]);

    const searchUsers = (query: string) => {
        setSearchQuery(query);
        if (query.length < 1) { setUsers([]); return; }
        setSearchingUsers(true);
        fetch(`${API}/api/users`, { headers })
            .then((r) => r.json())
            .then((data: any[]) => {
                const filtered = data.filter(
                    (u) =>
                        u.id !== user?.id &&
                        (u.username.toLowerCase().includes(query.toLowerCase()) ||
                            (u.displayName && u.displayName.toLowerCase().includes(query.toLowerCase())))
                );
                setUsers(filtered);
                setSearchingUsers(false);
            })
            .catch(() => setSearchingUsers(false));
    };

    const startChat = (userId: number) => {
        fetch(`${API}/api/messages/find-or-create/${userId}`, { headers })
            .then((r) => r.json())
            .then((conv) => {
                setActiveConvId(conv.id);
                setShowNewChat(false);
                setSearchQuery("");
                setUsers([]);
                loadConversations();
                navigate("/messages", { replace: true });
            });
    };

    const getConvName = (conv: Conversation) => {
        if (conv.title) return conv.title;
        if (conv.isGroup && conv.otherUsers) {
            return conv.otherUsers.map((u) => u.displayName || u.username).join(", ");
        }
        if (conv.otherUser) {
            return conv.otherUser.displayName || conv.otherUser.username;
        }
        return "Чат";
    };

    const getConvInitials = (conv: Conversation) => {
        const name = getConvName(conv);
        return (name[0] || "?").toUpperCase();
    };

    const formatConvTime = (dateStr: string | null) => {
        if (!dateStr) return "";
        const normalized = dateStr.includes("T") ? dateStr : dateStr.replace(" ", "T") + "Z";
        const d = new Date(normalized);
        if (isNaN(d.getTime())) return "";
        const now = new Date();
        if (d.toDateString() === now.toDateString()) {
            return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
        }
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (d.toDateString() === yesterday.toDateString()) return "Вчера";
        return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
    };

    return (
        <div className="flex h-[calc(100vh-64px)]">
            <div
                className={`w-full lg:w-80 xl:w-96 border-r border-[#3b3b3b] flex flex-col bg-[#252525] ${
                    activeConvId ? "hidden lg:flex" : "flex"
                }`}
            >
                <div className="px-4 py-3 border-b border-[#3b3b3b] flex items-center justify-between shrink-0">
                    <h2 className="text-sm font-bold text-white">Сообщения</h2>
                    <button
                        onClick={() => setShowNewChat(!showNewChat)}
                        className="text-[#FA6814] hover:text-[#FF7D30] text-xs transition-colors cursor-pointer"
                    >
                        + Новый
                    </button>
                </div>

                {showNewChat && (
                    <div className="px-4 py-3 border-b border-[#3b3b3b] shrink-0">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => searchUsers(e.target.value)}
                            placeholder="Поиск пользователя..."
                            className="w-full bg-[#1e1e1e] border border-[#3b3b3b] text-white text-xs px-3 py-2 focus:outline-none focus:border-[#FA6814] transition-colors"
                            style={{ borderRadius: 4 }}
                            autoFocus
                        />
                        {users.length > 0 && (
                            <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
                                {users.map((u) => (
                                    <button
                                        key={u.id}
                                        onClick={() => startChat(u.id)}
                                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#2a2a2a] transition-colors cursor-pointer text-left"
                                    >
                                        <div className="w-8 h-8 bg-[#333] border border-[#3b3b3b] flex items-center justify-center text-xs text-[#FA6814] font-bold shrink-0">
                                            {(u.displayName?.[0] || u.username[0] || "?").toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-xs text-white truncate">{u.displayName || u.username}</div>
                                            <div className="text-[10px] text-gray-500">@{u.username}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                        {searchQuery && users.length === 0 && !searchingUsers && (
                            <p className="text-[10px] text-gray-500 mt-2">Ничего не найдено</p>
                        )}
                    </div>
                )}

                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-10">
                            <span className="text-xs text-gray-500">Загрузка...</span>
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <div className="text-3xl text-gray-600">💬</div>
                            <p className="text-xs text-gray-500">Нет сообщений</p>
                            <button
                                onClick={() => setShowNewChat(true)}
                                className="text-[10px] text-[#FA6814] hover:text-[#FF7D30] transition-colors cursor-pointer"
                            >
                                Начать диалог
                            </button>
                        </div>
                    ) : (
                        conversations.map((conv) => (
                            <button
                                key={conv.id}
                                onClick={() => {
                                    setActiveConvId(conv.id);
                                    navigate("/messages", { replace: true });
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 transition-colors cursor-pointer text-left border-b border-[#2a2a2a] ${
                                    activeConvId === conv.id ? "bg-[#2a2a2a]" : "hover:bg-[#2a2a2a]/50"
                                }`}
                            >
                                <div className="relative shrink-0">
                                    <div className="w-10 h-10 bg-[#333] border border-[#3b3b3b] flex items-center justify-center text-sm text-[#FA6814] font-bold">
                                        {getConvInitials(conv)}
                                    </div>
                                    {conv.otherUser && (
                                        <div
                                            className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#252525]"
                                            style={{ background: "#666" }}
                                        />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-white font-medium truncate">{getConvName(conv)}</span>
                                        <span className="text-[10px] text-gray-500 shrink-0 ml-2">
                                            {formatConvTime(conv.lastMessage?.createdAt || null)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between mt-0.5">
                                        <span className="text-[11px] text-gray-500 truncate">
                                            {conv.lastMessage
                                                ? (conv.lastMessage.attachmentName && !conv.lastMessage.content
                                                    ? "📎 Файл"
                                                    : conv.lastMessage.content) || "..."
                                                : "Нет сообщений"}
                                        </span>
                                        {conv.unreadCount > 0 && (
                                            <span className="shrink-0 ml-2 bg-[#FA6814] text-white text-[9px] font-bold min-w-[18px] h-[18px] flex items-center justify-center" style={{ borderRadius: 9 }}>
                                                {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            <div className={`flex-1 flex flex-col bg-[#1e1e1e] ${!activeConvId ? "hidden lg:flex" : "flex"}`}>
                {activeConvId ? (
                    <ChatWindow
                        key={activeConvId}
                        conversationId={activeConvId}
                        onBack={() => setActiveConvId(null)}
                    />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center gap-3">
                        <div className="text-4xl text-gray-600">💬</div>
                        <p className="text-xs text-gray-500">Выберите диалог или начните новый</p>
                    </div>
                )}
            </div>
        </div>
    );
}
