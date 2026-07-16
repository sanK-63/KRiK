import { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";

const mockLoginHistory = [
    { date: "2026-07-14 11:05", ip: "192.168.1.1", device: "Windows / Chrome" },
    { date: "2026-07-13 22:30", ip: "192.168.1.1", device: "Windows / Chrome" },
    { date: "2026-07-12 18:15", ip: "10.0.0.5", device: "Windows / Firefox" },
    { date: "2026-07-10 09:40", ip: "192.168.1.1", device: "Windows / Chrome" },
];

const mockTournaments = [
    { name: "CS2 Major Spring 2026", status: "Идёт", role: "Капитан" },
    { name: "Dota 2 Weekly #12", status: "Завершён", role: "Участник" },
];

const mockTeams = [
    { name: "Rога", game: "CS2", role: "Капитан" },
    { name: "Копыта", game: "Dota 2", role: "Участник" },
];

type Tab = "Профиль" | "История входов" | "Турниры" | "Команды" | "ELO рейтинг";

const roleColors: Record<string, string> = {
    Administrator: "#D32F2F",
    Moderator: "#FFB020",
    Judge: "#3CB371",
    Captain: "#FA6814",
    User: "#A5A5A5",
};

interface EloData {
    elo: number;
    gamesPlayed: number;
    wins: number;
    losses: number;
    winrate: number;
    rank: number | null;
}

interface EloHistoryEntry {
    id: number;
    oldElo: number;
    newElo: number;
    change: number;
    reason: string;
    createdAt: string;
}

function getEloColor(elo: number): string {
    if (elo >= 1400) return "#FFD700";
    if (elo >= 1200) return "#FA6814";
    if (elo >= 1000) return "#3CB371";
    if (elo >= 800) return "#5B9BD5";
    return "#A5A5A5";
}

function getEloRank(elo: number): string {
    if (elo >= 1600) return "Гроссмейстер";
    if (elo >= 1400) return "Мастер";
    if (elo >= 1200) return "Эксперт";
    if (elo >= 1000) return "Боец";
    if (elo >= 800) return "Новичок";
    return "Рекрут";
}

export default function ProfilePage() {
    const { user, setUser } = useUser();
    const [tab, setTab] = useState<Tab>("Профиль");
    const [newEmail, setNewEmail] = useState("");
    const [emailMessage, setEmailMessage] = useState("");
    const tabs: Tab[] = ["Профиль", "История входов", "Турниры", "Команды", "ELO рейтинг"];
    const [elo, setElo] = useState<EloData | null>(null);
    const [eloHistory, setEloHistory] = useState<EloHistoryEntry[]>([]);

    useEffect(() => {
        if (!user || tab !== "ELO рейтинг") return;
        fetch(`${import.meta.env.VITE_API_URL}/api/elo/user/${user.id}`, {
            credentials: "include",
        })
            .then((r) => r.json())
            .then(setElo)
            .catch(() => {});
        fetch(`${import.meta.env.VITE_API_URL}/api/elo/history/${user.id}?limit=20`, {
            credentials: "include",
        })
            .then((r) => r.json())
            .then(setEloHistory)
            .catch(() => {});
    }, [user, tab]);

    const handleChangeEmail = async () => {
        if (!newEmail) return;
        setEmailMessage("");
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/change-email`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ newEmail }),
            });
            if (res.ok) {
                setEmailMessage("✓ Почта изменена");
                if (user) setUser({ ...user, email: newEmail });
                setNewEmail("");
            } else {
                const data = await res.json();
                setEmailMessage(data.error || "Ошибка");
            }
        } catch {
            setEmailMessage("Ошибка сети");
        }
    };

    if (!user) {
        return (
            <div className="flex items-center justify-center py-20">
                <span className="text-xs text-gray-500">Загрузка профиля...</span>
            </div>
        );
    }

    const initials = (user.displayName?.[0] || user.username?.[0] || "?").toUpperCase();
    const fullName = [user.displayName, user.surname, user.patronymic].filter(Boolean).join(" ");

    return (
        <div className="max-w-3xl xl:max-w-5xl space-y-6">
            <h1 className="text-sm text-[#FA6814]" style={{ fontFamily: '"Press Start 2P", system-ui' }}>
                Личный кабинет
            </h1>

            <div className="flex gap-1 border-b border-[#3b3b3b] overflow-x-auto">
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
                    <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                        <div className="w-32 h-32 sm:w-48 sm:h-48 lg:w-64 lg:h-64 bg-[#2a2a2a] border border-[#3b3b3b] shrink-0 overflow-hidden">
                            {user.avatar ? (
                                <img src={user.avatar} alt={user.username} className="w-full h-full object-cover object-top" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-5xl text-[#FA6814] font-bold">
                                    {initials}
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <h2 className="text-lg font-bold text-white">{fullName || user.username}</h2>
                            {user.username && (
                                <p className="text-xs text-gray-500 mt-1">@{user.username}</p>
                            )}
                            <div className="flex gap-2 mt-2 flex-wrap">
                                {user.roles.map((r: { roleId: number; name: string; color: string | null }) => (
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
                        </div>
                    </div>

                    <div className="p-4 space-y-3" style={{ background: "#2a2a2a", border: "1px solid #3b3b3b", borderRadius: 4 }}>
                        <h3 className="text-xs uppercase text-gray-400 mb-3">Личные данные</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                    <div className="p-4 space-y-3" style={{ background: "#2a2a2a", border: "1px solid #3b3b3b", borderRadius: 4 }}>
                        <h3 className="text-xs uppercase text-gray-400 mb-3">Почта</h3>
                        <div className="flex items-center gap-3">
                            <input
                                type="email"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                placeholder="Новая почта..."
                                className="flex-1 bg-[#1e1e1e] border border-[#3a3a3a] text-xs text-gray-300 px-3 py-2 outline-none focus:border-[#FA6814] transition-colors"
                            />
                            <button
                                onClick={handleChangeEmail}
                                disabled={!newEmail || newEmail === user.email}
                                className="text-[10px] uppercase px-4 py-2 bg-[#FA6814] text-white font-medium hover:bg-[#FF7D30] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            >
                                Сменить
                            </button>
                        </div>
                        {emailMessage && (
                            <p className={`text-[10px] ${emailMessage.includes("✓") ? "text-[#4CAF50]" : "text-[#D32F2F]"}`}>
                                {emailMessage}
                            </p>
                        )}
                    </div>

                    <div className="p-4 space-y-3" style={{ background: "#2a2a2a", border: "1px solid #3b3b3b", borderRadius: 4 }}>
                        <h3 className="text-xs uppercase text-gray-400 mb-3">Ссылки</h3>
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
                </div>
            )}

            {tab === "История входов" && (
                <div className="space-y-2">
                    {mockLoginHistory.map((entry, i) => (
                        <div
                            key={i}
                            className="flex items-center justify-between p-3"
                            style={{ background: "#2a2a2a", border: "1px solid #3b3b3b", borderRadius: 4 }}
                        >
                            <div className="flex items-center gap-4">
                                <span className="text-xs text-white">{entry.date}</span>
                                <span className="text-xs text-gray-500">{entry.ip}</span>
                            </div>
                            <span className="text-xs text-gray-400">{entry.device}</span>
                        </div>
                    ))}
                </div>
            )}

            {tab === "Турниры" && (
                <div className="space-y-2">
                    {mockTournaments.map((t, i) => (
                        <div
                            key={i}
                            className="flex items-center justify-between p-3"
                            style={{ background: "#2a2a2a", border: "1px solid #3b3b3b", borderRadius: 4 }}
                        >
                            <div>
                                <span className="text-xs text-white">{t.name}</span>
                                <span className="text-[10px] text-gray-500 ml-3">{t.role}</span>
                            </div>
                            <span
                                className="text-[10px] px-2 py-0.5"
                                style={{
                                    color: t.status === "Идёт" ? "#3CB371" : "#A5A5A5",
                                    background: t.status === "Идёт" ? "rgba(60,179,113,0.1)" : "transparent",
                                    border: `1px solid ${t.status === "Идёт" ? "#3CB371" : "#3b3b3b"}`,
                                }}
                            >
                                {t.status}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {tab === "Команды" && (
                <div className="space-y-2">
                    {mockTeams.map((t, i) => (
                        <div
                            key={i}
                            className="flex items-center justify-between p-3"
                            style={{ background: "#2a2a2a", border: "1px solid #3b3b3b", borderRadius: 4 }}
                        >
                            <div>
                                <span className="text-xs text-white">{t.name}</span>
                                <span className="text-[10px] text-gray-500 ml-3">{t.game}</span>
                            </div>
                            <span className="text-[10px] text-[#FA6814]">{t.role}</span>
                        </div>
                    ))}
                </div>
            )}

            {tab === "ELO рейтинг" && (
                <div className="space-y-6">
                    {elo ? (
                        <>
                            <div className="p-6" style={{ background: "#2a2a2a", border: "1px solid #3b3b3b", borderRadius: 4 }}>
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                                    <div className="text-center">
                                        <div className="text-5xl font-bold" style={{ color: getEloColor(elo.elo), fontFamily: '"Press Start 2P", system-ui' }}>
                                            {elo.elo}
                                        </div>
                                        <div className="text-[10px] text-gray-500 mt-2 uppercase">ELO рейтинг</div>
                                    </div>
                                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                                        <div className="text-center p-3" style={{ background: "#1e1e1e", borderRadius: 4 }}>
                                            <div className="text-lg font-bold text-[#4CAF50]">{elo.wins}</div>
                                            <div className="text-[10px] text-gray-500">Победы</div>
                                        </div>
                                        <div className="text-center p-3" style={{ background: "#1e1e1e", borderRadius: 4 }}>
                                            <div className="text-lg font-bold text-[#D32F2F]">{elo.losses}</div>
                                            <div className="text-[10px] text-gray-500">Поражения</div>
                                        </div>
                                        <div className="text-center p-3" style={{ background: "#1e1e1e", borderRadius: 4 }}>
                                            <div className="text-lg font-bold text-white">{elo.gamesPlayed}</div>
                                            <div className="text-[10px] text-gray-500">Матчей</div>
                                        </div>
                                        <div className="text-center p-3" style={{ background: "#1e1e1e", borderRadius: 4 }}>
                                            <div className="text-lg font-bold text-white">{elo.winrate}%</div>
                                            <div className="text-[10px] text-gray-500">Winrate</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 mt-4">
                                    <span
                                        className="text-[10px] px-2 py-0.5 font-medium"
                                        style={{ color: getEloColor(elo.elo), border: `1px solid ${getEloColor(elo.elo)}`, borderRadius: 2 }}
                                    >
                                        {getEloRank(elo.elo)}
                                    </span>
                                    {elo.rank && (
                                        <span className="text-[10px] text-gray-500">
                                            Ранг #{elo.rank}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="p-4" style={{ background: "#2a2a2a", border: "1px solid #3b3b3b", borderRadius: 4 }}>
                                <h3 className="text-xs uppercase text-gray-400 mb-3">История изменений</h3>
                                {eloHistory.length === 0 ? (
                                    <p className="text-xs text-gray-500">Пока нет изменений</p>
                                ) : (
                                    <div className="space-y-1">
                                        {eloHistory.map((h) => (
                                            <div
                                                key={h.id}
                                                className="flex items-center justify-between py-1.5"
                                                style={{ borderBottom: "1px solid #2f2f2f" }}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span
                                                        className="text-[10px] font-medium"
                                                        style={{ color: h.change > 0 ? "#4CAF50" : "#D32F2F", minWidth: 40 }}
                                                    >
                                                        {h.change > 0 ? `+${h.change}` : h.change}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400">
                                                        {h.oldElo} → {h.newElo}
                                                    </span>
                                                    <span className="text-[10px] text-gray-600">
                                                        {h.reason === "tournament_bonus" ? "Бонус турнира" : "Матч"}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] text-gray-600">
                                                    {new Date(h.createdAt).toLocaleDateString("ru-RU")}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="bg-[#2a2a2a] border border-[#3b3b3b] p-8 text-center">
                            <p className="text-xs text-gray-500">Загрузка...</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
