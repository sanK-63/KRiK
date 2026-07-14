import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/UI/Card";
import AboutSection from "../components/AboutSection";
import { forumData } from "./forumData";

interface Founder {
    id: number;
    username: string;
    displayName: string | null;
    surname: string | null;
    patronymic: string | null;
    avatar: string | null;
    isOnline: boolean;
    roles: { name: string; color: string | null }[];
}

const quickLinks = [
    { label: "Форум", path: "/forum" },
    { label: "Турниры", path: "/tournament" },
    { label: "Конституция", path: "/constitution" },
    { label: "Портал", path: "/portal" },
    { label: "Обращения", path: "/appeals" },
    { label: "Софт", path: "/software" },
];

const upcomingEvents = [
    { title: "CS2 — Внутренний турнир", date: "20 Июля", status: "Регистрация", statusColor: "#FFB020" },
    { title: "Dota 2 — Недельный Кубок", date: "25 Июля", status: "Скоро", statusColor: "#A5A5A5" },
    { title: "Valorant — Show Match", date: "1 Августа", status: "Планируется", statusColor: "#666" },
];

const rules = [
    { num: "I", title: "Общие положения", desc: "Структура и цели Конторы" },
    { num: "II", title: "Членство", desc: "Права и обязанности сотрудников" },
    { num: "III", title: "Дисциплина", desc: "Система поощрений и взысканий" },
    { num: "IV", title: "Турниры", desc: "Правила проведения соревнований" },
];

