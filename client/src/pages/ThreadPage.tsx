import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { useSocket } from "../context/SocketContext";

const API = import.meta.env.VITE_API_URL;

interface CommentData {
    id: number;
    post_id: number;
    parent_id: number | null;
    user_id: number;
    content: string;
    created_at: string;
    authorName: string;
    authorAvatar: string | null;
    likes: number;
    liked?: boolean;
    replies?: CommentData[];
}

interface PostData {
    id: number;
    category: string;
    title: string;
    content: string;
    pinned: number;
    author_id: number;
    authorName: string;
    authorAvatar: string | null;
    commentCount: number;
    created_at: string;
    pollOptions?: string[] | null;
    pollResults?: number[] | null;
    userVote?: number | null;
    comments: CommentData[];
}

const categories: Record<string, { label: string; color: string }> = {
    Форум: { label: "Форум", color: "#2196F3" },
    Новость: { label: "Новость", color: "#4CAF50" },
    Объявление: { label: "Объявление", color: "#FA6814" },
    Документ: { label: "Документ", color: "#9C27B0" },
    Голосование: { label: "Голосование", color: "#FFB020" },
};

function timeAgo(dateStr: string): string {
    if (!dateStr) return "";
    const d = new Date(dateStr.replace(" ", "T"));
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return "только что";
    if (diff < 3600) return `${Math.floor(diff / 60)} мин. назад`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ч. назад`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)} дн. назад`;
    return dateStr;
}

