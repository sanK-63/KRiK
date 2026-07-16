import { useState, useEffect, useRef, useCallback } from "react";
import { useUser } from "../context/UserContext";
import { useSocket } from "../context/SocketContext";

interface Message {
    id: number;
    conversationId: number;
    senderId: number;
    content: string | null;
    attachmentPath: string | null;
    attachmentName: string | null;
    createdAt: string;
    sender?: { id: number; username: string; displayName: string | null; avatar: string | null };
    reactions?: { emoji: string; userIds: number[] }[];
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
}

interface ChatWindowProps {
    conversationId: number;
    onBack: () => void;
    onOpenSettings?: () => void;
}

const API = import.meta.env.VITE_API_URL;
const PAGE_SIZE = 30;
const EMOJI_OPTIONS = ["👍", "❤️", "😂", "😮", "😢", "😡", "👋", "🔥"];

function playNotificationSound() {
    try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 800;
        osc.type = "sine";
        gain.gain.value = 0.1;
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.stop(ctx.currentTime + 0.2);
    } catch {}
}

function parseDate(s: string): Date {
    const normalized = s.includes("T") ? s : s.replace(" ", "T") + "Z";
    const d = new Date(normalized);
    if (!isNaN(d.getTime())) return d;
    return new Date(s);
}

