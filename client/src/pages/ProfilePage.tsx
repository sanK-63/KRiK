import { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";

const VITE_API = import.meta.env.VITE_API_URL;

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

type Tab = "Профиль" | "История входов" | "Турниры" | "Команды" | "ELO рейтинг";

export default function ProfilePage() {
    const { user, setUser } = useUser();
    const [tab, setTab] = useState<Tab>("Профиль");
    const [newEmail, setNewEmail] = useState("");
    const [emailMessage, setEmailMessage] = useState("");
    const [elo, setElo] = useState<EloData | null>(null);
    const [eloHistory, setEloHistory] = useState<EloHistoryEntry[]>([]);
    const [editing, setEditing] = useState(false);
    const [saveMsg, setSaveMsg] = useState("");
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        displayName: "",
        surname: "",
        patronymic: "",
        phone: "",
        dateOfBirth: "",
        email: "",
        discord: "",
        steam: "",
        ea: "",
        battleNet: "",
        country: "",
        bio: "",
    });

    useEffect(() => {
        if (user) {
            setForm({
                displayName: user.displayName || "",
                surname: user.surname || "",
                patronymic: user.patronymic || "",
                phone: user.phone || "",
                dateOfBirth: user.dateOfBirth || "",
                email: user.email || "",
                discord: user.profile?.discord || "",
                steam: user.profile?.steam || "",
                ea: user.profile?.ea || "",
                battleNet: user.profile?.battleNet || "",
                country: user.profile?.country || "",
                bio: user.profile?.bio || "",
            });
        }
    }, [user]);

    useEffect(() => {
        if (!user || tab !== "ELO рейтинг") return;
        fetch(`${VITE_API}/api/elo/user/${user.id}`, { credentials: "include" })
            .then((r) => r.json())
            .then(setElo)
            .catch(() => {});
        fetch(`${VITE_API}/api/elo/history/${user.id}?limit=20`, { credentials: "include" })
            .then((r) => r.json())
            .then(setEloHistory)
            .catch(() => {});
    }, [user, tab]);

    const handleChangeEmail = async () => {
        if (!newEmail) return;
        setEmailMessage("");
        try {
            const res = await fetch(`${VITE_API}/api/auth/change-email`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ newEmail }),
            });
            if (res.ok) {
                setEmailMessage("Почта изменена");
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

    const handleSaveProfile = async () => {
        setSaving(true);
        setSaveMsg("");
        try {
            const res = await fetch(`${VITE_API}/api/users/me/profile`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(form),
            });
            if (res.ok) {
                setSaveMsg("Профиль сохранён");
                setEditing(false);
                if (user) {
                    setUser({
                        ...user,
                        displayName: form.displayName,
                        surname: form.surname,
                        patronymic: form.patronymic,
                        phone: form.phone,
                        dateOfBirth: form.dateOfBirth,
                        email: form.email,
                        profile: {
                            ...user.profile,
                            discord: form.discord,
                            steam: form.steam,
                            ea: form.ea,
                            battleNet: form.battleNet,
                            country: form.country,
                            bio: form.bio,
                        },
                    });
                }
            } else {
                const data = await res.json();
                setSaveMsg(data.error || "Ошибка сохранения");
            }
        } catch {
            setSaveMsg("Ошибка сети");
        } finally {
            setSaving(false);
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

    const tabs: Tab[] = ["Профиль", "История входов", "Турниры", "Команды", "ELO рейтинг"];

    const inputCls = "w-full bg-[#1e1e1e] border border-[#3a3a3a] text-xs text-gray-300 px-3 py-2 outline-none focus:border-[#FA6814] transition-colors";
    const labelCls = "text-[10px] text-gray-500 block mb-1";

    return (
        <div className="max-w-3xl xl:max-w-5xl space-y-6">
            <h1 className="text-sm text-[#FA6814]" style={{ fontFamily: '"Press Start 2P", system-ui' }}>
                Личный кабинет
            </h1>

            <div className="flex gap-1 border-b border-[#3b3b3b] overflow-x-auto">
                {tabs.map((t) => (
                    <button
                        key={t}
                        onClick={() => { setTab(t); setEditing(false); setSaveMsg(""); }}
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
                            {user.username && <p className="text-xs text-gray-500 mt-1">@{user.username}</p>}
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
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs uppercase text-gray-400">Личные данные</h3>
                            {!editing ? (
                                <button onClick={() => setEditing(true)} className="text-[10px] text-[#FA6814] hover:text-[#FF7D30] transition-colors cursor-pointer">
                                    Редактировать
                                </button>
                            ) : (
                                <div className="flex gap-2">
                                    <button onClick={() => { setEditing(false); setSaveMsg(""); }} className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors cursor-pointer">
                                        Отмена
                                    </button>
                                    <button onClick={handleSaveProfile} disabled={saving} className="text-[10px] px-3 py-1 bg-[#FA6814] text-white hover:bg-[#FF7D30] disabled:opacity-50 transition-colors cursor-pointer">
                                        {saving ? "..." : "Сохранить"}
                                    </button>
                                </div>
                            )}
                        </div>
                        {saveMsg && <p className="text-[10px] text-[#4CAF50]">{saveMsg}</p>}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {editing ? (
                                <>
                                    <div><span className={labelCls}>Имя</span><input className={inputCls} value={form.displayName} onChange={(e) => setForm({...form, displayName: e.target.value})} /></div>
                                    <div><span className={labelCls}>Фамилия</span><input className={inputCls} value={form.surname} onChange={(e) => setForm({...form, surname: e.target.value})} /></div>
                                    <div><span className={labelCls}>Отчество</span><input className={inputCls} value={form.patronymic} onChange={(e) => setForm({...form, patronymic: e.target.value})} /></div>
                                    <div><span className={labelCls}>Дата рождения</span><input type="date" className={inputCls} value={form.dateOfBirth} onChange={(e) => setForm({...form, dateOfBirth: e.target.value})} /></div>
                                    <div><span className={labelCls}>Телефон</span><input className={inputCls} value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} /></div>
                                    <div><span className={labelCls}>Email</span><input type="email" className={inputCls} value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} /></div>
                                </>
                            ) : (
                                <>
                                    <div><span className="text-[10px] text-gray-500 block">Имя</span><span className="text-xs text-white">{user.displayName || "—"}</span></div>
                                    <div><span className="text-[10px] text-gray-500 block">Фамилия</span><span className="text-xs text-white">{user.surname || "—"}</span></div>
                                    <div><span className="text-[10px] text-gray-500 block">Отчество</span><span className="text-xs text-white">{user.patronymic || "—"}</span></div>
                                    <div><span className="text-[10px] text-gray-500 block">Дата рождения</span><span className="text-xs text-white">{user.dateOfBirth || "—"}</span></div>
                                    <div><span className="text-[10px] text-gray-500 block">Телефон</span><span className="text-xs text-white">{user.phone || "—"}</span></div>
                                    <div><span className="text-[10px] text-gray-500 block">Email</span><span className="text-xs text-white">{user.email}</span></div>
                                </>
                            )}
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
                            <p className={`text-[10px] ${emailMessage.includes("изменена") ? "text-[#4CAF50]" : "text-[#D32F2F]"}`}>
                                {emailMessage}
                            </p>
                        )}
                    </div>

                    <div className="p-4 space-y-3" style={{ background: "#2a2a2a", border: "1px solid #3b3b3b", borderRadius: 4 }}>
                        <h3 className="text-xs uppercase text-gray-400 mb-3">Ссылки и соцсети</h3>
                        {editing ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div><span className={labelCls}>Discord</span><input className={inputCls} value={form.discord} onChange={(e) => setForm({...form, discord: e.target.value})} placeholder="username" /></div>
                                <div><span className={labelCls}>Steam</span><input className={inputCls} value={form.steam} onChange={(e) => setForm({...form, steam: e.target.value})} placeholder="Steam ID / URL" /></div>
                                <div><span className={labelCls}>EA</span><input className={inputCls} value={form.ea} onChange={(e) => setForm({...form, ea: e.target.value})} placeholder="EA ID" /></div>
                                <div><span className={labelCls}>Battle.net</span><input className={inputCls} value={form.battleNet} onChange={(e) => setForm({...form, battleNet: e.target.value})} placeholder="BattleTag" /></div>
                                <div><span className={labelCls}>Страна</span><input className={inputCls} value={form.country} onChange={(e) => setForm({...form, country: e.target.value})} placeholder="Страна" /></div>
                                <div className="sm:col-span-2"><span className={labelCls}>О себе</span><textarea className={inputCls + " resize-none"} rows={3} value={form.bio} onChange={(e) => setForm({...form, bio: e.target.value})} placeholder="Расскажите о себе..." /></div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {[
                                    { label: "Discord", val: user.profile?.discord },
                                    { label: "Steam", val: user.profile?.steam },
                                    { label: "EA", val: user.profile?.ea },
                                    { label: "Battle.net", val: user.profile?.battleNet },
                                    { label: "Страна", val: user.profile?.country },
                                    { label: "О себе", val: user.profile?.bio },
                                ].filter(x => x.val).map((x) => (
                                    <div key={x.label} className="flex items-center justify-between">
                                        <span className="text-xs text-gray-500">{x.label}</span>
                                        <span className="text-xs text-white">{x.val}</span>
                                    </div>
                                ))}
                                {!user.profile?.discord && !user.profile?.steam && !user.profile?.ea && !user.profile?.battleNet && !user.profile?.country && !user.profile?.bio && (
                                    <p className="text-[10px] text-gray-600">Нажмите "Редактировать", чтобы заполнить</p>
                                )}
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
                    <div className="p-8 text-center" style={{ background: "#2a2a2a", border: "1px solid #3b3b3b", borderRadius: 4 }}>
                        <p className="text-xs text-gray-500">История входов пока не доступна</p>
                    </div>
                </div>
            )}

            {tab === "Турниры" && (
                <div className="space-y-2">
                    <div className="p-8 text-center" style={{ background: "#2a2a2a", border: "1px solid #3b3b3b", borderRadius: 4 }}>
                        <p className="text-xs text-gray-500">Ваши турниры появятся здесь</p>
                    </div>
                </div>
            )}

            {tab === "Команды" && (
                <div className="space-y-2">
                    <div className="p-8 text-center" style={{ background: "#2a2a2a", border: "1px solid #3b3b3b", borderRadius: 4 }}>
                        <p className="text-xs text-gray-500">Ваши команды появятся здесь</p>
                    </div>
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
                                    <span className="text-[10px] px-2 py-0.5 font-medium" style={{ color: getEloColor(elo.elo), border: `1px solid ${getEloColor(elo.elo)}`, borderRadius: 2 }}>
                                        {getEloRank(elo.elo)}
                                    </span>
                                    {elo.rank && <span className="text-[10px] text-gray-500">Ранг #{elo.rank}</span>}
                                </div>
                            </div>

                            <div className="p-4" style={{ background: "#2a2a2a", border: "1px solid #3b3b3b", borderRadius: 4 }}>
                                <h3 className="text-xs uppercase text-gray-400 mb-3">История изменений</h3>
                                {eloHistory.length === 0 ? (
                                    <p className="text-xs text-gray-500">Пока нет изменений</p>
                                ) : (
                                    <div className="space-y-1">
                                        {eloHistory.map((h) => (
                                            <div key={h.id} className="flex items-center justify-between py-1.5" style={{ borderBottom: "1px solid #2f2f2f" }}>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] font-medium" style={{ color: h.change > 0 ? "#4CAF50" : "#D32F2F", minWidth: 40 }}>
                                                        {h.change > 0 ? `+${h.change}` : h.change}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400">{h.oldElo} &rarr; {h.newElo}</span>
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