function CommentItem({ comment, postId, depth = 0 }: { comment: CommentData; postId: number; depth?: number }) {
    const { user } = useUser();
    const token = localStorage.getItem("token");
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
    const [liked, setLiked] = useState(false);
    const [likes, setLikes] = useState(comment.likes);
    const [showReply, setShowReply] = useState(false);
    const [replyText, setReplyText] = useState("");
    const [replies, setReplies] = useState<CommentData[]>(comment.replies || []);

    const handleLike = async () => {
        if (!token) return;
        try {
            const r = await fetch(`${API}/api/forum/comments/${comment.id}/like`, { method: "POST", headers });
            if (r.ok) {
                const data = await r.json();
                setLikes(data.likes);
                setLiked(data.liked);
            }
        } catch {}
    };

    const handleReply = async () => {
        if (!replyText.trim()) return;
        try {
            const r = await fetch(`${API}/api/forum/${postId}/comments`, {
                method: "POST",
                headers,
                body: JSON.stringify({ content: replyText.trim(), parentId: comment.id }),
            });
            if (r.ok) {
                const newComment = await r.json();
                setReplies((prev) => [...prev, newComment]);
                setReplyText("");
                setShowReply(false);
            }
        } catch {}
    };

    const handleDelete = async () => {
        if (!confirm("Удалить комментарий?")) return;
        try {
            await fetch(`${API}/api/forum/comments/${comment.id}`, { method: "DELETE", headers });
        } catch {}
    };

    return (
        <div
            className="py-3"
            style={{ marginLeft: depth > 0 ? 24 : 0, borderLeft: depth > 0 ? "1px solid #3b3b3b" : "none", paddingLeft: depth > 0 ? 12 : 0 }}
        >
            <div className="flex items-center gap-2 mb-1">
                {comment.authorAvatar ? (
                    <img src={comment.authorAvatar} alt="" className="w-5 h-5 rounded-full object-cover object-top" />
                ) : null}
                <span className="text-xs font-semibold">{comment.authorName}</span>
                <span className="text-[10px] text-gray-500">{timeAgo(comment.created_at)}</span>
            </div>

            <p className="text-sm text-gray-300 mb-2 leading-relaxed">{comment.content}</p>

            <div className="flex items-center gap-4 text-xs text-gray-500">
                <button
                    onClick={handleLike}
                    className={`transition-colors cursor-pointer ${liked ? "text-[#FA6814]" : "hover:text-gray-300"}`}
                >
                    {liked ? "♥" : "♡"} {likes}
                </button>
                <button
                    onClick={() => setShowReply(!showReply)}
                    className="hover:text-gray-300 transition-colors cursor-pointer"
                >
                    Ответить
                </button>
                {user && (user.id === comment.user_id || user.username === "tunev") && (
                    <button
                        onClick={handleDelete}
                        className="hover:text-[#D32F2F] transition-colors cursor-pointer"
                    >
                        Удалить
                    </button>
                )}
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
                        <CommentItem key={reply.id} comment={reply} postId={postId} depth={depth + 1} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function ThreadPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useUser();
    const socket = useSocket();
    const [post, setPost] = useState<PostData | null>(null);
    const [loading, setLoading] = useState(true);
    const [commentText, setCommentText] = useState("");

    const token = localStorage.getItem("token");
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };

    useEffect(() => {
        fetch(`${API}/api/forum/${id}`, { headers })
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                setPost(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [id]);

    useEffect(() => {
        if (!socket) return;

        socket.on("forum:comment_created", ({ postId: pid, comment }: { postId: number; comment: CommentData }) => {
            if (pid === Number(id)) {
                setPost((prev) => {
                    if (!prev) return prev;
                    if (prev.comments.some((c) => c.id === comment.id)) return prev;
                    return { ...prev, comments: [...prev.comments, comment], commentCount: prev.commentCount + 1 };
                });
            }
        });

        socket.on("forum:comment_deleted", ({ postId: pid, commentId }: { postId: number; commentId: number }) => {
            if (pid === Number(id)) {
                setPost((prev) => {
                    if (!prev) return prev;
                    return { ...prev, comments: prev.comments.filter((c) => c.id !== commentId) };
                });
            }
        });

        socket.on("forum:comment_liked", ({ postId: pid, commentId, likes: newLikes }: { postId: number; commentId: number; likes: number }) => {
            if (pid === Number(id)) {
                setPost((prev) => {
                    if (!prev) return prev;
                    const updateComment = (c: CommentData): CommentData =>
                        c.id === commentId ? { ...c, likes: newLikes } : { ...c, replies: (c.replies || []).map(updateComment) };
                    return { ...prev, comments: prev.comments.map(updateComment) };
                });
            }
        });

        socket.on("forum:poll_voted", (updatedPost: any) => {
            if (updatedPost.id === Number(id)) {
                setPost((prev) => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        pollOptions: updatedPost.pollOptions,
                        pollResults: updatedPost.pollResults,
                        userVote: updatedPost.userVote,
                    };
                });
            }
        });

        return () => {
            socket.off("forum:comment_created");
            socket.off("forum:comment_deleted");
            socket.off("forum:comment_liked");
            socket.off("forum:poll_voted");
        };
    }, [socket, id]);

    const handleAddComment = async () => {
        if (!commentText.trim() || !token) return;
        try {
            const r = await fetch(`${API}/api/forum/${id}/comments`, {
                method: "POST",
                headers,
                body: JSON.stringify({ content: commentText.trim() }),
            });
            if (r.ok) {
                const newComment = await r.json();
                setPost((prev) => {
                    if (!prev) return prev;
                    return { ...prev, comments: [...prev.comments, newComment], commentCount: prev.commentCount + 1 };
                });
                setCommentText("");
            }
        } catch {}
    };

    const votePoll = async (optionIndex: number) => {
        if (!token) return;
        try {
            const r = await fetch(`${API}/api/forum/${id}/vote`, {
                method: "POST",
                headers,
                body: JSON.stringify({ optionIndex }),
            });
            if (r.ok) {
                const updated = await r.json();
                setPost((prev) => {
                    if (!prev) return prev;
                    return { ...prev, pollOptions: updated.pollOptions, pollResults: updated.pollResults, userVote: updated.userVote };
                });
            }
        } catch {}
    };

    if (loading) {
        return <div className="text-center py-10 text-gray-500 text-xs">Загрузка...</div>;
    }

    if (!post) {
        return (
            <div>
                <p className="text-gray-400 mb-4">Тема не найдена.</p>
                <button
                    onClick={() => navigate("/forum")}
                    className="text-[#FA6814] text-sm hover:underline cursor-pointer"
                >
                    ← Назад к форуму
                </button>
            </div>
        );
    }

    const cat = categories[post.category] || categories["Форум"];

    return (
        <>
            <button
                onClick={() => navigate("/forum")}
                className="text-sm text-gray-400 hover:text-white transition-colors mb-6 cursor-pointer"
            >
                ← Назад к форуму
            </button>

            {/* Post */}
            <div className="bg-[#2a2a2a] border border-[#3b3b3b] p-6 mb-6">
                <div className="flex items-center gap-3 mb-3">
                    {post.pinned ? (
                        <span className="text-xs text-[#FA6814] uppercase font-semibold">📌 Закреплено</span>
                    ) : null}
                    <span
                        className="text-[10px] uppercase font-semibold px-2 py-0.5"
                        style={{
                            color: cat.color,
                            background: `${cat.color}15`,
                            border: `1px solid ${cat.color}30`,
                        }}
                    >
                        {post.category}
                    </span>
                    {post.pollOptions && (
                        <span className="text-[10px] uppercase font-semibold px-2 py-0.5 text-[#FFB020] bg-[#FFB02015] border border-[#FFB02030]">
                            📊 Голосование
                        </span>
                    )}
                </div>

                <h1 className="text-xl font-bold mb-4">{post.title}</h1>

                <div className="flex items-center gap-3 mb-4">
                    {post.authorAvatar ? (
                        <img src={post.authorAvatar} alt="" className="w-7 h-7 rounded-full object-cover object-top" />
                    ) : (
                        <div className="w-7 h-7 rounded-full bg-[#1e1e1e] border border-[#3a3a3a] flex items-center justify-center text-[10px] text-gray-400">
                            {post.authorName[0]?.toUpperCase()}
                        </div>
                    )}
                    <span className="text-xs text-gray-400">{post.authorName}</span>
                    <span className="text-xs text-gray-500">{timeAgo(post.created_at)}</span>
                </div>

                <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {post.content}
                </div>

                {/* Poll */}
                {post.pollOptions && post.pollResults && (
                    <div className="mt-5 pt-5 border-t border-[#3b3b3b] space-y-2">
                        <p className="text-[10px] uppercase text-gray-400 mb-2">Голосование</p>
                        {post.pollOptions.map((option, i) => {
                            const total = post.pollResults!.reduce((a, b) => a + b, 0);
                            const pct = total > 0 ? Math.round((post.pollResults![i] / total) * 100) : 0;
                            const isSelected = post.userVote === i;
                            return (
                                <button
                                    key={i}
                                    onClick={() => votePoll(i)}
                                    className="w-full relative overflow-hidden border text-left px-3 py-2 text-xs cursor-pointer transition-colors"
                                    style={{
                                        background: isSelected ? "#FA681415" : "#1e1e1e",
                                        borderColor: isSelected ? "#FA6814" : "#3a3a3a",
                                        color: isSelected ? "#FA6814" : "#a0a0a0",
                                    }}
                                >
                                    <div
                                        className="absolute left-0 top-0 bottom-0 transition-all duration-300"
                                        style={{ width: `${pct}%`, background: isSelected ? "#FA681410" : "#3a3a3a20" }}
                                    />
                                    <span className="relative z-10 flex justify-between">
                                        <span>{option}</span>
                                        <span className="text-gray-500">{pct}%</span>
                                    </span>
                                </button>
                            );
                        })}
                        <p className="text-[10px] text-gray-600">
                            {post.pollResults.reduce((a, b) => a + b, 0)} голосов
                        </p>
                    </div>
                )}
            </div>

            {/* Comments */}
            <div className="mb-6">
                <h3 className="text-sm uppercase text-gray-400 mb-4 pb-2 border-b border-[#3b3b3b]">
                    Комментарии ({post.comments.length})
                </h3>

                {post.comments.length === 0 && (
                    <p className="text-sm text-gray-500">Пока нет комментариев. Будьте первым!</p>
                )}

                <div className="divide-y divide-[#3b3b3b]">
                    {post.comments.map((comment) => (
                        <CommentItem key={comment.id} comment={comment} postId={post.id} />
                    ))}
                </div>
            </div>

            {/* Add comment */}
            {token && (
                <div className="bg-[#2a2a2a] border border-[#3b3b3b] p-4">
                    <textarea
                        placeholder="Написать комментарий..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-300 px-4 py-3 outline-none focus:border-[#FA6814] transition-colors resize-none h-24 mb-3"
                    />
                    <div className="flex justify-end">
                        <button
                            onClick={handleAddComment}
                            disabled={!commentText.trim()}
                            className="bg-[#FA6814] text-white px-5 py-2 text-sm font-semibold hover:bg-[#ff7a2a] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                            Отправить
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
