import { useUser } from "../../context/UserContext";
import { API, EMOJI_OPTIONS, type Message, type ConversationInfo } from "./types";
import { parseDate, fmtTime, fmtFullDate, isVoiceMessage, isImageFile } from "./helpers";

interface MessageBubbleProps {
    msg: Message;
    isMe: boolean;
    isConsecutive: boolean;
    convInfo: ConversationInfo | null;
    participantsRead: { userId: number; lastReadAt: string | null; lastDeliveredAt: string | null }[];
    onReply: (msg: Message) => void;
    onEdit: (msg: Message) => void;
    onForward: (msg: Message) => void;
    onCopy: (text: string) => void;
    onReact: (msgId: number, emoji: string) => void;
    onLightbox: (url: string) => void;
    onContextMenu: (e: React.MouseEvent, msg: Message) => void;
    onMsgClick: (msg: Message) => void;
    reactionPickerMsgId: number | null;
    contextMenuMsgId: number | null;
}

export default function MessageBubble({
    msg, isMe, isConsecutive, convInfo, participantsRead,
    onReply: _onReply, onEdit: _onEdit, onForward: _onForward, onCopy: _onCopy, onReact, onLightbox,
    onContextMenu, onMsgClick, reactionPickerMsgId, contextMenuMsgId: _contextMenuMsgId,
}: MessageBubbleProps) {
    const { user } = useUser();
    const voice = isVoiceMessage(msg.attachmentName);
    const img = isImageFile(msg.attachmentName);
    const imageOnly = img && !msg.content && msg.attachmentPath;
    const textAndImage = img && msg.content && msg.attachmentPath;

    const msgTime = parseDate(msg.createdAt).getTime();
    const anyRead = participantsRead.some(
        (p) => p.userId !== user?.id && p.lastReadAt && parseDate(p.lastReadAt).getTime() >= msgTime
    );
    const anyDelivered = participantsRead.some(
        (p) => p.userId !== user?.id && p.lastDeliveredAt && parseDate(p.lastDeliveredAt).getTime() >= msgTime
    );

    return (
        <div className={`flex ${isMe ? "justify-end" : "justify-start"} mb-[2px]`}>
            <div
                className={`msg-bubble max-w-[75%] px-3 py-2 relative ${
                    isMe
                        ? "bg-[#FA6814] text-white"
                        : "bg-[#2a2a2a] text-gray-200 border border-[#3b3b3b]"
                } ${isConsecutive ? "mt-0" : "mt-1"}`}
                style={{ borderRadius: 4 }}
                onClick={() => onMsgClick(msg)}
                onContextMenu={(e) => onContextMenu(e, msg)}
            >
                {!isMe && convInfo?.isGroup && msg.sender && !isConsecutive && (
                    <div className="text-[10px] font-medium text-[#FA6814] mb-1">
                        {msg.sender.displayName || msg.sender.username}
                    </div>
                )}

                {msg.replyTo && (
                    <div className={`mb-1 px-2 py-1 border-l-2 ${isMe ? "border-white/40 bg-white/10" : "border-[#FA6814]/40 bg-[#FA6814]/5"}`} style={{ borderRadius: 2 }}>
                        <div className="text-[9px] font-medium text-[#FA6814]">
                            {msg.replyTo.sender?.displayName || msg.replyTo.sender?.username || "Сообщение"}
                        </div>
                        <div className="text-[10px] text-gray-400 truncate">
                            {msg.replyTo.content || (msg.replyTo.attachmentName ? "📎 " + msg.replyTo.attachmentName : "...")}
                        </div>
                    </div>
                )}

                {msg.forwardedFrom && (
                    <div className="text-[9px] text-gray-400 mb-1 italic">
                        ↪ Переслано от {msg.forwardedFrom.displayName || msg.forwardedFrom.username}
                    </div>
                )}

                {msg.content && (
                    <div className="text-xs whitespace-pre-wrap break-words">{msg.content}</div>
                )}

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

                {img && msg.attachmentPath && imageOnly && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onLightbox(`${API}${msg.attachmentPath}`); }}
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
                        onClick={(e) => { e.stopPropagation(); onLightbox(`${API}${msg.attachmentPath}`); }}
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

                {!voice && !img && msg.attachmentPath && (
                    <a
                        href={`${API}${msg.attachmentPath}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 mt-1 px-3 py-2 bg-[#1e1e1e] border border-[#3b3b3b] text-xs text-gray-300 hover:text-[#FA6814] transition-colors"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <span className="truncate">{msg.attachmentName}</span>
                    </a>
                )}

                <div className={`flex items-center justify-end gap-1 text-[10px] mt-1 ${isMe ? "text-white/70" : "text-gray-500"}`}>
                    {isMe && (
                        anyRead
                            ? <span className="text-[#4FC3F7]" title="Прочитано">✓✓</span>
                            : anyDelivered
                                ? <span className="text-gray-400" title="Доставлено">✓✓</span>
                                : <span title="Отправлено">✓</span>
                    )}
                    <span title={fmtFullDate(msg.createdAt)}>{fmtTime(msg.createdAt)}</span>
                    {msg.editedAt && <span className="italic">(ред.)</span>}
                </div>

                {msg.reactions && msg.reactions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                        {msg.reactions.map((r) => {
                            const hasReacted = user && r.userIds.includes(user.id);
                            return (
                                <button
                                    key={r.emoji}
                                    onClick={(e) => { e.stopPropagation(); onReact(msg.id, r.emoji); }}
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
                            onClick={(e) => { e.stopPropagation(); onReact(msg.id, emoji); }}
                            className="text-sm hover:scale-125 transition-transform cursor-pointer px-0.5"
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
