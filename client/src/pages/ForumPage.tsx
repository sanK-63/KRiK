import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { forumData } from "./forumData";
import type { ForumPost } from "./forumData";

const categories = [
    { label: "Форум", color: "#2196F3" },
    { label: "Новость", color: "#4CAF50" },
    { label: "Объявление", color: "#FA6814" },
    { label: "Документ", color: "#9C27B0" },
];

export default function ForumPage() {
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);
    const [posts, setPosts] = useState<ForumPost[]>(forumData);
    const [form, setForm] = useState({ category: "Форум", title: "", content: "" });

    const handleCreate = () => {
        if (!form.title.trim() || !form.content.trim()) return;
        const cat = categories.find((c) => c.label === form.category)!;
        const newPost: ForumPost = {
            id: Date.now(),
            category: form.category,
            categoryColor: cat.color,
            title: form.title,
            content: form.content,
            author: "Александр",
            date: "Только что",
            comments: [],
        };
        setPosts([newPost, ...posts]);
        setForm({ category: "Форум", title: "", content: "" });
        setShowModal(false);
    };

    return (
        <>
            <div className="flex items-center justify-between mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl lg:text-3xl">Форум</h2>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-[#FA6814] text-white px-5 py-2.5 text-sm font-semibold uppercase hover:bg-[#ff7a2a] transition-colors cursor-pointer"
                >
                    Новая тема
                </button>
            </div>

            <div className="space-y-3">
                {posts.map((post) => (
                    <div
                        key={post.id}
                        className="bg-[#2a2a2a] border border-[#3b3b3b] p-5 hover:border-[#4a4a4a] transition-colors cursor-pointer"
                        onClick={() => navigate(`/forum/${post.id}`)}
                    >
                        <div className="flex items-center gap-3 mb-2">
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

                        <h3 className="text-base font-semibold mb-2">{post.title}</h3>

                        <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                            {post.content.split("\n")[0]}
                        </p>

                        <div className="flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center gap-4">
                                <span>{post.author}</span>
                                <span>{post.date}</span>
                            </div>
                            <span>💬 {post.comments.length}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {showModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center"
                    style={{ background: "rgba(0,0,0,0.6)" }}
                    onClick={() => setShowModal(false)}
                >
                    <div
                        className="w-full max-w-[600px] mx-4 bg-[#2a2a2a] border border-[#3b3b3b] p-5 sm:p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-semibold mb-5">Новая тема</h3>

                        <label className="block text-xs uppercase text-gray-400 mb-2">Категория</label>
                        <select
                            value={form.category}
                            onChange={(e) => setForm({ ...form, category: e.target.value })}
                            className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-300 px-3 py-2.5 outline-none focus:border-[#FA6814] transition-colors mb-4 cursor-pointer"
                        >
                            {categories.map((c) => (
                                <option key={c.label} value={c.label}>{c.label}</option>
                            ))}
                        </select>

                        <label className="block text-xs uppercase text-gray-400 mb-2">Заголовок</label>
                        <input
                            type="text"
                            placeholder="Введите заголовок..."
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-300 px-3 py-2.5 outline-none focus:border-[#FA6814] transition-colors mb-4"
                        />

                        <label className="block text-xs uppercase text-gray-400 mb-2">Текст</label>
                        <textarea
                            placeholder="Напишите содержание темы..."
                            value={form.content}
                            onChange={(e) => setForm({ ...form, content: e.target.value })}
                            className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-300 px-3 py-2.5 outline-none focus:border-[#FA6814] transition-colors resize-none h-40 mb-5"
                        />

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="bg-[#303030] border border-[#404040] text-white px-5 py-2.5 text-sm font-semibold hover:bg-[#3a3a3a] transition-colors cursor-pointer"
                            >
                                Отмена
                            </button>
                            <button
                                onClick={handleCreate}
                                className="bg-[#FA6814] text-white px-5 py-2.5 text-sm font-semibold hover:bg-[#ff7a2a] transition-colors cursor-pointer"
                            >
                                Создать
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
