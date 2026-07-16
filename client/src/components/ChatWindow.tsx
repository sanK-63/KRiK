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
}

interface ChatWindowProps {
    conversationId: number;
    onBack: () => void;
}

const API = import.meta.env.VITE_API_URL;

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
    return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
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
    return /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(name);
}

export default function ChatWindow({ conversationId, onBack }: ChatWindowProps) {
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
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setLightbox(null); };
        if (lightbox) window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [lightbox]);

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
                setMessages((prev) => [...prev, msg]);
                setInput("");
                setFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
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
                const file = new File([blob], `voice-${Date.now()}.${ext}`, { type: mime });
                const fd = new FormData();
                fd.append("attachment", file);
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

    const formatRecordTime = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

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
        <div className="flex-1 flex flex-col h-full relative">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[#3b3b3b] shrink-0">
                <button onClick={onBack} className="text-gray-500 hover:text-[#FA6814] transition-colors cursor-pointer lg:hidden">
                    ←
                </button>
                <div className="flex-1 min-w-0">
                    <div className="text-sm text-white font-medium truncate">Чат</div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {grouped.map((group, gi) => (
                    <div key={gi}>
                        <div className="flex items-center justify-center my-3">
                            <span className="text-[10px] text-gray-500 bg-[#2a2a2a] px-3 py-1 border border-[#3b3b3b]">
                                {fmtDate(group.date)}
                            </span>
                        </div>
                        {group.messages.map((msg) => {
                            const isMe = msg.senderId === user?.id;
                            const voice = isVoiceMessage(msg.attachmentName);
                            const img = isImageFile(msg.attachmentName);
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

                                        {/* Voice message */}
                                        {voice && msg.attachmentPath && (
                                            <div className="mt-1">
                                                <audio controls preload="none" className="w-full h-8" style={{ maxWidth: 260, filter: "invert(1) hue-rotate(180deg)" }}>
                                                    <source src={`${API}${msg.attachmentPath}`} />
                                                </audio>
                                            </div>
                                        )}

                                        {/* Image preview */}
                                        {img && msg.attachmentPath && (
                                            <button
                                                onClick={() => setLightbox(`${API}${msg.attachmentPath}`)}
                                                className="block mt-1 cursor-pointer"
                                            >
                                                <img
                                                    src={`${API}${msg.attachmentPath}`}
                                                    alt={msg.attachmentName ?? ""}
                                                    className="max-w-[280px] max-h-[200px] object-cover border border-[#3b3b3b] hover:opacity-80 transition-opacity"
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
                                            >
                                                <span>📄</span>
                                                <span className="truncate">{msg.attachmentName}</span>
                                            </a>
                                        )}

                                        <div className={`text-[9px] mt-1 ${isMe ? "text-white/70" : "text-gray-500"}`}>
                                            {fmtTime(msg.createdAt)}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* File preview */}
            {file && (
                <div className="px-4 py-2 border-t border-[#3b3b3b] flex items-center gap-2 shrink-0">
                    {file.type.startsWith("image/") && (
                        <img src={URL.createObjectURL(file)} alt="" className="w-10 h-10 object-cover border border-[#3b3b3b]" />
                    )}
                    <span className="text-xs text-gray-400 truncate flex-1">{file.name}</span>
                    <button onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="text-xs text-[#D32F2F] hover:text-red-400 cursor-pointer">
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

            {/* Input */}
            {!recording && (
                <div className="px-4 py-3 border-t border-[#3b3b3b] shrink-0">
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
            )}

            {/* Lightbox */}
            {lightbox && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center cursor-pointer"
                    onClick={() => setLightbox(null)}
                >
                    <img src={lightbox} alt="" className="max-w-[90vw] max-h-[90vh] object-contain" />
                    <button
                        onClick={() => setLightbox(null)}
                        className="absolute top-4 right-4 text-white text-2xl hover:text-[#FA6814] transition-colors cursor-pointer"
                    >
                        ✕
                    </button>
                </div>
            )}
        </div>
    );
}
