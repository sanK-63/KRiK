import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { forumData } from "./forumData";
import CommentItem from "../components/CommentItem";
import type { Comment } from "./forumData";

export default function ThreadPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const post = forumData.find((p) => p.id === Number(id));
    const [commentText, setCommentText] = useState("");
    const [comments, setComments] = useState<Comment[]>(post?.comments || []);

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

    const handleAddComment = () => {
        if (!commentText.trim()) return;
        const newComment: Comment = {
            id: Date.now(),
            author: "Александр",
            text: commentText,
            date: "Только что",
            likes: 0,
        };
        setComments([...comments, newComment]);
        setCommentText("");
    };

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
                    {post.pinned && (
                        <span className="text-xs text-[#FA6814] uppercase font-semibold">
                            📌 Закреплено
                        </span>
                    )}
                    <span
                        className="text-[10px] uppercase font-semibold px-2 py-0.5"
                        style={{
                            color: post.categoryColor,
                            background: `${post.categoryColor}15`,
                            border: `1px solid ${post.categoryColor}30`,
                        }}
                    >
                        {post.category}
                    </span>
                </div>

                <h1 className="text-xl font-bold mb-4">{post.title}</h1>

                <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                    <span>{post.author}</span>
                    <span>{post.date}</span>
                </div>

                <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {post.content}
                </div>
            </div>

            {/* Comments */}
            <div className="mb-6">
                <h3 className="text-sm uppercase text-gray-400 mb-4 pb-2 border-b border-[#3b3b3b]">
                    Комментарии ({comments.length})
                </h3>

                {comments.length === 0 && (
                    <p className="text-sm text-gray-500">Пока нет комментариев. Будьте первым!</p>
                )}

                <div className="divide-y divide-[#3b3b3b]">
                    {comments.map((comment) => (
                        <CommentItem key={comment.id} comment={comment} />
                    ))}
                </div>
            </div>

            {/* Add comment */}
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
                        className="bg-[#FA6814] text-white px-5 py-2 text-sm font-semibold hover:bg-[#ff7a2a] transition-colors cursor-pointer"
                    >
                        Отправить
                    </button>
                </div>
            </div>
        </>
    );
}
