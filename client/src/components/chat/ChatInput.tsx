import { useRef, useCallback } from "react";
import { formatRecordTime } from "./helpers";

interface ChatInputProps {
    input: string;
    setInput: (v: string) => void;
    file: File | null;
    setFile: (f: File | null) => void;
    sending: boolean;
    recording: boolean;
    recordTime: number;
    canSend: boolean;
    onSend: () => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
    onInput: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onStartRecording: () => void;
    onStopRecording: () => void;
    onCancelRecording: () => void;
}

export default function ChatInput({
    input, setInput: _setInput, file: _file, setFile, sending, recording, recordTime,
    canSend, onSend, onKeyDown, onInput,
    onStartRecording, onStopRecording, onCancelRecording,
}: ChatInputProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const autoResize = useCallback(() => {
        const ta = textareaRef.current;
        if (!ta) return;
        ta.style.height = "auto";
        const maxH = 6 * 24;
        ta.style.height = Math.min(ta.scrollHeight, maxH) + "px";
    }, []);

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onInput(e);
        requestAnimationFrame(autoResize);
    };

    if (recording) {
        return (
            <div className="px-4 py-3 border-t border-[#D32F2F] bg-[#1e1e1e] flex items-center gap-3 shrink-0">
                <div className="w-3 h-3 rounded-full bg-[#D32F2F] animate-pulse" />
                <span className="text-xs text-[#D32F2F] font-medium">Запись {formatRecordTime(recordTime)}</span>
                <div className="flex-1" />
                <button
                    onClick={onCancelRecording}
                    className="text-xs text-gray-500 hover:text-[#D32F2F] transition-colors cursor-pointer px-2 py-1"
                >
                    Отмена
                </button>
                <button
                    onClick={onStopRecording}
                    className="text-xs text-white bg-[#D32F2F] hover:bg-red-600 transition-colors cursor-pointer px-3 py-1"
                    style={{ borderRadius: 4 }}
                >
                    Готово
                </button>
            </div>
        );
    }

    return (
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
                    onClick={onStartRecording}
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
                    onKeyDown={onKeyDown}
                    placeholder="Сообщение..."
                    rows={1}
                    className="flex-1 bg-[#1e1e1e] border border-[#3b3b3b] text-white text-xs px-3 py-2 resize-none focus:outline-none focus:border-[#FA6814] transition-colors"
                    style={{ borderRadius: 4, minHeight: 36, maxHeight: 144, overflow: "hidden" }}
                />
                <button
                    onClick={onSend}
                    disabled={sending || !canSend}
                    className="bg-[#FA6814] text-white text-xs px-4 py-2 hover:bg-[#FF7D30] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                    style={{ borderRadius: 4 }}
                >
                    {sending ? "..." : "→"}
                </button>
            </div>
        </div>
    );
}