function fmtTime(dateStr: string): string {
    const d = parseDate(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function fmtDate(dateStr: string): string {
    const d = parseDate(dateStr);
    if (isNaN(d.getTime())) return "";
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return "Сегодня";
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    if (d.toDateString() === y.toDateString()) return "Вчера";
    return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}

function dateKey(dateStr: string): string {
    const d = parseDate(dateStr);
    if (isNaN(d.getTime())) return "unknown";
    return d.toDateString();
}

function isVoiceMessage(name: string | null): boolean {
    if (!name) return false;
    return /\.(webm|ogg|mp3|wav|m4a|opus)$/i.test(name);
}

function isImageFile(name: string | null): boolean {
    if (!name) return false;
    return /\.(jpg|jpeg|png|gif|webp|bmp|svg|tiff|tif)$/i.test(name);
}

function formatRecordTime(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function ChatWindow({ conversationId, onBack, onOpenSettings }: ChatWindowProps) {
    const { user } = useUser();
    const socket = useSocket();

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const [lightbox, setLightbox] = useState<string | null>(null);
    const [recording, setRecording] = useState(false);
    const [recordTime, setRecordTime] = useState(0);
    const [showScrollBtn, setShowScrollBtn] = useState(false);
    const [typingUsers, setTypingUsers] = useState<Map<number, ReturnType<typeof setTimeout>>>(new Map());
    const [contextMenu, setContextMenu] = useState<{ msgId: number; x: number; y: number } | null>(null);
    const [reactionPickerMsgId, setReactionPickerMsgId] = useState<number | null>(null);
    const [convInfo, setConvInfo] = useState<ConversationInfo | null>(null);
    const [olderLoading, setOlderLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [, setPendingReaction] = useState<number | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const scrollHeightBeforeLoadRef = useRef<number>(0);
    const containerRef = useRef<HTMLDivElement>(null);

    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    const autoResize = useCallback(() => {
        const ta = textareaRef.current;
        if (!ta) return;
        ta.style.height = "auto";
        const maxH = 6 * 24;
        ta.style.height = Math.min(ta.scrollHeight, maxH) + "px";
    }, []);

    useEffect(() => {
        autoResize();
    }, [input, autoResize]);

    // Request notification permission on mount
    useEffect(() => {
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
    }, []);

    // Load conversation info
    useEffect(() => {
        fetch(`${API}/api/messages/conversations/${conversationId}/info`, { headers })
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => { if (data) setConvInfo(data); })
            .catch(() => {});
    }, [conversationId, headers]);

    // Load initial messages
    useEffect(() => {
        setLoading(true);
        setMessages([]);
        setHasMore(true);
        fetch(`${API}/api/messages/conversations/${conversationId}?limit=${PAGE_SIZE}`, { headers })
            .then((r) => r.json())
            .then((data) => {
                setMessages(data);
                setHasMore(data.length >= PAGE_SIZE);
                setLoading(false);
                setTimeout(() => {
                    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
                }, 0);
            })
            .catch(() => setLoading(false));
    }, [conversationId]);

    // Mark as read
    useEffect(() => {
        fetch(`${API}/api/messages/conversations/${conversationId}/read`, {
            method: "PATCH",
            headers,
        }).catch(() => {});
    }, [conversationId, messages.length]);

    // Scroll to bottom on new message (only if near bottom)
    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container) return;
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
        if (isNearBottom) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    // Socket: new message
    useEffect(() => {
        if (!socket) return;
        const handler = (msg: Message) => {
            if (msg.conversationId !== conversationId) {
                if (Notification.permission === "granted" && msg.senderId !== user?.id) {
                    new Notification(msg.sender?.displayName || "Новое сообщение", {
                        body: msg.content || "📎 Файл",
                        icon: msg.sender?.avatar ? `${API}${msg.sender.avatar}` : undefined,
                    });
                }
                return;
            }
            if (msg.senderId !== user?.id) {
                playNotificationSound();
            }
            setMessages((prev) => {
                if (prev.some((m) => m.id === msg.id)) return prev;
                return [...prev, msg];
            });
        };
        socket.on("message:new", handler);
        return () => { socket.off("message:new", handler); };
    }, [socket, conversationId, user?.id]);

    // Socket: typing indicator
    useEffect(() => {
        if (!socket) return;
        const handler = (data: { conversationId: number; userId: number; username: string }) => {
            if (data.conversationId !== conversationId || data.userId === user?.id) return;
            setTypingUsers((prev) => {
                const next = new Map(prev);
                const existing = next.get(data.userId);
                if (existing) clearTimeout(existing);
                const timeout = setTimeout(() => {
                    setTypingUsers((p) => {
                        const n = new Map(p);
                        n.delete(data.userId);
                        return n;
                    });
                }, 3000);
                next.set(data.userId, timeout);
                return next;
            });
        };
        socket.on("conversation:typing", handler);
        return () => {
            socket.off("conversation:typing", handler);
            typingUsers.forEach((t) => clearTimeout(t));
        };
    }, [socket, conversationId, user?.id]);

    // Socket: read receipts (optional)
    useEffect(() => {
        if (!socket) return;
        const handler = (data: { conversationId: number; userId: number }) => {
            if (data.conversationId !== conversationId) return;
            // Could update read status on messages here
        };
        socket.on("conversation:read", handler);
        return () => { socket.off("conversation:read", handler); };
    }, [socket, conversationId]);

    // Load older messages on scroll up
    const loadOlder = useCallback(async () => {
        if (olderLoading || !hasMore || messages.length === 0) return;
        setOlderLoading(true);
        scrollHeightBeforeLoadRef.current = messagesContainerRef.current?.scrollHeight ?? 0;
        const oldestId = messages[0].id;
        try {
            const res = await fetch(
                `${API}/api/messages/conversations/${conversationId}?before=${oldestId}&limit=${PAGE_SIZE}`,
                { headers }
            );
            const data = await res.json();
            if (data.length < PAGE_SIZE) setHasMore(false);
            setMessages((prev) => [...data, ...prev]);
        } catch {}
        setOlderLoading(false);
    }, [olderLoading, hasMore, messages, conversationId, headers]);

    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container || olderLoading) return;
        const prevScrollHeight = scrollHeightBeforeLoadRef.current;
        if (prevScrollHeight > 0) {
            container.scrollTop = container.scrollHeight - prevScrollHeight;
            scrollHeightBeforeLoadRef.current = 0;
        }
    }, [messages, olderLoading]);

    // Scroll handler for infinite scroll + scroll button
    const handleScroll = useCallback(() => {
        const container = messagesContainerRef.current;
        if (!container) return;
        const { scrollTop, scrollHeight, clientHeight } = container;
        const distFromBottom = scrollHeight - scrollTop - clientHeight;
        setShowScrollBtn(distFromBottom > 300);
        if (scrollTop < 80 && hasMore && !olderLoading) {
            loadOlder();
        }
    }, [hasMore, olderLoading, loadOlder]);

    // Escape closes lightbox + context menu
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setLightbox(null);
                setContextMenu(null);
                setReactionPickerMsgId(null);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    // Close context menu / reaction picker on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest(".msg-context-menu") && !target.closest(".msg-bubble")) {
                setContextMenu(null);
                setReactionPickerMsgId(null);
            }
        };
        if (contextMenu || reactionPickerMsgId) {
            window.addEventListener("mousedown", handler);
            return () => window.removeEventListener("mousedown", handler);
        }
    }, [contextMenu, reactionPickerMsgId]);

    const sendFormData = useCallback(async (formData: FormData) => {
        setSending(true);
        try {
            const res = await fetch(`${API}/api/messages/conversations/${conversationId}/send`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            if (res.ok) {
                const msg = await res.json();
                setMessages((prev) => {
                    if (prev.some((m) => m.id === msg.id)) return prev;
                    return [...prev, msg];
                });
                setInput("");
                setFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
                setTimeout(() => {
                    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
                }, 0);
            }
        } catch {}
        setSending(false);
    }, [conversationId, token]);

    const sendMessage = async () => {
        if ((!input.trim() && !file) || sending) return;
        const fd = new FormData();
        if (input.trim()) fd.append("content", input.trim());
        if (file) fd.append("attachment", file);
        await sendFormData(fd);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey && !recording) {
            e.preventDefault();
            sendMessage();
        }
    };

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
        if (socket && user) {
            socket.emit("conversation:typing", {
                conversationId,
                userId: user.id,
                username: user.username,
            });
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
                ? "audio/webm;codecs=opus"
                : MediaRecorder.isTypeSupported("audio/webm")
                    ? "audio/webm"
                    : "audio/ogg";
            const mr = new MediaRecorder(stream, { mimeType: mime });
            mediaRecorderRef.current = mr;
            chunksRef.current = [];

            mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
            mr.onstop = () => {
                stream.getTracks().forEach((t) => t.stop());
                const blob = new Blob(chunksRef.current, { type: mime });
                const ext = mime.includes("webm") ? "webm" : "ogg";
                const voiceFile = new File([blob], `voice-${Date.now()}.${ext}`, { type: mime });
                const fd = new FormData();
                fd.append("attachment", voiceFile);
                sendFormData(fd);
            };

            mr.start();
            setRecording(true);
            setRecordTime(0);
            recordTimerRef.current = setInterval(() => setRecordTime((t) => t + 1), 1000);
        } catch {}
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
        }
        if (recordTimerRef.current) clearInterval(recordTimerRef.current);
        setRecording(false);
        setRecordTime(0);
    };

    const cancelRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.ondataavailable = null;
            mediaRecorderRef.current.onstop = null;
            mediaRecorderRef.current.stop();
        }
        if (recordTimerRef.current) clearInterval(recordTimerRef.current);
        mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        setRecordTime(0);
    };

    const addReaction = async (msgId: number, emoji: string) => {
        setReactionPickerMsgId(null);
        setContextMenu(null);
        setPendingReaction(msgId);
        try {
            const res = await fetch(`${API}/api/messages/${msgId}/reactions`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ emoji }),
            });
            if (res.ok) {
                const updated: Message = await res.json();
                setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, reactions: updated.reactions } : m));
            }
        } catch {}
        setPendingReaction(null);
    };

    const handleContextMenu = (e: React.MouseEvent, msg: Message) => {
        e.preventDefault();
        e.stopPropagation();
        setReactionPickerMsgId(null);
        setContextMenu({ msgId: msg.id, x: e.clientX, y: e.clientY });
    };

    const handleMsgClick = (msg: Message) => {
        if (contextMenu) return;
        if (reactionPickerMsgId === msg.id) {
            setReactionPickerMsgId(null);
        } else {
            setReactionPickerMsgId(msg.id);
            setContextMenu(null);
        }
    };

    const copyText = (text: string) => {
        navigator.clipboard.writeText(text).catch(() => {});
        setContextMenu(null);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const typingText = (() => {
        if (typingUsers.size === 0) return null;
        const names: string[] = [];
        typingUsers.forEach((_, userId) => {
            const p = convInfo?.participants.find((pp) => pp.id === userId);
            names.push(p?.displayName || p?.username || "Кто-то");
        });
        if (names.length === 1) return `${names[0]} печатает...`;
        return `${names.join(", ")} печатают...`;
    })();

    const grouped = (() => {
        const groups: { date: string; messages: Message[] }[] = [];
        let cur = "";
        for (const m of messages) {
            const dk = dateKey(m.createdAt);
            if (dk !== cur) {
                cur = dk;
                groups.push({ date: m.createdAt, messages: [] });
            }
            groups[groups.length - 1].messages.push(m);
        }
        return groups;
    })();

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <span className="text-xs text-gray-500">Загрузка...</span>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="flex-1 flex flex-col h-full relative">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[#3b3b3b] shrink-0 bg-[#1e1e1e]">
                <button
                    onClick={onBack}
                    className="text-gray-500 hover:text-[#FA6814] transition-colors cursor-pointer lg:hidden"
                >
                    ←
                </button>
                <div className="flex-1 min-w-0">
                    <div className="text-sm text-white font-medium truncate">
                        {convInfo?.title || "Чат"}
                        {convInfo?.isGroup && convInfo.participants && (
                            <span className="text-[10px] text-gray-500 ml-2 font-normal">
                                {convInfo.participants.length} уч.
                            </span>
                        )}
                    </div>
                </div>
                {onOpenSettings && (
                    <button
                        onClick={() => onOpenSettings()}
                        className="text-gray-500 hover:text-[#FA6814] transition-colors cursor-pointer p-1"
                        title="Настройки чата"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Messages */}
            <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-4 py-3 space-y-[2px]"
                style={{ background: "#1e1e1e" }}
            >
                {olderLoading && (
                    <div className="flex justify-center py-2">
                        <span className="text-[10px] text-gray-500">Загрузка...</span>
                    </div>
                )}

                {!hasMore && messages.length > 0 && (
                    <div className="flex items-center justify-center py-4">
                        <span className="text-[10px] text-gray-600">Начало беседы</span>
                    </div>
                )}

                {grouped.map((group, gi) => (
                    <div key={gi}>
                        <div className="flex items-center justify-center my-3">
                            <span className="text-[10px] text-gray-500 bg-[#2a2a2a] px-3 py-1 border border-[#3b3b3b]" style={{ borderRadius: 10 }}>
                                {fmtDate(group.date)}
                            </span>
                        </div>
                        {group.messages.map((msg, mi) => {
                            const isMe = msg.senderId === user?.id;
                            const voice = isVoiceMessage(msg.attachmentName);
                            const img = isImageFile(msg.attachmentName);
                            const prevMsg = mi > 0 ? group.messages[mi - 1] : null;
                            const isConsecutive = prevMsg
                                && prevMsg.senderId === msg.senderId
                                && (parseDate(msg.createdAt).getTime() - parseDate(prevMsg.createdAt).getTime()) < 60000;
                            const imageOnly = img && !msg.content && msg.attachmentPath;
                            const textAndImage = img && msg.content && msg.attachmentPath;

                            return (
                                <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"} mb-[2px]`}>
                                    <div
                                        className={`msg-bubble max-w-[75%] px-3 py-2 relative ${
                                            isMe
                                                ? "bg-[#FA6814] text-white"
                                                : "bg-[#2a2a2a] text-gray-200 border border-[#3b3b3b]"
                                        } ${isConsecutive ? "mt-0" : "mt-1"}`}
                                        style={{ borderRadius: 4 }}
                                        onClick={() => handleMsgClick(msg)}
                                        onContextMenu={(e) => handleContextMenu(e, msg)}
                                    >
                                        {/* Sender name for group chats (non-consecutive) */}
                                        {!isMe && convInfo?.isGroup && msg.sender && !isConsecutive && (
                                            <div className="text-[10px] font-medium text-[#FA6814] mb-1">
                                                {msg.sender.displayName || msg.sender.username}
                                            </div>
                                        )}

                                        {/* Text content */}
                                        {msg.content && (
                                            <div className="text-xs whitespace-pre-wrap break-words">{msg.content}</div>
                                        )}

                                        {/* Voice message */}
                                        {voice && msg.attachmentPath && (
                                            <div className="mt-1">
                                                <div className="flex items-center gap-2 bg-[#1e1e1e] border border-[#3b3b3b] px-3 py-2" style={{ borderRadius: 4, minWidth: 200 }}>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FA6814" strokeWidth="2">
                                                        <polygon points="5 3 19 12 5 21 5 3" />
                                                    </svg>
                                                    <audio preload="none" className="flex-1 h-6" style={{ filter: "invert(1) hue-rotate(180deg)", maxWidth: 220 }}>
                                                        <source src={`${API}${msg.attachmentPath}`} />
                                                    </audio>
                                                </div>
                                            </div>
                                        )}

                                        {/* Image: full-width for image-only, inline for text+image */}
                                        {img && msg.attachmentPath && imageOnly && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setLightbox(`${API}${msg.attachmentPath}`); }}
                                                className="block mt-1 cursor-pointer -mx-1 -my-1"
                                            >
                                                <img
                                                    src={`${API}${msg.attachmentPath}`}
                                                    alt={msg.attachmentName ?? ""}
                                                    className="w-full max-h-[300px] object-cover border border-[#3b3b3b]/30 hover:opacity-80 transition-opacity"
                                                    loading="lazy"
                                                />
                                            </button>
                                        )}
                                        {img && msg.attachmentPath && textAndImage && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setLightbox(`${API}${msg.attachmentPath}`); }}
                                                className="block mt-1 cursor-pointer"
                                            >
                                                <img
                                                    src={`${API}${msg.attachmentPath}`}
                                                    alt={msg.attachmentName ?? ""}
                                                    className="max-w-full max-h-[200px] object-cover border border-[#3b3b3b]/30 hover:opacity-80 transition-opacity"
                                                    loading="lazy"
                                                />
                                            </button>
                                        )}

                                        {/* Other files */}
                                        {!voice && !img && msg.attachmentPath && (
                                            <a
                                                href={`${API}${msg.attachmentPath}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 mt-1 px-3 py-2 bg-[#1e1e1e] border border-[#3b3b3b] text-xs text-gray-300 hover:text-[#FA6814] transition-colors"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <span>📄</span>
                                                <span className="truncate">{msg.attachmentName}</span>
                                            </a>
                                        )}

                                        {/* Timestamp + read status */}
                                        <div className={`flex items-center justify-end gap-1 text-[10px] mt-1 ${isMe ? "text-white/70" : "text-gray-500"}`}>
                                            {isMe && <span>✓</span>}
                                            <span>{fmtTime(msg.createdAt)}</span>
                                        </div>

                                        {/* Reaction chips */}
                                        {msg.reactions && msg.reactions.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {msg.reactions.map((r) => {
                                                    const hasReacted = user && r.userIds.includes(user.id);
                                                    return (
                                                        <button
                                                            key={r.emoji}
                                                            onClick={(e) => { e.stopPropagation(); addReaction(msg.id, r.emoji); }}
                                                            className={`flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 border cursor-pointer transition-colors ${
                                                                hasReacted
                                                                    ? "bg-[#FA6814]/20 border-[#FA6814]/50 text-white"
                                                                    : "bg-[#1e1e1e] border-[#3b3b3b] text-gray-400 hover:border-[#FA6814]/30"
                                                            }`}
                                                            style={{ borderRadius: 10 }}
                                                        >
                                                            <span>{r.emoji}</span>
                                                            <span>{r.userIds.length}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Reaction picker */}
                                    {reactionPickerMsgId === msg.id && (
                                        <div
                                            className="absolute z-50 bg-[#252525] border border-[#3b3b3b] px-2 py-1 flex gap-1 shadow-lg"
                                            style={{
                                                borderRadius: 20,
                                                top: -40,
                                                ...(isMe ? { right: 0 } : { left: 0 }),
                                            }}
                                        >
                                            {EMOJI_OPTIONS.map((emoji) => (
                                                <button
                                                    key={emoji}
                                                    onClick={(e) => { e.stopPropagation(); addReaction(msg.id, emoji); }}
                                                    className="text-sm hover:scale-125 transition-transform cursor-pointer px-0.5"
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}

                {/* Typing indicator */}
                {typingText && (
                    <div className="flex justify-start mt-1">
                        <div className="bg-[#2a2a2a] border border-[#3b3b3b] px-3 py-2 text-[10px] text-gray-400 italic" style={{ borderRadius: 4 }}>
                            {typingText}
                            <span className="animate-pulse">|</span>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Scroll to bottom button */}
            {showScrollBtn && (
                <button
                    onClick={scrollToBottom}
                    className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40 bg-[#252525] border border-[#3b3b3b] text-gray-300 text-[10px] px-3 py-1.5 hover:text-[#FA6814] hover:border-[#FA6814]/30 transition-colors cursor-pointer shadow-lg"
                    style={{ borderRadius: 16 }}
                >
                    ↓ Новые сообщения
                </button>
            )}

            {/* File preview bar */}
            {file && (
                <div className="px-4 py-2 border-t border-[#3b3b3b] flex items-center gap-2 shrink-0 bg-[#1e1e1e]">
                    {file.type.startsWith("image/") && (
                        <img src={URL.createObjectURL(file)} alt="" className="w-10 h-10 object-cover border border-[#3b3b3b]" />
                    )}
                    <span className="text-xs text-gray-400 truncate flex-1">{file.name}</span>
                    <button
                        onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                        className="text-xs text-[#D32F2F] hover:text-red-400 cursor-pointer"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Recording indicator */}
            {recording && (
                <div className="px-4 py-3 border-t border-[#D32F2F] bg-[#1e1e1e] flex items-center gap-3 shrink-0">
                    <div className="w-3 h-3 rounded-full bg-[#D32F2F] animate-pulse" />
                    <span className="text-xs text-[#D32F2F] font-medium">Запись {formatRecordTime(recordTime)}</span>
                    <div className="flex-1" />
                    <button
                        onClick={cancelRecording}
                        className="text-xs text-gray-500 hover:text-[#D32F2F] transition-colors cursor-pointer px-2 py-1"
                    >
                        Отмена
                    </button>
                    <button
                        onClick={stopRecording}
                        className="text-xs text-white bg-[#D32F2F] hover:bg-red-600 transition-colors cursor-pointer px-3 py-1"
                        style={{ borderRadius: 4 }}
                    >
                        Готово
                    </button>
                </div>
            )}

            {/* Input area */}
            {!recording && (
                <div className="px-4 py-3 border-t border-[#3b3b3b] shrink-0 bg-[#1e1e1e]">
                    <div className="flex items-end gap-2">
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            accept="image/*,.pdf,.doc,.docx,.txt,.zip,.rar,.7z,.mp3,.mp4,.ogg,.wav,.webm"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="text-gray-500 hover:text-[#FA6814] transition-colors cursor-pointer shrink-0 p-2"
                            title="Прикрепить файл"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                            </svg>
                        </button>
                        <button
                            onClick={startRecording}
                            className="text-gray-500 hover:text-[#D32F2F] transition-colors cursor-pointer shrink-0 p-2"
                            title="Голосовое сообщение"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                                <path d="M19 10v2a7 7 0 01-14 0v-2" />
                                <line x1="12" y1="19" x2="12" y2="23" />
                                <line x1="8" y1="23" x2="16" y2="23" />
                            </svg>
                        </button>
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={handleInput}
                            onKeyDown={handleKeyDown}
                            placeholder="Сообщение..."
                            rows={1}
                            className="flex-1 bg-[#1e1e1e] border border-[#3b3b3b] text-white text-xs px-3 py-2 resize-none focus:outline-none focus:border-[#FA6814] transition-colors"
                            style={{ borderRadius: 4, minHeight: 36, maxHeight: 144, overflow: textareaRef.current && textareaRef.current.scrollHeight > 144 ? "auto" : "hidden" }}
                        />
                        <button
                            onClick={sendMessage}
                            disabled={sending || (!input.trim() && !file)}
                            className="bg-[#FA6814] text-white text-xs px-4 py-2 hover:bg-[#FF7D30] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                            style={{ borderRadius: 4 }}
                        >
                            {sending ? "..." : "→"}
                        </button>
                    </div>
                </div>
            )}

            {/* Context menu */}
            {contextMenu && (
                <div
                    className="msg-context-menu fixed z-50 bg-[#252525] border border-[#3b3b3b] shadow-lg overflow-hidden"
                    style={{
                        left: Math.min(contextMenu.x, window.innerWidth - 200),
                        top: Math.min(contextMenu.y, window.innerHeight - 100),
                        borderRadius: 4,
                    }}
                >
                    {(() => {
                        const msg = messages.find((m) => m.id === contextMenu.msgId);
                        return (
                            <>
                                {msg?.content && (
                                    <button
                                        onClick={() => copyText(msg.content!)}
                                        className="w-full text-left text-xs text-gray-300 hover:bg-[#3b3b3b] px-4 py-2 transition-colors cursor-pointer flex items-center gap-2"
                                    >
                                        <span>📋</span> Копировать текст
                                    </button>
                                )}
                                <button
                                    onClick={() => { setContextMenu(null); setReactionPickerMsgId(contextMenu.msgId); }}
                                    className="w-full text-left text-xs text-gray-300 hover:bg-[#3b3b3b] px-4 py-2 transition-colors cursor-pointer flex items-center gap-2"
                                >
                                    <span>😊</span> Реакция
                                </button>
                            </>
                        );
                    })()}
                </div>
            )}

            {/* Lightbox */}
            {lightbox && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center cursor-pointer"
                    onClick={() => setLightbox(null)}
                >
                    <img src={lightbox} alt="" className="max-w-[90vw] max-h-[90vh] object-contain" />
                    <button
                        onClick={() => setLightbox(null)}
                        className="absolute top-4 right-4 text-white text-2xl hover:text-[#FA6814] transition-colors cursor-pointer w-10 h-10 flex items-center justify-center bg-black/50 rounded-full"
                    >
                        ✕
                    </button>
                </div>
            )}
        </div>
    );
}
