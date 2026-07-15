import { useState, useEffect, useRef } from "react";
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
}

interface ChatWindowProps {
    conversationId: number;
    onBack: () => void;
}

const API = import.meta.env.VITE_API_URL;

export default function ChatWindow({ conversationId, onBack }: ChatWindowProps) {
    const { user } = useUser();
    const socket = useSocket();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    useEffect(() => {
        setLoading(true);
        fetch(`${API}/api/messages/conversations/${conversationId}`, { headers })
            .then((r) => r.json())
            .then((data) => { setMessages(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, [conversationId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        fetch(`${API}/api/messages/conversations/${conversationId}/read`, {
            method: "PATCH",
            headers,
        }).catch(() => {});
    }, [conversationId, messages.length]);

    useEffect(() => {
        if (!socket) return;
        const handler = (msg: Message) => {
            if (msg.conversationId === conversationId) {
                setMessages((prev) => [...prev, msg]);
            }
        };
        socket.on("message:new", handler);
        return () => { socket.off("message:new", handler); };
    }, [socket, conversationId]);

    const sendMessage = async () => {
        if ((!input.trim() && !file) || sending) return;
        setSending(true);

        const formData = new FormData();
        if (input.trim()) formData.append("content", input.trim());
        if (file) formData.append("attachment", file);

        try {
            const res = await fetch(`${API}/api/messages/conversations/${conversationId}/send`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            if (res.ok) {
                const msg = await res.json();
                setMessages((prev) => [...prev, msg]);
                setInput("");
                setFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
            }
        } catch {}
        setSending(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const formatTime = (dateStr: string) => {
        const d = new Date(dateStr.replace(" ", "T"));
        return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr.replace(" ", "T"));
        const today = new Date();
        if (d.toDateString() === today.toDateString()) return "Сегодня";
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        if (d.toDateString() === yesterday.toDateString()) return "Вчера";
        return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
    };

    const groupMessagesByDate = (msgs: Message[]) => {
        const groups: { date: string; messages: Message[] }[] = [];
        let current = "";
        for (const m of msgs) {
            const dateKey = new Date(m.createdAt.replace(" ", "T")).toDateString();
            if (dateKey !== current) {
                current = dateKey;
                groups.push({ date: m.createdAt, messages: [] });
            }
            groups[groups.length - 1].messages.push(m);
        }
        return groups;
    };

    const renderAttachment = (msg: Message) => {
        if (!msg.attachmentPath) return null;
        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(msg.attachmentName || "");
        if (isImage) {
            return (
                <a href={`${API}${msg.attachmentPath}`} target="_blank" rel="noopener noreferrer" className="block mt-1">
                    <img src={`${API}${msg.attachmentPath}`} alt={msg.attachmentName} className="max-w-[280px] max-h-[200px] object-cover border border-[#3b3b3b]" />
                </a>
            );
        }
        return (
            <a
                href={`${API}${msg.attachmentPath}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 mt-1 px-3 py-2 bg-[#1e1e1e] border border-[#3b3b3b] text-xs text-gray-300 hover:text-[#FA6814] transition-colors"
            >
                <span>📄</span>
                <span className="truncate">{msg.attachmentName}</span>
            </a>
        );
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <span className="text-xs text-gray-500">Загрузка...</span>
            </div>
        );
    }

    const grouped = groupMessagesByDate(messages);

    return (
        <div className="flex-1 flex flex-col h-full">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[#3b3b3b] shrink-0">
                <button onClick={onBack} className="text-gray-500 hover:text-[#FA6814] transition-colors cursor-pointer lg:hidden">
                    ←
                </button>
                <div className="flex-1 min-w-0">
                    <div className="text-sm text-white font-medium truncate">Чат</div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {grouped.map((group, gi) => (
                    <div key={gi}>
                        <div className="flex items-center justify-center my-3">
                            <span className="text-[10px] text-gray-500 bg-[#2a2a2a] px-3 py-1 border border-[#3b3b3b]">
                                {formatDate(group.date)}
                            </span>
                        </div>
                        {group.messages.map((msg) => {
                            const isMe = msg.senderId === user?.id;
                            return (
                                <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"} mb-1`}>
                                    <div
                                        className={`max-w-[75%] px-3 py-2 ${
                                            isMe
                                                ? "bg-[#FA6814] text-white"
                                                : "bg-[#2a2a2a] text-gray-200 border border-[#3b3b3b]"
                                        }`}
                                        style={{ borderRadius: 4 }}
                                    >
                                        {!isMe && msg.sender && (
                                            <div className="text-[10px] font-medium text-[#FA6814] mb-1">
                                                {msg.sender.displayName || msg.sender.username}
                                            </div>
                                        )}
                                        {msg.content && (
                                            <div className="text-xs whitespace-pre-wrap break-words">{msg.content}</div>
                                        )}
                                        {renderAttachment(msg)}
                                        <div className={`text-[9px] mt-1 ${isMe ? "text-white/70" : "text-gray-500"}`}>
                                            {formatTime(msg.createdAt)}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {file && (
                <div className="px-4 py-2 border-t border-[#3b3b3b] flex items-center gap-2 shrink-0">
                    <span className="text-xs text-gray-400 truncate flex-1">{file.name}</span>
                    <button onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="text-xs text-[#D32F2F] hover:text-red-400 cursor-pointer">
                        ✕
                    </button>
                </div>
            )}

            <div className="px-4 py-3 border-t border-[#3b3b3b] shrink-0">
                <div className="flex items-end gap-2">
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
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
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Сообщение..."
                        rows={1}
                        className="flex-1 bg-[#1e1e1e] border border-[#3b3b3b] text-white text-xs px-3 py-2 resize-none focus:outline-none focus:border-[#FA6814] transition-colors"
                        style={{ borderRadius: 4, minHeight: 36, maxHeight: 120 }}
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
        </div>
    );
}
