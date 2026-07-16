import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import {
    getBotReply,
    getGreeting,
    loadHistory,
    saveHistory,
    hasGreeted,
    markGreeted,
    type ChatMessage,
} from "./chatBot";

export default function ChatAssistant() {
    const { user } = useUser();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [bouncing, setBouncing] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const userName = user?.displayName || user?.username || "Рыцарь";

    useEffect(() => {
        const saved = loadHistory();
        if (saved.length > 0) {
            setMessages(saved);
        }
    }, []);

    useEffect(() => {
        if (open && messages.length === 0 && !hasGreeted()) {
            const greeting = getGreeting(userName);
            setMessages([greeting]);
            markGreeted();
            saveHistory([greeting]);
        }
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [open]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const toggleOpen = () => {
        if (!open) {
            setBouncing(true);
            setTimeout(() => setBouncing(false), 500);
        }
        setOpen(!open);
    };

    const send = (text?: string) => {
        const msg = (text || input).trim();
        if (!msg) return;

        const userMsg: ChatMessage = {
            id: crypto.randomUUID(),
            sender: "user",
            text: msg,
            timestamp: Date.now(),
        };

        const reply = getBotReply(msg, userName);
        const botMsg: ChatMessage = {
            id: crypto.randomUUID(),
            sender: "bot",
            text: reply.text,
            buttons: reply.buttons,
            timestamp: Date.now() + 1,
        };

        const updated = [...messages, userMsg, botMsg];
        setMessages(updated);
        saveHistory(updated);
        setInput("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
        }
    };

    const go = (url: string) => {
        navigate(url);
        setOpen(false);
    };

    return (
        <>
            {/* Knight button */}
            <button
                onClick={toggleOpen}
                className="fixed z-50 transition-transform duration-200 cursor-pointer"
                style={{
                    bottom: 20,
                    right: 20,
                    width: 80,
                    height: 80,
                    transform: bouncing ? "translateY(-12px)" : "translateY(0)",
                }}
                title="Помощник"
            >
                <img
                    src="/Рыцарь.png"
                    alt="Помощник"
                    className="w-full h-full object-contain drop-shadow-lg hover:brightness-110 transition-all duration-200"
                    style={{
                        imageRendering: "pixelated",
                        animation: bouncing ? "knightBounce 0.5s ease" : undefined,
                    }}
                />
                {!open && (
                    <span
                        className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-[10px] font-bold"
                        style={{ background: "#4CAF50", color: "white" }}
                    >
                        ?
                    </span>
                )}
            </button>

            {/* Chat window */}
            {open && (
                <div
                    className="fixed z-50 flex flex-col overflow-hidden"
                    style={{
                        bottom: 110,
                        right: 20,
                        width: 380,
                        maxHeight: 550,
                        background: "#1a1a1a",
                        border: "2px solid #FA6814",
                        boxShadow: "0 0 30px rgba(250,104,20,0.15)",
                        animation: "chatSlideIn 0.25s ease-out",
                    }}
                >
                    {/* Header */}
                    <div
                        className="flex items-center gap-3 px-4 py-3 shrink-0"
                        style={{ background: "#222", borderBottom: "2px solid #FA6814" }}
                    >
                        <img
                            src="/Рыцарь.png"
                            alt=""
                            className="w-8 h-8"
                            style={{ imageRendering: "pixelated" }}
                        />
                        <span
                            className="text-[10px] font-bold flex-1"
                            style={{ color: "#FA6814", fontFamily: '"Press Start 2P", system-ui' }}
                        >
                            Помощник
                        </span>
                        <button
                            onClick={() => setOpen(false)}
                            className="text-gray-500 hover:text-white text-lg cursor-pointer"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Messages */}
                    <div
                        className="flex-1 overflow-y-auto p-4 space-y-4"
                        style={{
                            background: "#1a1a1a",
                            scrollbarWidth: "thin",
                            scrollbarColor: "#3a3a3a #1a1a1a",
                        }}
                    >
                        {messages.map((msg) => (
                            <div key={msg.id}>
                                {msg.sender === "bot" ? (
                                    <div className="flex gap-2.5 items-start">
                                        <img
                                            src="/Рыцарь.png"
                                            alt=""
                                            className="w-7 h-7 shrink-0 mt-0.5"
                                            style={{ imageRendering: "pixelated" }}
                                        />
                                        <div className="flex flex-col gap-2 max-w-[280px]">
                                            <div
                                                className="px-3 py-2.5 text-[13px] leading-relaxed"
                                                style={{
                                                    background: "#222",
                                                    border: "1px solid #3a3a3a",
                                                    color: "#e0e0e0",
                                                    whiteSpace: "pre-line",
                                                }}
                                            >
                                                {msg.text}
                                            </div>
                                            {msg.buttons && msg.buttons.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {msg.buttons.map((btn) => (
                                                        <button
                                                            key={btn.url}
                                                            onClick={() => go(btn.url)}
                                                            className="text-[11px] px-2.5 py-1.5 font-medium cursor-pointer transition-colors"
                                                            style={{
                                                                background: "#2a2a2a",
                                                                border: "1px solid #FA6814",
                                                                color: "#FA6814",
                                                                fontFamily: '"Press Start 2P", system-ui',
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.background = "#FA6814";
                                                                e.currentTarget.style.color = "white";
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.background = "#2a2a2a";
                                                                e.currentTarget.style.color = "#FA6814";
                                                            }}
                                                        >
                                                            {btn.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex justify-end">
                                        <div
                                            className="px-3 py-2.5 text-[13px] leading-relaxed max-w-[280px]"
                                            style={{
                                                background: "#FA6814",
                                                color: "white",
                                                whiteSpace: "pre-line",
                                            }}
                                        >
                                            {msg.text}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div
                        className="flex items-center gap-2 px-3 py-3 shrink-0"
                        style={{ background: "#222", borderTop: "2px solid #FA6814" }}
                    >
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Спроси рыцаря..."
                            className="flex-1 bg-[#1a1a1a] border border-[#3a3a3a] text-sm text-gray-200 px-3 py-2 outline-none focus:border-[#FA6814] transition-colors"
                            style={{ fontSize: 13 }}
                        />
                        <button
                            onClick={() => send()}
                            disabled={!input.trim()}
                            className="w-9 h-9 flex items-center justify-center shrink-0 cursor-pointer transition-colors disabled:opacity-30"
                            style={{
                                background: input.trim() ? "#FA6814" : "#3a3a3a",
                                color: "white",
                                fontSize: 16,
                            }}
                        >
                            ➤
                        </button>
                    </div>
                </div>
            )}

            {/* Keyframes */}
            <style>{`
                @keyframes knightBounce {
                    0%, 100% { transform: translateY(0); }
                    40% { transform: translateY(-14px); }
                    60% { transform: translateY(-6px); }
                }
                @keyframes chatSlideIn {
                    from { opacity: 0; transform: translateY(10px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </>
    );
}
