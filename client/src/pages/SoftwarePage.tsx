import { useState } from "react";

interface SoftwarePost {
    id: number;
    title: string;
    version: string;
    date: string;
    author: string;
    authorRole: string;
    content: string;
    downloadUrl: string;
    downloadLabel: string;
    tags: string[];
}

const posts: SoftwarePost[] = [
    {
        id: 1,
        title: "Nox App — v2.0.0",
        version: "v2.0.0",
        date: "22 мая 2026",
        author: "sanK-63",
        authorRole: "Разработчик",
        content:
            "Полная переработка таймлайна и тепловой карты, добавлены тултипы и демо-данные. Обновлённый интерфейс, исправления ошибок и улучшение производительности.",
        downloadUrl: "https://github.com/sanK-63/nox-app/releases/tag/v2.0.0",
        downloadLabel: "Скачать v2.0.0",
        tags: ["Nox App", "Релиз", "Обновление"],
    },
];

export default function SoftwarePage() {
    const [expanded, setExpanded] = useState<number | null>(1);

    return (
        <div className="max-w-3xl space-y-6">
            <h1 className="text-sm text-[#FA6814]" style={{ fontFamily: '"Press Start 2P", system-ui' }}>
                Софт
            </h1>

            {posts.map((post) => (
                <div
                    key={post.id}
                    className="space-y-0"
                    style={{ background: "#2a2a2a", border: "1px solid #3b3b3b", borderRadius: 4 }}
                >
                    {/* Header */}
                    <div className="px-5 py-4 border-b border-[#3b3b3b]">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-[#212121] border border-[#3b3b3b] flex items-center justify-center text-[10px] text-[#FA6814] font-bold">
                                    {post.author[0].toUpperCase()}
                                </div>
                                <div>
                                    <span className="text-xs text-white font-medium">{post.author}</span>
                                    <span className="text-[10px] text-gray-500 ml-2">{post.authorRole}</span>
                                </div>
                            </div>
                            <span className="text-[10px] text-gray-500">{post.date}</span>
                        </div>
                        <h2 className="text-base font-bold text-white">{post.title}</h2>
                        <div className="flex gap-2 mt-2">
                            {post.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="text-[9px] px-2 py-0.5 bg-[#212121] border border-[#3b3b3b] text-gray-400"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Body */}
                    <div className="px-5 py-4">
                        <p className="text-xs text-gray-300 leading-relaxed">{post.content}</p>
                    </div>

                    {/* Footer */}
                    <div className="px-5 py-3 border-t border-[#3b3b3b] flex items-center justify-between">
                        <span className="text-[10px] text-gray-500">
                            Версия: <span className="text-white">{post.version}</span>
                        </span>
                        <a
                            href={post.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] uppercase px-5 py-2 bg-[#FA6814] text-white font-medium hover:bg-[#FF7D30] transition-colors inline-block"
                        >
                            {post.downloadLabel}
                        </a>
                    </div>
                </div>
            ))}
        </div>
    );
}
