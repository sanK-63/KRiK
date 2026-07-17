import { useState } from "react";
import type { Comment as CommentType } from "../pages/forumData";

interface Props {
    comment: CommentType;
    depth?: number;
}

export default function CommentItem({ comment, depth = 0 }: Props) {
    const [liked, setLiked] = useState(false);
    const [showReply, setShowReply] = useState(false);
    const [replyText, setReplyText] = useState("");
    const [replies, setReplies] = useState<CommentType[]>(comment.replies || []);

    const handleLike = () => {
        setLiked(!liked);
    };

    const handleReply = () => {
        if (!replyText.trim()) return;
        const newReply: CommentType = {
            id: Date.now(),
            author: "Александр",
            text: replyText,
            date: "Только что",
            likes: 0,
        };
        setReplies([...replies, newReply]);
        setReplyText("");
        setShowReply(false);
    };

    return (
        <div
            className="py-3"
            style={{ marginLeft: depth > 0 ? 24 : 0, borderLeft: depth > 0 ? "1px solid #3b3b3b" : "none", paddingLeft: depth > 0 ? 12 : 0 }}
        >
            <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold">{comment.author}</span>
                <span className="text-[10px] text-gray-500">{comment.date}</span>
            </div>

            <p className="text-sm text-gray-300 mb-2 leading-relaxed">{comment.text}</p>

            <div className="flex items-center gap-4 text-xs text-gray-500">
                <button
                    onClick={handleLike}
                    className={`transition-colors cursor-pointer ${liked ? "text-[#FA6814]" : "hover:text-gray-300"}`}
                >
                    {liked ? "♥" : "♡"} {comment.likes + (liked ? 1 : 0)}
                </button>
                <button
                    onClick={() => setShowReply(!showReply)}
                    className="hover:text-gray-300 transition-colors cursor-pointer"
                >
                    Ответить
                </button>
            </div>

            {showReply && (
                <div className="mt-3 flex gap-2">
                    <input
                        type="text"
                        placeholder="Ваш ответ..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleReply()}
                        className="flex-1 bg-[#1e1e1e] border border-[#3a3a3a] text-xs text-gray-300 px-3 py-2 outline-none focus:border-[#FA6814] transition-colors"
                    />
                    <button
                        onClick={handleReply}
                        className="bg-[#FA6814] text-white px-3 py-2 text-xs font-semibold hover:bg-[#ff7a2a] transition-colors cursor-pointer"
                    >
                        →
                    </button>
                </div>
            )}

            {replies.length > 0 && (
                <div className="mt-2">
                    {replies.map((reply) => (
                        <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
                    ))}
                </div>
            )}
        </div>
    );
}
