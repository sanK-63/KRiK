import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

interface PublicProfile {
    id: number;
    username: string;
    displayName: string | null;
    surname: string | null;
    patronymic: string | null;
    avatar: string | null;
    email: string;
    phone: string | null;
    dateOfBirth: string | null;
    status: string;
    createdAt: string;
    lastLogin: string | null;
    isOnline: boolean;
    roles: { roleId: number; name: string; color: string | null }[];
    profile: { country: string | null; bio: string | null; discord: string | null; steam: string | null; ea: string | null; battleNet: string | null } | null;
}

const roleColors: Record<string, string> = {
    Administrator: "#D32F2F",
    Moderator: "#FFB020",
    Judge: "#3CB371",
    Captain: "#FA6814",
    User: "#A5A5A5",
};

type Tab = "Профиль" | "Социальные сети";

export default function UserPublicProfilePage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [user, setUser] = useState<PublicProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [tab, setTab] = useState<Tab>("Профиль");
    const tabs: Tab[] = ["Профиль", "Социальные сети"];

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }
        fetch(`${import.meta.env.VITE_API_URL}/api/users/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => {
                if (!r.ok) throw new Error("not found");
                return r.json();
            })
            .then(setUser)
            .catch(() => setError("Профиль не найден"))
            .finally(() => setLoading(false));
    }, [id, navigate]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <span className="text-xs text-gray-500">Загрузка...</span>
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <span className="text-xs text-[#D32F2F]">{error || "Профиль не найден"}</span>
                <button
                    onClick={() => navigate(-1)}
                    className="text-[10px] uppercase px-4 py-2 bg-[#333] text-gray-300 hover:bg-[#444] transition-colors cursor-pointer"
                >
                    Назад
                </button>
            </div>
        );
    }

    const initials = (user.displayName?.[0] || user.username?.[0] || "?").toUpperCase();
    const fullName = [user.displayName, user.surname, user.patronymic].filter(Boolean).join(" ");

    return (
        <div className="max-w-3xl space-y-6">
            <div className="flex items-center gap-3">
                <button
                    onClick={() => navigate(-1)}
                    className="text-xs text-gray-500 hover:text-[#FA6814] transition-colors cursor-pointer"
                >
                    ← Назад
                </button>
                <h1 className="text-sm text-[#FA6814]" style={{ fontFamily: '"Press Start 2P", system-ui' }}>
                    Профиль
                </h1>
            </div>

            <div className="flex gap-1 border-b border-[#3b3b3b]">
                {tabs.map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`px-4 py-2.5 text-xs font-medium transition-colors cursor-pointer ${
                            tab === t
                                ? "text-[#FA6814] border-b-2 border-[#FA6814]"
                                : "text-gray-500 hover:text-gray-300"
                        }`}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {tab === "Профиль" && (
                <div className="space-y-6">
                    <div className="flex items-start gap-6">
                        <div className="relative shrink-0">
                            <div className="w-64 h-64 bg-[#2a2a2a] border border-[#3b3b3b] overflow-hidden">
                                {user.avatar ? (
                                    <img src={user.avatar} alt={user.username} className="w-full h-full object-cover object-top" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-5xl text-[#FA6814] font-bold">
                                        {initials}
                                    </div>
                                )}
                            </div>
                            <div
                                className="absolute bottom-2 right-2 w-5 h-5 rounded-full border-3 border-[#2a2a2a]"
                                style={{ background: user.isOnline ? "#4CAF50" : "#666" }}
                            />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-lg font-bold text-white">{fullName || user.username}</h2>
                            <p className="text-xs text-gray-500 mt-1">@{user.username}</p>
                            <div className="flex gap-2 mt-3 flex-wrap">
                                {user.roles.map((r) => (
                                    <span
                                        key={r.roleId}
                                        className="text-[10px] px-2 py-0.5 border font-medium"
                                        style={{
                                            color: r.color || roleColors[r.name] || "#A5A5A5",
                                            borderColor: r.color || roleColors[r.name] || "#A5A5A5",
                                        }}
                                    >
                                        {r.name}
                                    </span>
                                ))}
                            </div>
                            <p className="text-[10px] mt-3" style={{ color: user.isOnline ? "#4CAF50" : "#666" }}>
                                {user.isOnline ? "Онлайн" : "Оффлайн"}
                            </p>
                        </div>
                    </div>

                    <div className="p-4 space-y-3" style={{ background: "#2a2a2a", border: "1px solid #3b3b3b", borderRadius: 4 }}>
                        <h3 className="text-xs uppercase text-gray-400 mb-3">Личные данные</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <span className="text-[10px] text-gray-500 block">Имя</span>
                                <span className="text-xs text-white">{user.displayName || "—"}</span>
                            </div>
                            <div>
                                <span className="text-[10px] text-gray-500 block">Фамилия</span>
                                <span className="text-xs text-white">{user.surname || "—"}</span>
                            </div>
                            <div>
                                <span className="text-[10px] text-gray-500 block">Отчество</span>
                                <span className="text-xs text-white">{user.patronymic || "—"}</span>
                            </div>
                            <div>
                                <span className="text-[10px] text-gray-500 block">Дата рождения</span>
                                <span className="text-xs text-white">{user.dateOfBirth || "—"}</span>
                            </div>
                            <div>
                                <span className="text-[10px] text-gray-500 block">Телефон</span>
                                <span className="text-xs text-white">{user.phone || "—"}</span>
                            </div>
                            <div>
                                <span className="text-[10px] text-gray-500 block">Email</span>
                                <span className="text-xs text-white">{user.email}</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-4" style={{ background: "#2a2a2a", border: "1px solid #3b3b3b", borderRadius: 4 }}>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">Последний вход</span>
                            <span className="text-xs text-white">{user.lastLogin || "—"}</span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500">Дата регистрации</span>
                            <span className="text-xs text-white">{user.createdAt}</span>
                        </div>
                    </div>

                    <button
                        onClick={() => alert("Мессенджер в разработке")}
                        className="w-full text-[10px] uppercase px-4 py-3 bg-[#FA6814] text-white font-medium hover:bg-[#FF7D30] transition-colors cursor-pointer"
                    >
                        Написать сообщение
                    </button>
                </div>
            )}

            {tab === "Социальные сети" && (
                <div className="p-4 space-y-3" style={{ background: "#2a2a2a", border: "1px solid #3b3b3b", borderRadius: 4 }}>
                    {user.profile?.discord && (
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">Discord</span>
                            <span className="text-xs text-white">{user.profile.discord}</span>
                        </div>
                    )}
                    {user.profile?.steam && (
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">Steam</span>
                            <span className="text-xs text-white">{user.profile.steam}</span>
                        </div>
                    )}
                    {user.profile?.ea && (
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">EA</span>
                            <span className="text-xs text-white">{user.profile.ea}</span>
                        </div>
                    )}
                    {user.profile?.battleNet && (
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">Battle.net</span>
                            <span className="text-xs text-white">{user.profile.battleNet}</span>
                        </div>
                    )}
                    {user.profile?.country && (
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">Страна</span>
                            <span className="text-xs text-white">{user.profile.country}</span>
                        </div>
                    )}
                    {user.profile?.bio && (
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">О себе</span>
                            <span className="text-xs text-white">{user.profile.bio}</span>
                        </div>
                    )}
                    {!user.profile?.discord && !user.profile?.steam && !user.profile?.ea && !user.profile?.battleNet && !user.profile?.country && !user.profile?.bio && (
                        <p className="text-xs text-gray-500">Нет данных</p>
                    )}
                </div>
            )}
        </div>
    );
}
