import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { useSocket } from "../context/SocketContext";
import ChatWindow from "../components/chat/ChatWindow";

const API = import.meta.env.VITE_API_URL;

interface Conversation {
    id: number;
    title: string | null;
    isGroup: boolean;
    avatar: string | null;
    createdAt: string;
    createdBy: number;
    otherUser: { id: number; username: string; displayName: string | null; avatar: string | null } | null;
    otherUsers?: { id: number; username: string; displayName: string | null; avatar: string | null }[];
    lastMessage: { content: string | null; senderId: number; createdAt: string; attachmentName: string | null } | null;
    unreadCount: number;
    participantCount?: number;
}

interface User {
    id: number;
    username: string;
    displayName: string | null;
    avatar: string | null;
}

interface Participant {
    id: number;
    username: string;
    displayName: string | null;
    avatar: string | null;
    role: string;
}

interface ConversationInfo {
    id: number;
    title: string | null;
    isGroup: boolean;
    avatar: string | null;
    createdBy: number;
    participants: Participant[];
    otherUser?: { id: number; username: string; displayName: string | null; avatar: string | null } | null;
}

export default function MessagesPage() {
    const { id: paramUserId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useUser();
    const socket = useSocket();

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConvId, setActiveConvId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [mobileShowChat, setMobileShowChat] = useState(false);

    const [convSearch, setConvSearch] = useState("");
    const [allUsers, setAllUsers] = useState<User[]>([]);

    const [showNewChat, setShowNewChat] = useState(false);
    const [newChatMode, setNewChatMode] = useState<"personal" | "group">("personal");
    const [userSearchQuery, setUserSearchQuery] = useState("");
    const [users, setUsers] = useState<User[]>([]);
    const [searchingUsers, setSearchingUsers] = useState(false);

    const [groupSearchQuery, setGroupSearchQuery] = useState("");
    const [groupSearchResults, setGroupSearchResults] = useState<User[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
    const [groupName, setGroupName] = useState("");

    const [showSettings, setShowSettings] = useState(false);
    const [convInfo, setConvInfo] = useState<ConversationInfo | null>(null);
    const [settingsLoading, setSettingsLoading] = useState(false);
    const [groupTitle, setGroupTitle] = useState("");
    const [editingTitle, setEditingTitle] = useState(false);
    const [memberSearchQuery, setMemberSearchQuery] = useState("");
    const [memberSearchResults, setMemberSearchResults] = useState<User[]>([]);

    const loadConversations = useCallback(() => {
        fetch(`${API}/api/messages/conversations`, { credentials: "include" })
            .then((r) => (r.ok ? r.json() : []))
            .then((data) => {
                setConversations(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    useEffect(() => {
        loadConversations();
    }, [loadConversations]);

    useEffect(() => {
        fetch(`${API}/api/users`, { credentials: "include" })
            .then((r) => (r.ok ? r.json() : []))
            .then((data: any[]) => {
                if (Array.isArray(data)) {
                    setAllUsers(data.filter((u) => u.id !== user?.id));
                }
            })
            .catch(() => {});
    }, [user?.id]);

    useEffect(() => {
        if (!paramUserId) return;
        fetch(`${API}/api/messages/find-or-create/${paramUserId}`, { credentials: "include" })
            .then((r) => r.json())
            .then((conv) => {
                setActiveConvId(conv.id);
                setMobileShowChat(true);
                loadConversations();
                navigate("/messages", { replace: true });
            })
            .catch(() => {});
    }, [paramUserId]);

    useEffect(() => {
        if (!socket) return;
        const handler = () => loadConversations();
        socket.on("message:new", handler);
        return () => {
            socket.off("message:new", handler);
        };
    }, [socket, loadConversations]);

    const searchAllUsers = useCallback(
        (query: string): Promise<User[]> => {
            return fetch(`${API}/api/users`, { credentials: "include" })
                .then((r) => r.json())
                .then((data: any[]) =>
                    data.filter(
                        (u) =>
                            u.id !== user?.id &&
                            (u.username.toLowerCase().includes(query.toLowerCase()) ||
                                (u.displayName &&
                                    u.displayName.toLowerCase().includes(query.toLowerCase())))
                    )
                )
                .catch(() => []);
        },
        [user?.id]
    );

    const handleUserSearch = (query: string) => {
        setUserSearchQuery(query);
        if (query.length < 1) {
            setUsers([]);
            return;
        }
        setSearchingUsers(true);
        searchAllUsers(query).then((result) => {
            setUsers(result);
            setSearchingUsers(false);
        });
    };

    const handleGroupSearch = (query: string) => {
        setGroupSearchQuery(query);
        if (query.length < 1) {
            setGroupSearchResults([]);
            return;
        }
        const selectedIds = new Set(selectedUsers.map((u) => u.id));
        searchAllUsers(query).then((result) => {
            setGroupSearchResults(result.filter((u) => !selectedIds.has(u.id)));
        });
    };

    const startPersonalChat = (userId: number) => {
        fetch(`${API}/api/messages/find-or-create/${userId}`, { credentials: "include" })
            .then((r) => r.json())
            .then((conv) => {
                setActiveConvId(conv.id);
                setMobileShowChat(true);
                closeNewChat();
                loadConversations();
                navigate("/messages", { replace: true });
            });
    };

    const createGroupChat = () => {
        if (selectedUsers.length < 2) return;
        fetch(`${API}/api/messages/conversations`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
                participantIds: selectedUsers.map((u) => u.id),
                title: groupName.trim() || undefined,
            }),
        })
            .then((r) => r.json())
            .then((conv) => {
                setActiveConvId(conv.id);
                setMobileShowChat(true);
                closeNewChat();
                loadConversations();
                navigate("/messages", { replace: true });
            });
    };

    const closeNewChat = () => {
        setShowNewChat(false);
        setUserSearchQuery("");
        setUsers([]);
        setGroupSearchQuery("");
        setGroupSearchResults([]);
        setSelectedUsers([]);
        setGroupName("");
    };

    const selectConversation = (convId: number) => {
        setActiveConvId(convId);
        setMobileShowChat(true);
        navigate("/messages", { replace: true });
    };

    const openSettings = () => {
        if (!activeConvId) return;
        setShowSettings(true);
        setSettingsLoading(true);
        setEditingTitle(false);
        setMemberSearchQuery("");
        setMemberSearchResults([]);
        fetch(`${API}/api/messages/conversations/${activeConvId}/info`, { credentials: "include" })
            .then((r) => r.json())
            .then((info: ConversationInfo) => {
                setConvInfo(info);
                setGroupTitle(info.title || "");
                setSettingsLoading(false);
            })
            .catch(() => setSettingsLoading(false));
    };

    const updateGroupTitle = () => {
        if (!activeConvId || !groupTitle.trim()) return;
        fetch(`${API}/api/messages/conversations/${activeConvId}/title`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ title: groupTitle.trim() }),
        })
            .then((r) => r.json())
            .then(() => {
                setEditingTitle(false);
                loadConversations();
                if (convInfo) setConvInfo({ ...convInfo, title: groupTitle.trim() });
            });
    };

    const searchMembers = (query: string) => {
        setMemberSearchQuery(query);
        if (query.length < 1) {
            setMemberSearchResults([]);
            return;
        }
        const existingIds = new Set(convInfo?.participants.map((p) => p.id) || []);
        fetch(`${API}/api/users`, { credentials: "include" })
            .then((r) => r.json())
            .then((data: any[]) => {
                const filtered = data.filter(
                    (u) =>
                        !existingIds.has(u.id) &&
                        (u.username.toLowerCase().includes(query.toLowerCase()) ||
                            (u.displayName &&
                                u.displayName.toLowerCase().includes(query.toLowerCase())))
                );
                setMemberSearchResults(filtered);
            })
            .catch(() => {});
    };

    const addMember = (userId: number) => {
        if (!activeConvId) return;
        fetch(`${API}/api/messages/conversations/${activeConvId}/members`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ userId }),
        })
            .then(() => {
                setMemberSearchQuery("");
                setMemberSearchResults([]);
                openSettings();
            });
    };

    const removeMember = (userId: number) => {
        if (!activeConvId) return;
        fetch(`${API}/api/messages/conversations/${activeConvId}/members/${userId}`, {
            method: "DELETE",
            credentials: "include",
        }).then(() => openSettings());
    };

    const leaveGroup = () => {
        if (!activeConvId) return;
        fetch(`${API}/api/messages/conversations/${activeConvId}/leave`, {
            method: "POST",
            credentials: "include",
        }).then(() => {
            setShowSettings(false);
            setActiveConvId(null);
            setMobileShowChat(false);
            loadConversations();
        });
    };

    const deleteConversation = () => {
        if (!activeConvId) return;
        fetch(`${API}/api/messages/conversations/${activeConvId}`, {
            method: "DELETE",
            credentials: "include",
        }).then(() => {
            setShowSettings(false);
            setActiveConvId(null);
            setMobileShowChat(false);
            loadConversations();
        });
    };

    const getConvName = (conv: Conversation) => {
        if (conv.title) return conv.title;
        if (conv.isGroup && conv.otherUsers?.length) {
            return conv.otherUsers.map((u) => u.displayName || u.username).join(", ");
        }
        if (conv.otherUser) return conv.otherUser.displayName || conv.otherUser.username;
        return "Новый чат";
    };

    const formatConvTime = (dateStr: string | null) => {
        if (!dateStr) return "";
        const normalized = dateStr.includes("T") ? dateStr : dateStr.replace(" ", "T");
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

    const filteredConversations = conversations.filter((conv) => {
        if (!convSearch) return true;
        return getConvName(conv).toLowerCase().includes(convSearch.toLowerCase());
    });

    const isCreator = convInfo && user && convInfo.createdBy === user.id;
    const isAdmin = convInfo?.participants.some(
        (p) => p.id === user?.id && p.role === "admin"
    );

    const getOtherUser = (): ConversationInfo["otherUser"] => {
        if (convInfo?.otherUser) return convInfo.otherUser;
        if (convInfo?.participants && convInfo.participants.length === 2) {
            return convInfo.participants.find((p) => p.id !== user?.id) || null;
        }
        return null;
    };

    return (
        <div className="flex h-full overflow-hidden">
            <div
                className={`w-full lg:w-80 border-r border-[#3b3b3b] flex flex-col bg-[#252525] ${
                    mobileShowChat ? "hidden lg:flex" : "flex"
                }`}
            >
                <div className="px-4 py-3 border-b border-[#3b3b3b] flex items-center justify-between shrink-0">
                    <h2 className="text-sm font-bold text-white">Сообщения</h2>
                    <button
                        onClick={() => {
                            if (showNewChat) {
                                closeNewChat();
                            } else {
                                setShowNewChat(true);
                            }
                        }}
                        className="w-7 h-7 flex items-center justify-center bg-[#FA6814] hover:bg-[#FF7D30] text-white transition-colors cursor-pointer text-sm font-bold"
                        style={{ borderRadius: 4 }}
                    >
                        {showNewChat ? "×" : "+"}
                    </button>
                </div>

                {showNewChat && (
                    <div className="border-b border-[#3b3b3b] shrink-0">
                        <div className="flex">
                            <button
                                onClick={() => setNewChatMode("personal")}
                                className={`flex-1 px-3 py-2 text-[11px] font-medium transition-colors cursor-pointer ${
                                    newChatMode === "personal"
                                        ? "text-[#FA6814] border-b-2 border-[#FA6814]"
                                        : "text-gray-500 hover:text-gray-300 border-b-2 border-transparent"
                                }`}
                            >
                                Личный чат
                            </button>
                            <button
                                onClick={() => setNewChatMode("group")}
                                className={`flex-1 px-3 py-2 text-[11px] font-medium transition-colors cursor-pointer ${
                                    newChatMode === "group"
                                        ? "text-[#FA6814] border-b-2 border-[#FA6814]"
                                        : "text-gray-500 hover:text-gray-300 border-b-2 border-transparent"
                                }`}
                            >
                                Групповой чат
                            </button>
                        </div>

                        {newChatMode === "personal" ? (
                            <div className="px-4 py-3">
                                <input
                                    type="text"
                                    value={userSearchQuery}
                                    onChange={(e) => handleUserSearch(e.target.value)}
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
                                                onClick={() => startPersonalChat(u.id)}
                                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#2a2a2a] transition-colors cursor-pointer text-left"
                                            >
                                                <div className="w-8 h-8 bg-[#333] border border-[#3b3b3b] flex items-center justify-center text-xs text-[#FA6814] font-bold shrink-0">
                                                    {(
                                                        u.displayName?.[0] ||
                                                        u.username[0] ||
                                                        "?"
                                                    ).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-xs text-white truncate">
                                                        {u.displayName || u.username}
                                                    </div>
                                                    <div className="text-[10px] text-gray-500">
                                                        @{u.username}
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {userSearchQuery && users.length === 0 && !searchingUsers && (
                                    <p className="text-[10px] text-gray-500 mt-2">
                                        Ничего не найдено
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="px-4 py-3 space-y-3">
                                <input
                                    type="text"
                                    value={groupSearchQuery}
                                    onChange={(e) => handleGroupSearch(e.target.value)}
                                    placeholder="Добавить участников..."
                                    className="w-full bg-[#1e1e1e] border border-[#3b3b3b] text-white text-xs px-3 py-2 focus:outline-none focus:border-[#FA6814] transition-colors"
                                    style={{ borderRadius: 4 }}
                                    autoFocus
                                />

                                {selectedUsers.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {selectedUsers.map((u) => (
                                            <span
                                                key={u.id}
                                                className="inline-flex items-center gap-1 px-2 py-1 bg-[#FA6814]/10 border border-[#FA6814]/30 text-[10px] text-[#FA6814]"
                                                style={{ borderRadius: 4 }}
                                            >
                                                {u.displayName || u.username}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedUsers((prev) =>
                                                            prev.filter((s) => s.id !== u.id)
                                                        );
                                                    }}
                                                    className="hover:text-white transition-colors cursor-pointer ml-0.5"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <input
                                    type="text"
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                    placeholder="Название группы (необязательно)"
                                    className="w-full bg-[#1e1e1e] border border-[#3b3b3b] text-white text-xs px-3 py-2 focus:outline-none focus:border-[#FA6814] transition-colors"
                                    style={{ borderRadius: 4 }}
                                />

                                {groupSearchResults.length > 0 && (
                                    <div className="max-h-36 overflow-y-auto space-y-1">
                                        {groupSearchResults.map((u) => (
                                            <button
                                                key={u.id}
                                                onClick={() => {
                                                    setSelectedUsers((prev) => [...prev, u]);
                                                    setGroupSearchQuery("");
                                                    setGroupSearchResults([]);
                                                }}
                                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#2a2a2a] transition-colors cursor-pointer text-left"
                                            >
                                                <div className="w-8 h-8 bg-[#333] border border-[#3b3b3b] flex items-center justify-center text-xs text-[#FA6814] font-bold shrink-0">
                                                    {(
                                                        u.displayName?.[0] ||
                                                        u.username[0] ||
                                                        "?"
                                                    ).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-xs text-white truncate">
                                                        {u.displayName || u.username}
                                                    </div>
                                                    <div className="text-[10px] text-gray-500">
                                                        @{u.username}
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <button
                                    onClick={createGroupChat}
                                    disabled={selectedUsers.length < 2}
                                    className="w-full bg-[#FA6814] text-white text-xs px-3 py-2 hover:bg-[#FF7D30] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                                    style={{ borderRadius: 4 }}
                                >
                                    Создать
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <div className="px-4 py-2 border-b border-[#3b3b3b] shrink-0">
                    <input
                        type="text"
                        value={convSearch}
                        onChange={(e) => setConvSearch(e.target.value)}
                        placeholder="Поиск..."
                        className="w-full bg-[#1e1e1e] border border-[#3b3b3b] text-white text-xs px-3 py-2 focus:outline-none focus:border-[#FA6814] transition-colors"
                        style={{ borderRadius: 4 }}
                    />
                </div>

                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-10">
                            <span className="text-xs text-gray-500">Загрузка...</span>
                        </div>
                    ) : filteredConversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <div className="text-3xl text-gray-600"></div>
                            <p className="text-xs text-gray-500">
                                {conversations.length === 0
                                    ? "Нет сообщений"
                                    : "Ничего не найдено"}
                            </p>
                            {conversations.length === 0 && (
                                <button
                                    onClick={() => setShowNewChat(true)}
                                    className="text-[10px] text-[#FA6814] hover:text-[#FF7D30] transition-colors cursor-pointer"
                                >
                                    Начать диалог
                                </button>
                            )}
                        </div>
                    ) : (
                        filteredConversations.map((conv) => (
                            <button
                                key={conv.id}
                                onClick={() => selectConversation(conv.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 transition-colors cursor-pointer text-left border-b border-[#2a2a2a] ${
                                    activeConvId === conv.id
                                        ? "bg-[#2a2a2a] border-l-2 border-l-[#FA6814]"
                                        : "hover:bg-[#2a2a2a]/50 border-l-2 border-l-transparent"
                                }`}
                            >
                                <div className="shrink-0">
                                    <div className="w-10 h-10 bg-[#333] border border-[#3b3b3b] flex items-center justify-center text-sm text-[#FA6814] font-bold">
                                        {conv.isGroup ? (
                                            <svg
                                                width="18"
                                                height="18"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="#FA6814"
                                                strokeWidth="2"
                                            >
                                                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                                                <circle cx="9" cy="7" r="4" />
                                                <path d="M23 21v-2a4 4 0 00-3-3.87" />
                                                <path d="M16 3.13a4 4 0 010 7.75" />
                                            </svg>
                                        ) : (
                                            (
                                                conv.otherUser?.displayName?.[0] ||
                                                conv.otherUser?.username?.[0] ||
                                                "?"
                                            ).toUpperCase()
                                        )}
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-white font-medium truncate">
                                            {getConvName(conv)}
                                        </span>
                                        <span className="text-[10px] text-gray-500 shrink-0 ml-2">
                                            {formatConvTime(conv.lastMessage?.createdAt || null)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between mt-0.5">
                                        <span className="text-xs text-gray-500 truncate">
                                            {conv.lastMessage
                                                ? conv.lastMessage.attachmentName &&
                                                  !conv.lastMessage.content
                                                    ? "📎 Файл"
                                                    : conv.lastMessage.content || "..."
                                                : "Нет сообщений"}
                                        </span>
                                        {conv.unreadCount > 0 && (
                                            <span
                                                className="shrink-0 ml-2 bg-[#FA6814] text-white text-[9px] font-bold min-w-[18px] h-[18px] flex items-center justify-center"
                                                style={{ borderRadius: 9 }}
                                            >
                                                {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>

                {allUsers.length > 0 && !showNewChat && (
                    <div className="border-t border-[#3b3b3b]">
                        <div className="px-4 py-2">
                            <span className="text-[10px] uppercase text-gray-500 font-semibold">Быстрый доступ</span>
                        </div>
                        <div className="max-h-48 overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "#3a3a3a #252525" }}>
                            {allUsers.map((u) => (
                                <button
                                    key={u.id}
                                    onClick={() => startPersonalChat(u.id)}
                                    className="w-full flex items-center gap-2 px-4 py-2 hover:bg-[#2a2a2a] transition-colors cursor-pointer text-left"
                                >
                                    <div className="w-7 h-7 bg-[#333] border border-[#3b3b3b] flex items-center justify-center text-[10px] text-[#FA6814] font-bold shrink-0">
                                        {(u.displayName?.[0] || u.username[0] || "?").toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-[11px] text-white truncate">{u.displayName || u.username}</div>
                                        <div className="text-[9px] text-gray-500">@{u.username}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div
                className={`flex-1 flex flex-col bg-[#1e1e1e] ${
                    !mobileShowChat ? "hidden lg:flex" : "flex"
                }`}
            >
                {activeConvId ? (
                    <div className="flex-1 flex flex-col relative">
                        <ChatWindow
                            key={activeConvId}
                            conversationId={activeConvId}
                            onBack={() => {
                                setActiveConvId(null);
                                setMobileShowChat(false);
                            }}
                            onOpenSettings={openSettings}
                        />

                        {showSettings && (
                            <div className="absolute inset-0 z-40 flex justify-end">
                                <div
                                    className="absolute inset-0 bg-black/50"
                                    onClick={() => setShowSettings(false)}
                                />

                                <div className="relative w-full max-w-sm bg-[#252525] border-l border-[#3b3b3b] flex flex-col overflow-hidden h-full">
                                    <div className="px-4 py-3 border-b border-[#3b3b3b] flex items-center justify-between shrink-0">
                                        <h3 className="text-sm font-bold text-white">
                                            Настройки чата
                                        </h3>
                                        <button
                                            onClick={() => setShowSettings(false)}
                                            className="text-gray-500 hover:text-white transition-colors cursor-pointer text-sm"
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    {settingsLoading ? (
                                        <div className="flex-1 flex items-center justify-center">
                                            <span className="text-xs text-gray-500">
                                                Загрузка...
                                            </span>
                                        </div>
                                    ) : convInfo ? (
                                        <div className="flex-1 overflow-y-auto">
                                            {convInfo.isGroup ? (
                                                <>
                                                    <div className="flex flex-col items-center py-6 border-b border-[#3b3b3b]">
                                                        <div className="w-16 h-16 bg-[#333] border border-[#3b3b3b] flex items-center justify-center text-2xl text-[#FA6814] font-bold overflow-hidden">
                                                            {convInfo.avatar ? (
                                                                <img
                                                                    src={convInfo.avatar}
                                                                    alt=""
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <svg
                                                                    width="28"
                                                                    height="28"
                                                                    viewBox="0 0 24 24"
                                                                    fill="none"
                                                                    stroke="#FA6814"
                                                                    strokeWidth="2"
                                                                >
                                                                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                                                                    <circle cx="9" cy="7" r="4" />
                                                                    <path d="M23 21v-2a4 4 0 00-3-3.87" />
                                                                    <path d="M16 3.13a4 4 0 010 7.75" />
                                                                </svg>
                                                            )}
                                                        </div>

                                                        {editingTitle && isAdmin ? (
                                                            <div className="mt-3 flex items-center gap-2">
                                                                <input
                                                                    type="text"
                                                                    value={groupTitle}
                                                                    onChange={(e) =>
                                                                        setGroupTitle(e.target.value)
                                                                    }
                                                                    className="bg-[#1e1e1e] border border-[#3b3b3b] text-white text-xs px-3 py-1.5 focus:outline-none focus:border-[#FA6814]"
                                                                    style={{ borderRadius: 4 }}
                                                                    autoFocus
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === "Enter")
                                                                            updateGroupTitle();
                                                                    }}
                                                                />
                                                                <button
                                                                    onClick={updateGroupTitle}
                                                                    className="text-[#FA6814] hover:text-[#FF7D30] text-xs cursor-pointer"
                                                                >
                                                                    ✓
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingTitle(false);
                                                                        setGroupTitle(
                                                                            convInfo.title || ""
                                                                        );
                                                                    }}
                                                                    className="text-gray-500 hover:text-white text-xs cursor-pointer"
                                                                >
                                                                    ✕
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => {
                                                                    if (isAdmin) setEditingTitle(true);
                                                                }}
                                                                className={`mt-3 text-sm font-medium ${
                                                                    isAdmin
                                                                        ? "text-white hover:text-[#FA6814] cursor-pointer"
                                                                        : "text-white cursor-default"
                                                                }`}
                                                            >
                                                                {convInfo.title || "Без названия"}
                                                                {isAdmin && (
                                                                    <span className="text-[10px] text-gray-500 ml-1">
                                                                        ✎
                                                                    </span>
                                                                )}
                                                            </button>
                                                        )}
                                                    </div>

                                                    <div className="px-4 py-3">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <span className="text-xs text-gray-500">
                                                                Участники (
                                                                {convInfo.participants.length})
                                                            </span>
                                                        </div>

                                                        {isAdmin && (
                                                            <div className="mb-3">
                                                                <input
                                                                    type="text"
                                                                    value={memberSearchQuery}
                                                                    onChange={(e) =>
                                                                        searchMembers(e.target.value)
                                                                    }
                                                                    placeholder="Добавить участника..."
                                                                    className="w-full bg-[#1e1e1e] border border-[#3b3b3b] text-white text-xs px-3 py-2 focus:outline-none focus:border-[#FA6814] transition-colors"
                                                                    style={{ borderRadius: 4 }}
                                                                />
                                                                {memberSearchResults.length > 0 && (
                                                                    <div className="mt-2 max-h-32 overflow-y-auto space-y-1">
                                                                        {memberSearchResults.map(
                                                                            (u) => (
                                                                                <button
                                                                                    key={u.id}
                                                                                    onClick={() =>
                                                                                        addMember(u.id)
                                                                                    }
                                                                                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#2a2a2a] transition-colors cursor-pointer text-left"
                                                                                >
                                                                                    <div className="w-6 h-6 bg-[#333] border border-[#3b3b3b] flex items-center justify-center text-[10px] text-[#FA6814] font-bold shrink-0">
                                                                                        {(
                                                                                            u.displayName?.[0] ||
                                                                                            u.username[0] ||
                                                                                            "?"
                                                                                        ).toUpperCase()}
                                                                                    </div>
                                                                                    <span className="text-xs text-white truncate flex-1">
                                                                                        {u.displayName ||
                                                                                            u.username}
                                                                                    </span>
                                                                                    <span className="text-[10px] text-[#FA6814] shrink-0">
                                                                                        + Добавить
                                                                                    </span>
                                                                                </button>
                                                                            )
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        <div className="space-y-1">
                                                            {convInfo.participants.map((p) => (
                                                                <div
                                                                    key={p.id}
                                                                    className="flex items-center gap-2 px-3 py-2 hover:bg-[#2a2a2a] transition-colors"
                                                                >
                                                                    <div className="w-8 h-8 bg-[#333] border border-[#3b3b3b] flex items-center justify-center text-xs text-[#FA6814] font-bold shrink-0">
                                                                        {(
                                                                            p.displayName?.[0] ||
                                                                            p.username[0] ||
                                                                            "?"
                                                                        ).toUpperCase()}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="text-xs text-white truncate">
                                                                            {p.displayName ||
                                                                                p.username}
                                                                        </div>
                                                                        <div className="text-[10px] text-gray-500">
                                                                            @{p.username}
                                                                        </div>
                                                                    </div>
                                                                    {p.role === "admin" && (
                                                                        <span
                                                                            className="text-[9px] text-[#FA6814] px-1.5 py-0.5 shrink-0"
                                                                            style={{
                                                                                background:
                                                                                    "rgba(250,104,20,0.1)",
                                                                                borderRadius: 4,
                                                                            }}
                                                                        >
                                                                            admin
                                                                        </span>
                                                                    )}
                                                                    {isAdmin &&
                                                                        p.id !== user?.id &&
                                                                        p.role !== "admin" && (
                                                                            <button
                                                                                onClick={() =>
                                                                                    removeMember(p.id)
                                                                                }
                                                                                className="text-gray-500 hover:text-[#D32F2F] text-[10px] cursor-pointer shrink-0 px-1"
                                                                            >
                                                                                ✕
                                                                            </button>
                                                                        )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="px-4 py-3 border-t border-[#3b3b3b] space-y-2">
                                                        {!isCreator && (
                                                            <button
                                                                onClick={leaveGroup}
                                                                className="w-full text-xs text-[#D32F2F] hover:bg-[#D32F2F]/10 transition-colors cursor-pointer px-3 py-2 border border-[#D32F2F]/30"
                                                                style={{ borderRadius: 4 }}
                                                            >
                                                                Выйти из группы
                                                            </button>
                                                        )}
                                                        {isCreator && (
                                                            <button
                                                                onClick={deleteConversation}
                                                                className="w-full text-xs text-[#D32F2F] hover:bg-[#D32F2F]/10 transition-colors cursor-pointer px-3 py-2 border border-[#D32F2F]/30"
                                                                style={{ borderRadius: 4 }}
                                                            >
                                                                Удалить группу
                                                            </button>
                                                        )}
                                                    </div>
                                                </>
                                            ) : (() => {
                                                const other = getOtherUser();
                                                return (
                                                    <>
                                                        <div className="flex flex-col items-center py-6 border-b border-[#3b3b3b]">
                                                            <div className="w-16 h-16 bg-[#333] border border-[#3b3b3b] flex items-center justify-center text-2xl text-[#FA6814] font-bold overflow-hidden">
                                                                {other?.avatar ? (
                                                                    <img
                                                                        src={other.avatar}
                                                                        alt=""
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                ) : (
                                                                    (
                                                                        other?.displayName?.[0] ||
                                                                        other?.username?.[0] ||
                                                                        "?"
                                                                    ).toUpperCase()
                                                                )}
                                                            </div>
                                                            <div className="mt-3 text-sm font-medium text-white">
                                                                {other?.displayName ||
                                                                    other?.username ||
                                                                    "Пользователь"}
                                                            </div>
                                                            <div className="text-[10px] text-gray-500">
                                                                @{other?.username}
                                                            </div>
                                                        </div>

                                                        <div className="px-4 py-3">
                                                            <button
                                                                onClick={deleteConversation}
                                                                className="w-full text-xs text-[#D32F2F] hover:bg-[#D32F2F]/10 transition-colors cursor-pointer px-3 py-2 border border-[#D32F2F]/30"
                                                                style={{ borderRadius: 4 }}
                                                            >
                                                                Удалить диалог
                                                            </button>
                                                        </div>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    ) : (
                                        <div className="flex-1 flex items-center justify-center">
                                            <span className="text-xs text-gray-500">
                                                Ошибка загрузки
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center gap-3">
                        <div className="text-4xl text-gray-600"></div>
                        <p className="text-xs text-gray-500">
                            Выберите диалог или начните новый
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