export default function Dashboard() {
    const navigate = useNavigate();
    const [founders, setFounders] = useState<Founder[]>([]);
    const [onlineUsers, setOnlineUsers] = useState<Founder[]>([]);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return;
        fetch(`${import.meta.env.VITE_API_URL}/api/users`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => (r.ok ? r.json() : []))
            .then((data: Founder[]) => {
                const me = data.find((u) => u.id === 1);
                const others = data.filter((u) => u.id !== 1);
                const ordered = others.length >= 2
                    ? [others[0], me!, others[1]]
                    : me ? [others[0] || me, me, others[1]] : data;
                setFounders(ordered);
                setOnlineUsers(data.filter((u) => u.isOnline));
            })
            .catch(() => {});
    }, []);

    const roleColors: Record<string, string> = {
        Administrator: "#D32F2F",
        Moderator: "#FFB020",
        Judge: "#3CB371",
        Captain: "#FA6814",
        User: "#A5A5A5",
    };

    const recentPosts = forumData.slice(0, 4);

    return (
        <div className="space-y-8">
            <AboutSection />

            {founders.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-xs uppercase text-[#FA6814] text-center" style={{ fontFamily: '"Press Start 2P", system-ui' }}>
                        Основатели
                    </h2>
                    <div className="flex justify-center gap-8">
                        {founders.map((f) => {
                            const initial = (f.displayName?.[0] || f.username?.[0] || "?").toUpperCase();

                            return (
                                <div
                                    key={f.id}
                                    onClick={() => navigate(`/user/${f.id}`)}
                                    className="p-4 flex flex-col items-center gap-3 cursor-pointer hover:border-[#FA6814] transition-colors group shrink-0"
                                    style={{ background: "#2a2a2a", border: "1px solid #3b3b3b", borderRadius: 4 }}
                                >
                                    <div className="relative">
                                        <div className="w-80 h-80 bg-[#212121] border border-[#3b3b3b] overflow-hidden">
                                            {f.avatar ? (
                                                <img src={f.avatar} alt={f.username} className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-5xl text-[#FA6814] font-bold">
                                                    {initial}
                                                </div>
                                            )}
                                        </div>
                                        <div
                                            className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-[#2a2a2a]"
                                            style={{ background: f.isOnline ? "#4CAF50" : "#666" }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-4 gap-4">
                {quickLinks.map((link) => (
                    <div
                        key={link.path}
                        onClick={() => navigate(link.path)}
                        className="p-4 flex items-center justify-center cursor-pointer hover:border-[#FA6814] transition-colors"
                        style={{ background: "#2a2a2a", border: "1px solid #3b3b3b", borderRadius: 4 }}
                    >
                        <span className="text-xs text-white font-medium uppercase" style={{ fontFamily: '"Press Start 2P", system-ui' }}>{link.label}</span>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-4 gap-6">
                <Card title="Обращения" value={12} />
                <Card title="Темы форума" value={64} />
                <Card title="Нарушения" value={2} />
                <Card title="Пользователи" value={founders.length} />
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs uppercase text-gray-400" style={{ fontFamily: '"Press Start 2P", system-ui' }}>
                            Последние темы
                        </h3>
                        <button
                            onClick={() => navigate("/forum")}
                            className="text-[10px] text-[#FA6814] hover:text-[#FF7D30] transition-colors cursor-pointer"
                        >
                            Все →
                        </button>
                    </div>
                    <div className="space-y-2">
                        {recentPosts.map((post) => (
                            <div
                                key={post.id}
                                onClick={() => navigate(`/forum/${post.id}`)}
                                className="p-3 cursor-pointer hover:border-[#FA6814] transition-colors"
                                style={{ background: "#2a2a2a", border: "1px solid #3b3b3b", borderRadius: 4 }}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <span
                                        className="text-[8px] px-1.5 py-0.5 border"
                                        style={{ color: post.categoryColor, borderColor: post.categoryColor }}
                                    >
                                        {post.category}
                                    </span>
                                    <span className="text-[9px] text-gray-600">{post.date}</span>
                                </div>
                                <p className="text-[11px] text-white font-medium truncate">{post.title}</p>
                                <p className="text-[10px] text-gray-500 mt-0.5">{post.author} · {post.comments.length} комментариев</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-3">
                    <h3 className="text-xs uppercase text-gray-400" style={{ fontFamily: '"Press Start 2P", system-ui' }}>
                        Ближайшие события
                    </h3>
                    <div className="space-y-2">
                        {upcomingEvents.map((event, i) => (
                            <div
                                key={i}
                                className="p-3 flex items-center justify-between"
                                style={{ background: "#2a2a2a", border: "1px solid #3b3b3b", borderRadius: 4 }}
                            >
                                <div>
                                    <p className="text-[11px] text-white font-medium">{event.title}</p>
                                    <p className="text-[9px] text-gray-500 mt-0.5">{event.date}</p>
                                </div>
                                <span
                                    className="text-[8px] px-2 py-0.5 border"
                                    style={{ color: event.statusColor, borderColor: event.statusColor }}
                                >
                                    {event.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                    <h3 className="text-xs uppercase text-gray-400" style={{ fontFamily: '"Press Start 2P", system-ui' }}>
                        Основы Конституции
                    </h3>
                    <div
                        className="p-4 space-y-3 cursor-pointer hover:border-[#FA6814] transition-colors"
                        style={{ background: "#2a2a2a", border: "1px solid #3b3b3b", borderRadius: 4 }}
                        onClick={() => navigate("/constitution")}
                    >
                        {rules.map((rule, i) => (
                            <div key={i} className="flex items-start gap-3">
                                <span className="text-[10px] text-[#FA6814] font-bold shrink-0 mt-0.5" style={{ fontFamily: '"Press Start 2P", system-ui' }}>
                                    {rule.num}
                                </span>
                                <div>
                                    <p className="text-[11px] text-white font-medium">{rule.title}</p>
                                    <p className="text-[9px] text-gray-500">{rule.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs uppercase text-gray-400" style={{ fontFamily: '"Press Start 2P", system-ui' }}>
                            Сейчас онлайн
                        </h3>
                        <span className="text-[10px] text-[#4CAF50]">{onlineUsers.length}</span>
                    </div>
                    {onlineUsers.length > 0 ? (
                        <div className="space-y-2">
                            {onlineUsers.map((u) => {
                                const fullName = [u.displayName, u.surname].filter(Boolean).join(" ");
                                const initial = (u.displayName?.[0] || u.username?.[0] || "?").toUpperCase();
                                return (
                                    <div
                                        key={u.id}
                                        onClick={() => navigate(`/user/${u.id}`)}
                                        className="p-3 flex items-center gap-3 cursor-pointer hover:border-[#FA6814] transition-colors"
                                        style={{ background: "#2a2a2a", border: "1px solid #3b3b3b", borderRadius: 4 }}
                                    >
                                        <div className="relative shrink-0">
                                            <div className="w-8 h-8 bg-[#212121] border border-[#3b3b3b] flex items-center justify-center text-[10px] text-[#FA6814] font-bold overflow-hidden">
                                                {u.avatar ? (
                                                    <img src={u.avatar} alt="" className="w-full h-full object-cover object-top" />
                                                ) : initial}
                                            </div>
                                            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#2a2a2a] bg-[#4CAF50]" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] text-white truncate">{fullName || u.username}</p>
                                            <p className="text-[9px] text-gray-600">@{u.username}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div
                            className="p-6 flex flex-col items-center justify-center"
                            style={{ background: "#2a2a2a", border: "1px solid #3b3b3b", borderRadius: 4 }}
                        >
                            <p className="text-[10px] text-gray-500">Никого нет онлайн</p>
                        </div>
                    )}

                    <div
                        className="p-4 cursor-pointer hover:border-[#FA6814] transition-colors"
                        style={{ background: "#2a2a2a", border: "1px solid #3b3b3b", borderRadius: 4 }}
                        onClick={() => navigate("/software")}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-lg">⚙️</span>
                                <div>
                                    <p className="text-[11px] text-white font-medium">Nox App</p>
                                    <p className="text-[9px] text-gray-500">v2.0.0 · Скачать</p>
                                </div>
                            </div>
                            <span className="text-[10px] text-[#FA6814]">→</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
