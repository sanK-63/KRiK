import { useState, useEffect, useRef, useCallback } from "react";
import { useUser } from "../../context/UserContext";
import { useSocket } from "../../context/SocketContext";
import { API, PAGE_SIZE, type Message, type ConversationInfo } from "./types";
import { parseDate, fmtDate, dateKey, playNotificationSound } from "./helpers";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";

interface ChatWindowProps {
    conversationId: number;
    onBack: () => void;
    onOpenSettings?: () => void;
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
    const [replyToMsg, setReplyToMsg] = useState<Message | null>(null);
    const [editingMsg, setEditingMsg] = useState<Message | null>(null);
    const [showForwardPicker, setShowForwardPicker] = useState(false);
    const [forwardMsg, setForwardMsg] = useState<Message | null>(null);
    const [conversations, setConversations] = useState<any[]>([]);
    const [convSearchForward, setConvSearchForward] = useState("");
    const [participantsRead, setParticipantsRead] = useState<{ userId: number; lastReadAt: string | null; lastDeliveredAt: string | null }[]>([]);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const scrollHeightBeforeLoadRef = useRef<number>(0);

    useEffect(() => {
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
    }, []);

    useEffect(() => {
        fetch(`${API}/api/messages/conversations/${conversationId}/info`, { credentials: "include" })
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => { if (data) setConvInfo(data); })
            .catch(() => {});
    }, [conversationId]);

    useEffect(() => {
        setLoading(true);
        setMessages([]);
        setHasMore(true);
        setReplyToMsg(null);
        setEditingMsg(null);
        setShowForwardPicker(false);
        setForwardMsg(null);
        setInput("");
        fetch(`${API}/api/messages/conversations/${conversationId}?limit=${PAGE_SIZE}`, { credentials: "include" })
            .then((r) => r.json())
            .then((data) => {
                if (data && data.messages) {
                    setMessages(data.messages);
                    setHasMore(data.messages.length >= PAGE_SIZE);
                    if (data.participants) setParticipantsRead(data.participants);
                } else if (Array.isArray(data)) {
                    setMessages(data);
                    setHasMore(data.length >= PAGE_SIZE);
                } else {
                    setMessages([]);
                    setHasMore(false);
                }
                setLoading(false);
                setTimeout(() => {
                    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
                }, 0);
            })
            .catch(() => setLoading(false));
    }, [conversationId]);

    useEffect(() => {
        fetch(`${API}/api/messages/conversations/${conversationId}/read`, { method: "PATCH", credentials: "include" }).catch(() => {});
    }, [conversationId, messages.length]);

    useEffect(() => {
        fetch(`${API}/api/messages/conversations/${conversationId}/delivered`, { method: "PATCH", credentials: "include" }).catch(() => {});
    }, [conversationId, messages.length]);

    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container) return;
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
        if (isNearBottom) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    useEffect(() => {
        if (!socket) return;
        const handler = (msg: Message) => {
            if (msg.conversationId !== conversationId) {
                if (Notification.permission === "granted" && msg.senderId !== user?.id) {
                    new Notification(msg.sender?.displayName || "Новое сообщение", {
                        body: msg.content || "Файл",
                        icon: msg.sender?.avatar ? msg.sender.avatar : undefined,
                    });
                }
                return;
            }
            if (msg.senderId !== user?.id) playNotificationSound();
            setMessages((prev) => {
                if (prev.some((m) => m.id === msg.id)) return prev;
                return [...prev, msg];
            });
        };
        socket.on("message:new", handler);
        return () => { socket.off("message:new", handler); };
    }, [socket, conversationId, user?.id]);

    useEffect(() => {
        if (!socket) return;
        const handler = (data: { conversationId: number; userId: number; username: string }) => {
            if (data.conversationId !== conversationId || data.userId === user?.id) return;
            setTypingUsers((prev) => {
                const next = new Map(prev);
                const existing = next.get(data.userId);
                if (existing) clearTimeout(existing);
                const timeout = setTimeout(() => {
                    setTypingUsers((p) => { const n = new Map(p); n.delete(data.userId); return n; });
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

    useEffect(() => {
        if (!socket) return;
        const handler = (data: { conversationId: number; userId: number }) => {
            if (data.conversationId !== conversationId) return;
            setParticipantsRead((prev) =>
                prev.map((p) => p.userId === data.userId ? { ...p, lastReadAt: new Date().toISOString() } : p)
            );
        };
        socket.on("conversation:read", handler);
        return () => { socket.off("conversation:read", handler); };
    }, [socket, conversationId]);

    useEffect(() => {
        if (!socket) return;
        const handler = (data: { conversationId: number; userId: number }) => {
            if (data.conversationId !== conversationId) return;
            setParticipantsRead((prev) =>
                prev.map((p) => p.userId === data.userId ? { ...p, lastDeliveredAt: new Date().toISOString() } : p)
            );
        };
        socket.on("conversation:delivered", handler);
        return () => { socket.off("conversation:delivered", handler); };
    }, [socket, conversationId]);

    const loadOlder = useCallback(async () => {
        if (olderLoading || !hasMore || messages.length === 0) return;
        setOlderLoading(true);
        scrollHeightBeforeLoadRef.current = messagesContainerRef.current?.scrollHeight ?? 0;
        const oldestId = messages[0].id;
        try {
            const res = await fetch(`${API}/api/messages/conversations/${conversationId}?before=${oldestId}&limit=${PAGE_SIZE}`, { credentials: "include" });
            const data = await res.json();
            if (data.length < PAGE_SIZE) setHasMore(false);
            setMessages((prev) => [...data, ...prev]);
        } catch {}
        setOlderLoading(false);
    }, [olderLoading, hasMore, messages, conversationId]);

    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container || olderLoading) return;
        const prevScrollHeight = scrollHeightBeforeLoadRef.current;
        if (prevScrollHeight > 0) {
            container.scrollTop = container.scrollHeight - prevScrollHeight;
            scrollHeightBeforeLoadRef.current = 0;
        }
    }, [messages, olderLoading]);

    const handleScroll = useCallback(() => {
        const container = messagesContainerRef.current;
        if (!container) return;
        const { scrollTop, scrollHeight, clientHeight } = container;
        setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 300);
        if (scrollTop < 80 && hasMore && !olderLoading) loadOlder();
    }, [hasMore, olderLoading, loadOlder]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setLightbox(null);
                setContextMenu(null);
                setReactionPickerMsgId(null);
                setReplyToMsg(null);
                setEditingMsg(null);
                setShowForwardPicker(false);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

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
                method: "POST", credentials: "include", body: formData,
            });
            if (res.ok) {
                const msg = await res.json();
                setMessages((prev) => {
                    if (prev.some((m) => m.id === msg.id)) return prev;
                    return [...prev, msg];
                });
                setInput("");
                setFile(null);
                setReplyToMsg(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
                setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
            }
        } catch {}
        setSending(false);
    }, [conversationId]);

    const sendMessage = async () => {
        if ((!input.trim() && !file && !editingMsg) || sending) return;
        if (editingMsg) {
            try {
                const res = await fetch(`${API}/api/messages/conversations/${conversationId}/messages/${editingMsg.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ content: input.trim() }),
                });
                if (res.ok) {
                    setMessages((prev) => prev.map(m => m.id === editingMsg.id ? { ...m, content: input.trim(), editedAt: new Date().toISOString() } : m));
                    setEditingMsg(null);
                    setInput("");
                }
            } catch {}
            return;
        }
        const fd = new FormData();
        if (input.trim()) fd.append("content", input.trim());
        if (file) fd.append("attachment", file);
        if (replyToMsg) fd.append("replyToId", String(replyToMsg.id));
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
            socket.emit("conversation:typing", { conversationId, userId: user.id, username: user.username });
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
                ? "audio/webm;codecs=opus"
                : MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/ogg";
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
                if (replyToMsg) fd.append("replyToId", String(replyToMsg.id));
                sendFormData(fd);
            };
            mr.start();
            setRecording(true);
            setRecordTime(0);
            recordTimerRef.current = setInterval(() => setRecordTime((t) => t + 1), 1000);
        } catch {}
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") mediaRecorderRef.current.stop();
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
        try {
            const res = await fetch(`${API}/api/messages/${msgId}/reactions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ emoji }),
            });
            if (res.ok) {
                const updated: Message = await res.json();
                setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, reactions: updated.reactions } : m));
            }
        } catch {}
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

    const forwardToConversation = async (targetConvId: number) => {
        if (!forwardMsg) return;
        try {
            const res = await fetch(`${API}/api/messages/conversations/${targetConvId}/forward`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ messageId: forwardMsg.id }),
            });
            if (res.ok) { setShowForwardPicker(false); setForwardMsg(null); }
        } catch {}
    };

    const openForwardPicker = async (msg: Message) => {
        setContextMenu(null);
        setForwardMsg(msg);
        setShowForwardPicker(true);
        try {
            const res = await fetch(`${API}/api/messages/conversations`, { credentials: "include" });
            if (res.ok) { const data = await res.json(); setConversations(data); }
        } catch {}
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
            if (dk !== cur) { cur = dk; groups.push({ date: m.createdAt, messages: [] }); }
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
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[#3b3b3b] shrink-0 bg-[#1e1e1e]">
                <button onClick={onBack} className="text-gray-500 hover:text-[#FA6814] transition-colors cursor-pointer lg:hidden">←</button>
                <div className="flex-1 min-w-0">
                    <div className="text-sm text-white font-medium truncate">
                        {convInfo?.title || "Чат"}
                        {convInfo?.isGroup && convInfo.participants && (
                            <span className="text-[10px] text-gray-500 ml-2 font-normal">{convInfo.participants.length} уч.</span>
                        )}
                    </div>
                </div>
                {onOpenSettings && (
                    <button onClick={() => onOpenSettings()} className="text-gray-500 hover:text-[#FA6814] transition-colors cursor-pointer p-1" title="Настройки чата">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
                        </svg>
                    </button>
                )}
            </div>

            <div ref={messagesContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-3 space-y-[2px]" style={{ background: "#1e1e1e" }}>
                {olderLoading && <div className="flex justify-center py-2"><span className="text-[10px] text-gray-500">Загрузка...</span></div>}
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
                            const prevMsg = mi > 0 ? group.messages[mi - 1] : null;
                            const isConsecutive = prevMsg
                                && prevMsg.senderId === msg.senderId
                                && (parseDate(msg.createdAt).getTime() - parseDate(prevMsg.createdAt).getTime()) < 60000;
                            return (
                                <MessageBubble
                                    key={msg.id}
                                    msg={msg}
                                    isMe={isMe}
                                    isConsecutive={!!isConsecutive}
                                    convInfo={convInfo}
                                    participantsRead={participantsRead}
                                    onReply={setReplyToMsg}
                                    onEdit={(m) => { setEditingMsg(m); setInput(m.content || ""); }}
                                    onForward={openForwardPicker}
                                    onCopy={copyText}
                                    onReact={addReaction}
                                    onLightbox={setLightbox}
                                    onContextMenu={handleContextMenu}
                                    onMsgClick={handleMsgClick}
                                    reactionPickerMsgId={reactionPickerMsgId}
                                    contextMenuMsgId={contextMenu?.msgId ?? null}
                                />
                            );
                        })}
                    </div>
                ))}
                {typingText && (
                    <div className="flex justify-start mt-1">
                        <div className="bg-[#2a2a2a] border border-[#3b3b3b] px-3 py-2 text-[10px] text-gray-400 italic" style={{ borderRadius: 4 }}>
                            {typingText}<span className="animate-pulse">|</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
                {showScrollBtn && (
                    <div className="sticky bottom-0 left-0 right-0 z-40 flex justify-center py-2 pointer-events-none">
                        <button
                            onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })}
                            className="pointer-events-auto bg-[#252525] border border-[#3b3b3b] text-gray-300 text-[10px] px-3 py-1.5 hover:text-[#FA6814] hover:border-[#FA6814]/30 transition-colors cursor-pointer shadow-lg"
                            style={{ borderRadius: 16 }}
                        >
                            ↓ Новые сообщения
                        </button>
                    </div>
                )}
            </div>

            {file && (
                <div className="px-4 py-2 border-t border-[#3b3b3b] flex items-center gap-2 shrink-0 bg-[#1e1e1e]">
                    {file.type.startsWith("image/") && (
                        <img src={URL.createObjectURL(file)} alt="" className="w-10 h-10 object-cover border border-[#3b3b3b]" />
                    )}
                    <span className="text-xs text-gray-400 truncate flex-1">{file.name}</span>
                    <button onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="text-xs text-[#D32F2F] hover:text-red-400 cursor-pointer">✕</button>
                </div>
            )}

            {replyToMsg && (
                <div className="px-4 py-2 border-t border-[#3b3b3b] flex items-center gap-2 bg-[#252525] shrink-0">
                    <div className="w-0.5 h-8 bg-[#FA6814] shrink-0" />
                    <div className="flex-1 min-w-0">
                        <div className="text-[10px] text-[#FA6814] font-medium">
                            {replyToMsg.sender?.displayName || replyToMsg.sender?.username || "Сообщение"}
                        </div>
                        <div className="text-[11px] text-gray-400 truncate">
                            {replyToMsg.content || (replyToMsg.attachmentName ? "📎 Файл" : "...")}
                        </div>
                    </div>
                    <button onClick={() => setReplyToMsg(null)} className="text-gray-500 hover:text-white cursor-pointer text-xs">✕</button>
                </div>
            )}

            {editingMsg && (
                <div className="px-4 py-2 border-t border-[#3b3b3b] flex items-center gap-2 bg-[#252525] shrink-0">
                    <div className="w-0.5 h-8 bg-[#FFB020] shrink-0" />
                    <div className="flex-1 min-w-0">
                        <div className="text-[10px] text-[#FFB020] font-medium">Редактирование</div>
                        <div className="text-[11px] text-gray-400 truncate">{editingMsg.content}</div>
                    </div>
                    <button onClick={() => { setEditingMsg(null); setInput(""); }} className="text-gray-500 hover:text-white cursor-pointer text-xs">✕</button>
                </div>
            )}

            <ChatInput
                input={input}
                setInput={setInput}
                file={file}
                setFile={setFile}
                sending={sending}
                recording={recording}
                recordTime={recordTime}
                canSend={!!(input.trim() || file) && !editingMsg}
                onSend={sendMessage}
                onKeyDown={handleKeyDown}
                onInput={handleInput}
                onStartRecording={startRecording}
                onStopRecording={stopRecording}
                onCancelRecording={cancelRecording}
            />

            {contextMenu && (
                <div
                    className="msg-context-menu fixed z-50 bg-[#252525] border border-[#3b3b3b] shadow-lg overflow-hidden"
                    style={{ left: Math.min(contextMenu.x, window.innerWidth - 200), top: Math.min(contextMenu.y, window.innerHeight - 100), borderRadius: 4 }}
                >
                    {(() => {
                        const msg = messages.find((m) => m.id === contextMenu.msgId);
                        return (
                            <>
                                {msg?.content && (
                                    <button onClick={() => copyText(msg.content!)} className="w-full text-left text-xs text-gray-300 hover:bg-[#3b3b3b] px-4 py-2 transition-colors cursor-pointer flex items-center gap-2">
                                        Копировать текст
                                    </button>
                                )}
                                <button onClick={() => { setContextMenu(null); setReactionPickerMsgId(contextMenu.msgId); }} className="w-full text-left text-xs text-gray-300 hover:bg-[#3b3b3b] px-4 py-2 transition-colors cursor-pointer flex items-center gap-2">
                                    Реакция
                                </button>
                                {msg?.content && (
                                    <button onClick={() => { setContextMenu(null); setReplyToMsg(msg); }} className="w-full text-left text-xs text-gray-300 hover:bg-[#3b3b3b] px-4 py-2 transition-colors cursor-pointer flex items-center gap-2">
                                        <span>↩</span> Ответить
                                    </button>
                                )}
                                {msg?.content && msg.senderId === user?.id && (
                                    <button onClick={() => { setContextMenu(null); setEditingMsg(msg); setInput(msg.content || ""); }} className="w-full text-left text-xs text-gray-300 hover:bg-[#3b3b3b] px-4 py-2 transition-colors cursor-pointer flex items-center gap-2">
                                        <span>✎</span> Редактировать
                                    </button>
                                )}
                                <button onClick={() => { if (msg) openForwardPicker(msg); }} className="w-full text-left text-xs text-gray-300 hover:bg-[#3b3b3b] px-4 py-2 transition-colors cursor-pointer flex items-center gap-2">
                                    <span>↪</span> Переслать
                                </button>
                            </>
                        );
                    })()}
                </div>
            )}

            {showForwardPicker && forwardMsg && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
                    <div className="bg-[#252525] border border-[#3b3b3b] w-full max-w-sm mx-4" style={{ borderRadius: 8 }}>
                        <div className="px-4 py-3 border-b border-[#3b3b3b] flex items-center justify-between">
                            <h3 className="text-sm font-bold text-white">Переслать сообщение</h3>
                            <button onClick={() => { setShowForwardPicker(false); setForwardMsg(null); }} className="text-gray-500 hover:text-white cursor-pointer text-sm">✕</button>
                        </div>
                        <div className="px-4 py-2 border-b border-[#3b3b3b]">
                            <input type="text" value={convSearchForward} onChange={(e) => setConvSearchForward(e.target.value)} placeholder="Найти чат..." className="w-full bg-[#1e1e1e] border border-[#3b3b3b] text-white text-xs px-3 py-2 focus:outline-none focus:border-[#FA6814]" style={{ borderRadius: 4 }} autoFocus />
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                            {conversations
                                .filter((c: any) => c.id !== conversationId)
                                .filter((c: any) => {
                                    if (!convSearchForward) return true;
                                    const name = c.title || (c.otherUser?.displayName || c.otherUser?.username) || "";
                                    return name.toLowerCase().includes(convSearchForward.toLowerCase());
                                })
                                .map((c: any) => (
                                    <button key={c.id} onClick={() => forwardToConversation(c.id)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#2a2a2a] transition-colors cursor-pointer text-left border-b border-[#2a2a2a]">
                                        <div className="w-8 h-8 bg-[#333] border border-[#3b3b3b] flex items-center justify-center text-xs text-[#FA6814] font-bold shrink-0">
                                            {c.isGroup ? "👥" : (c.otherUser?.displayName?.[0] || c.otherUser?.username?.[0] || "?").toUpperCase()}
                                        </div>
                                        <span className="text-xs text-white truncate">
                                            {c.title || c.otherUser?.displayName || c.otherUser?.username || "Чат"}
                                        </span>
                                    </button>
                                ))}
                        </div>
                    </div>
                </div>
            )}

            {lightbox && (
                <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center cursor-pointer" onClick={() => setLightbox(null)}>
                    <img src={lightbox} alt="" className="max-w-[90vw] max-h-[90vh] object-contain" />
                    <button onClick={() => setLightbox(null)} className="absolute top-4 right-4 text-white text-2xl hover:text-[#FA6814] transition-colors cursor-pointer w-10 h-10 flex items-center justify-center bg-black/50 rounded-full">✕</button>
                </div>
            )}
        </div>
    );
}
