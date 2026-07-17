import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import type { Tournament, TournamentListItem, TournamentTemplate, TournamentStatus, TournamentFormat, TournamentStanding, TournamentStats, FormField } from "./tournamentData";
import { STATUS_LABELS, FORMAT_LABELS, PARTICIPANT_LABELS } from "./tournamentData";
import { tournamentsApi, templatesApi } from "../services/tournaments";
import { useUser } from "../context/UserContext";
import TournamentCard from "../components/Tournament/TournamentCard";
import TournamentWizard from "../components/Tournament/TournamentWizard";
import TemplateWizard from "../components/Tournament/TemplateWizard";
import TournamentControlPanel from "../components/Tournament/TournamentControlPanel";
import BracketView from "../components/Tournament/BracketView";
import MatchCard from "../components/Tournament/MatchCard";
import GamesPage from "./GamesPage";

const statusTabs = [
    { key: "all", label: "Все" },
    { key: "draft", label: "Черновик" },
    { key: "registration", label: "Регистрация" },
    { key: "active", label: "Идёт" },
    { key: "completed", label: "Завершён" },
];

const mainTabs = ["Турниры", "Шаблоны", "Игры", "Архив", "Статистика"];

export default function TournamentPage() {
    const { user } = useUser();
    const location = useLocation();
    const openId = (location.state as { openId?: number })?.openId;
    const [mainTab, setMainTab] = useState("Турниры");
    const [statusFilter, setStatusFilter] = useState("all");
    const [showWizard, setShowWizard] = useState(false);
    const [showTemplateWizard, setShowTemplateWizard] = useState(false);
    const [tournaments, setTournaments] = useState<TournamentListItem[]>([]);
    const [templates, setTemplates] = useState<TournamentTemplate[]>([]);
    const [selectedTournamentId, setSelectedTournamentId] = useState<number | null>(null);
    const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
    const [detailTab, setDetailTab] = useState("Главная");
    const [loading, setLoading] = useState(false);
    const [showRegForm, setShowRegForm] = useState(false);
    const [regFormValues, setRegFormValues] = useState<Record<string, string>>({});

    const loadTournaments = useCallback(async () => {
        try {
            const data = await tournamentsApi.list();
            setTournaments(data);
        } catch {
            // ignore
        }
    }, []);

    const loadTemplates = useCallback(async () => {
        try {
            const data = await templatesApi.list();
            setTemplates(data);
        } catch {
            // ignore
        }
    }, []);

    useEffect(() => {
        loadTournaments();
    }, [loadTournaments]);

    useEffect(() => {
        if (openId && tournaments.length > 0 && selectedTournamentId === null) {
            const t = tournaments.find((t) => t.id === openId);
            if (t) {
                setSelectedTournamentId(t.id);
                window.history.replaceState({}, "");
            }
        }
    }, [openId, tournaments, selectedTournamentId]);

    useEffect(() => {
        if (mainTab === "Шаблоны") {
            loadTemplates();
        }
    }, [mainTab, loadTemplates]);

    useEffect(() => {
        if (selectedTournamentId !== null) {
            setLoading(true);
            tournamentsApi.get(selectedTournamentId)
                .then((data) => {
                    setSelectedTournament(data);
                    setLoading(false);
                })
                .catch(() => {
                    setLoading(false);
                    setSelectedTournamentId(null);
                    setSelectedTournament(null);
                });
        }
    }, [selectedTournamentId]);

    const filtered = statusFilter === "all"
        ? tournaments
        : tournaments.filter((t) => t.status === statusFilter);

    const archived = tournaments.filter((t) => t.status === "completed");

    const handleCreate = async (data: {
        gameId: number;
        title: string;
        description: string;
        rules: string;
        participantType: "team" | "player";
        format: string;
        registrationOpen: string;
        registrationClose: string;
        startDate: string;
        endDate: string;
        registrationForm: { id: string; type: string; label: string; required: boolean; options?: string[] }[];
    }) => {
        try {
            await tournamentsApi.create({
                gameId: data.gameId,
                title: data.title,
                description: data.description,
                rules: data.rules,
                participantType: data.participantType,
                format: data.format,
                registrationOpen: data.registrationOpen || undefined,
                registrationClose: data.registrationClose || undefined,
                startDate: data.startDate || undefined,
                endDate: data.endDate || undefined,
                registrationForm: data.registrationForm,
            });
            setShowWizard(false);
            loadTournaments();
        } catch {
            // ignore
        }
    };

    const handleCreateTemplate = async (data: {
        gameId: number;
        name: string;
        description: string;
        config: { format: string; participantType: string; rules?: string };
    }) => {
        try {
            await templatesApi.create({
                gameId: data.gameId,
                name: data.name,
                description: data.description,
                config: data.config,
            });
            setShowTemplateWizard(false);
            loadTemplates();
        } catch {
            // ignore
        }
    };

    const handleDeleteTemplate = async (id: number) => {
        try {
            await templatesApi.delete(id);
            loadTemplates();
        } catch {
            // ignore
        }
    };

    const handleRefresh = () => {
        if (selectedTournamentId !== null) {
            tournamentsApi.get(selectedTournamentId).then(setSelectedTournament).catch(() => {});
        }
        loadTournaments();
    };

    const handleStatusChange = async (status: TournamentStatus) => {
        if (selectedTournamentId === null) return;
        try {
            await tournamentsApi.setStatus(selectedTournamentId, status);
            handleRefresh();
        } catch (e: any) {
            alert(e.message || "Ошибка смены статуса");
        }
    };

    const handleGenerateBracket = async () => {
        if (selectedTournamentId === null) return;
        try {
            await tournamentsApi.generateBracket(selectedTournamentId);
            handleRefresh();
        } catch (e: any) {
            alert(e.message || "Ошибка генерации сетки");
        }
    };

    const handleDelete = async () => {
        if (selectedTournamentId === null) return;
        if (!confirm("Удалить турнир?")) return;
        try {
            await tournamentsApi.delete(selectedTournamentId);
            setSelectedTournamentId(null);
            setSelectedTournament(null);
            loadTournaments();
        } catch (e: any) {
            alert(e.message || "Ошибка удаления");
        }
    };

    const handleRegister = async () => {
        if (selectedTournamentId === null) return;
        const formFields = selectedTournament?.registrationForm;
        if (formFields && formFields.length > 0) {
            const init: Record<string, string> = {};
            formFields.forEach((f: FormField) => (init[f.id] = ""));
            setRegFormValues(init);
            setShowRegForm(true);
            return;
        }
        try {
            await tournamentsApi.register(selectedTournamentId, {});
            handleRefresh();
        } catch (e: any) {
            alert(e.message || "Ошибка регистрации");
        }
    };

    const handleRegFormSubmit = async () => {
        if (selectedTournamentId === null) return;
        const formFields = selectedTournament?.registrationForm || [];
        const requiredFields = formFields.filter((f: FormField) => f.required);
        for (const f of requiredFields) {
            if (!regFormValues[f.id]?.trim()) {
                alert(`Поле "${f.label}" обязательно для заполнения`);
                return;
            }
        }
        try {
            const answers = Object.entries(regFormValues).map(([field, value]) => ({ field, value }));
            await tournamentsApi.register(selectedTournamentId, { answers });
            setShowRegForm(false);
            handleRefresh();
        } catch (e: any) {
            alert(e.message || "Ошибка регистрации");
        }
    };

    const handleUnregister = async () => {
        if (selectedTournamentId === null) return;
        try {
            await tournamentsApi.unregister(selectedTournamentId);
            handleRefresh();
        } catch (e: any) {
            alert(e.message || "Ошибка отмены регистрации");
        }
    };

    // Detail view
    if (selectedTournament && selectedTournamentId !== null) {
        const t = selectedTournament;
        const detailTabs = ["Главная", "Правила", "Регистрация", "Участники", "Команды", "Матчи", "Сетка", "Таблица", "Статистика", "Настройки"];

        return (
            <>
                {loading ? (
                    <div className="text-gray-400 text-sm py-10 text-center">Загрузка...</div>
                ) : (
                    <>
                        <TournamentControlPanel
                            tournament={t}
                            currentUserId={user?.id ?? null}
                            onBack={() => {
                                setSelectedTournamentId(null);
                                setSelectedTournament(null);
                            }}
                            onStatusChange={handleStatusChange}
                            onGenerateBracket={handleGenerateBracket}
                            onDelete={handleDelete}
                            onRegister={handleRegister}
                            onUnregister={handleUnregister}
                            isRegistered={user ? t.registrations.some((r) => r.userId === user.id && r.status !== "rejected") : false}
                        />

                        <div className="flex gap-1 mb-6 border-b border-[#3b3b3b] overflow-x-auto">
                            {detailTabs.map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setDetailTab(tab)}
                                    className="px-4 py-2.5 text-xs uppercase transition-colors whitespace-nowrap cursor-pointer"
                                    style={{
                                        color: detailTab === tab ? "#FA6814" : "#6b7280",
                                        borderBottom: detailTab === tab ? "2px solid #FA6814" : "2px solid transparent",
                                    }}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {detailTab === "Главная" && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="bg-[#2a2a2a] border border-[#3b3b3b] p-5">
                                    <h3 className="text-sm uppercase text-gray-400 mb-3">Описание</h3>
                                    <p className="text-sm text-gray-300 leading-relaxed">{t.description || "Описание не задано."}</p>
                                </div>
                                <div className="bg-[#2a2a2a] border border-[#3b3b3b] p-5">
                                    <h3 className="text-sm uppercase text-gray-400 mb-3">Информация</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between"><span className="text-gray-500">Игра</span><span>{t.gameName || "—"}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">Формат</span><span>{FORMAT_LABELS[t.format]}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">Тип</span><span>{PARTICIPANT_LABELS[t.participantType]}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">Статус</span><span>{STATUS_LABELS[t.status]}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">Регистрация</span><span>{t.registrationOpen ? new Date(t.registrationOpen).toLocaleString("ru-RU") : "—"} — {t.registrationClose ? new Date(t.registrationClose).toLocaleString("ru-RU") : "—"}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">Старт</span><span>{t.startDate ? new Date(t.startDate).toLocaleString("ru-RU") : "—"}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">Окончание</span><span>{t.endDate ? new Date(t.endDate).toLocaleString("ru-RU") : "—"}</span></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {detailTab === "Правила" && (
                            <div className="bg-[#2a2a2a] border border-[#3b3b3b] p-6">
                                <pre className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{t.rules || "Правила не заданы."}</pre>
                            </div>
                        )}

                        {detailTab === "Регистрация" && <RegistrationsTab tournament={t} onRefresh={handleRefresh} />}

                        {detailTab === "Участники" && <ParticipantsTab tournament={t} />}

                        {detailTab === "Команды" && <TeamsTab tournament={t} />}

                        {detailTab === "Матчи" && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {t.matches.length === 0 && <p className="text-gray-400 text-sm">Матчи ещё не созданы.</p>}
                                {t.matches.map((m) => (
                                    <MatchCard key={m.id} match={m} tournamentId={t.id} onRefresh={handleRefresh} />
                                ))}
                            </div>
                        )}

                        {detailTab === "Сетка" && <BracketView matches={t.matches} tournamentId={t.id} onRefresh={handleRefresh} />}

                        {detailTab === "Таблица" && <StandingsTab tournamentId={t.id} />}

                        {detailTab === "Статистика" && <StatsTab tournamentId={t.id} />}

                        {detailTab === "Настройки" && <SettingsTab tournament={t} onRefresh={handleRefresh} />}
                    </>
                )}
            </>
        );
    }

    // Main views
    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl sm:text-2xl lg:text-3xl">Турниры</h2>
                <button
                    onClick={() => setShowWizard(true)}
                    className="bg-[#FA6814] text-white px-5 py-2.5 text-sm font-semibold uppercase hover:bg-[#ff7a2a] transition-colors cursor-pointer"
                >
                    Создать турнир
                </button>
            </div>

            <div className="flex gap-1 mb-6 border-b border-[#3b3b3b] overflow-x-auto">
                {mainTabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setMainTab(tab)}
                        className="px-4 py-2.5 text-xs uppercase transition-colors cursor-pointer"
                        style={{
                            color: mainTab === tab ? "#FA6814" : "#6b7280",
                            borderBottom: mainTab === tab ? "2px solid #FA6814" : "2px solid transparent",
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {mainTab === "Турниры" && (
                <>
                    <div className="flex gap-2 mb-6 overflow-x-auto">
                        {statusTabs.map((s) => (
                            <button
                                key={s.key}
                                onClick={() => setStatusFilter(s.key)}
                                className="px-3 py-1.5 text-xs transition-colors cursor-pointer"
                                style={{
                                    background: statusFilter === s.key ? "#FA6814" : "#2a2a2a",
                                    color: statusFilter === s.key ? "white" : "#9ca3af",
                                    border: `1px solid ${statusFilter === s.key ? "#FA6814" : "#3b3b3b"}`,
                                }}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filtered.map((t) => (
                            <TournamentCard key={t.id} tournament={t} onClick={() => { setSelectedTournamentId(t.id); setDetailTab("Главная"); }} />
                        ))}
                    </div>

                    {filtered.length === 0 && (
                        <p className="text-gray-400 text-sm text-center py-10">Нет турниров с этим статусом.</p>
                    )}
                </>
            )}

            {mainTab === "Шаблоны" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates.map((tpl) => (
                        <div key={tpl.id} className="bg-[#2a2a2a] border border-[#3b3b3b] p-5">
                            <h3 className="font-semibold mb-2">{tpl.name}</h3>
                            <p className="text-xs text-gray-400 mb-3">{tpl.gameName || "Игра"} · {tpl.config ? String(tpl.config.format || "") : ""}</p>
                            <p className="text-xs text-gray-500 mb-3">{tpl.description || "Без описания"}</p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowWizard(true)}
                                    className="bg-[#FA6814] text-white px-4 py-2 text-xs font-semibold hover:bg-[#ff7a2a] transition-colors cursor-pointer"
                                >
                                    Использовать
                                </button>
                                <button
                                    onClick={() => handleDeleteTemplate(tpl.id)}
                                    className="bg-[#303030] border border-[#D32F2F30] text-[#D32F2F] px-3 py-2 text-xs font-semibold hover:bg-[#D32F2F15] transition-colors cursor-pointer"
                                >
                                    Удалить
                                </button>
                            </div>
                        </div>
                    ))}
                    <div className="bg-[#2a2a2a] border border-[#3b3b3b] border-dashed p-5 flex items-center justify-center">
                        <button
                            onClick={() => setShowTemplateWizard(true)}
                            className="text-gray-500 hover:text-[#FA6814] transition-colors text-sm cursor-pointer"
                        >
                            + Создать шаблон
                        </button>
                    </div>
                </div>
            )}

            {mainTab === "Игры" && <GamesPage embedded />}

            {mainTab === "Архив" && (
                <div className="space-y-4">
                    {archived.length === 0 && <p className="text-gray-400 text-sm">Архив пуст.</p>}
                    {archived.map((t) => (
                        <TournamentCard key={t.id} tournament={t} onClick={() => { setSelectedTournamentId(t.id); setDetailTab("Главная"); }} />
                    ))}
                </div>
            )}

            {mainTab === "Статистика" && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-[#2a2a2a] border border-[#3b3b3b] p-5">
                        <div className="text-xs uppercase text-gray-400">Всего турниров</div>
                        <div className="text-xl sm:text-2xl lg:text-3xl text-[#FA6814] mt-2">{tournaments.length}</div>
                    </div>
                    <div className="bg-[#2a2a2a] border border-[#3b3b3b] p-5">
                        <div className="text-xs uppercase text-gray-400">Активных</div>
                        <div className="text-xl sm:text-2xl lg:text-3xl text-[#4CAF50] mt-2">{tournaments.filter((t) => t.status === "registration" || t.status === "active").length}</div>
                    </div>
                    <div className="bg-[#2a2a2a] border border-[#3b3b3b] p-5">
                        <div className="text-xs uppercase text-gray-400">Всего участников</div>
                        <div className="text-xl sm:text-2xl lg:text-3xl text-[#FA6814] mt-2">{tournaments.reduce((s, t) => s + t.registrationCount, 0)}</div>
                    </div>
                    <div className="bg-[#2a2a2a] border border-[#3b3b3b] p-5">
                        <div className="text-xs uppercase text-gray-400">Всего матчей</div>
                        <div className="text-xl sm:text-2xl lg:text-3xl text-[#FA6814] mt-2">{tournaments.reduce((s, t) => s + t.matchCount, 0)}</div>
                    </div>
                </div>
            )}

            {showWizard && (
                <TournamentWizard
                    onSubmit={handleCreate}
                    onClose={() => setShowWizard(false)}
                />
            )}

            {showTemplateWizard && (
                <TemplateWizard
                    onSubmit={handleCreateTemplate}
                    onClose={() => setShowTemplateWizard(false)}
                />
            )}

            {showRegForm && selectedTournament && (
                <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }} onClick={() => setShowRegForm(false)}>
                    <div className="w-full max-w-[500px] mx-4 max-h-[85vh] overflow-y-auto bg-[#2a2a2a] border border-[#3b3b3b] p-6" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold mb-2">Регистрация</h3>
                        <p className="text-xs text-gray-500 mb-5">{selectedTournament.title}</p>
                        <div className="space-y-4">
                            {(selectedTournament.registrationForm || []).map((field: FormField) => (
                                <div key={field.id}>
                                    <label className="block text-xs uppercase text-gray-400 mb-2">
                                        {field.label} {field.required && <span className="text-[#FA6814]">*</span>}
                                    </label>
                                    {field.type === "select" && field.options ? (
                                        <select
                                            value={regFormValues[field.id] || ""}
                                            onChange={(e) => setRegFormValues((prev) => ({ ...prev, [field.id]: e.target.value }))}
                                            className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-300 px-3 py-2.5 outline-none focus:border-[#FA6814] transition-colors cursor-pointer"
                                        >
                                            <option value="">Выберите...</option>
                                            {field.options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    ) : field.type === "checkbox" ? (
                                        <label className="flex items-center gap-2 cursor-pointer" onClick={() => setRegFormValues((prev) => ({ ...prev, [field.id]: prev[field.id] === "true" ? "false" : "true" }))}>
                                            <div
                                                className="w-5 h-5 border flex items-center justify-center transition-colors shrink-0"
                                                style={{
                                                    borderColor: regFormValues[field.id] === "true" ? "#FA6814" : "#3a3a3a",
                                                    background: regFormValues[field.id] === "true" ? "#FA6814" : "transparent",
                                                }}
                                            >
                                                {regFormValues[field.id] === "true" && (
                                                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                                                        <path d="M2 6l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                )}
                                            </div>
                                            <span className="text-sm text-gray-300">{field.label}</span>
                                        </label>
                                    ) : (
                                        <input
                                            type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                                            value={regFormValues[field.id] || ""}
                                            onChange={(e) => setRegFormValues((prev) => ({ ...prev, [field.id]: e.target.value }))}
                                            placeholder={`Введите ${field.label.toLowerCase()}...`}
                                            className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-300 px-3 py-2.5 outline-none focus:border-[#FA6814] transition-colors"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setShowRegForm(false)} className="bg-[#303030] border border-[#404040] text-white px-5 py-2.5 text-sm font-semibold hover:bg-[#3a3a3a] transition-colors cursor-pointer">Отмена</button>
                            <button onClick={handleRegFormSubmit} className="bg-[#4CAF50] text-white px-5 py-2.5 text-sm font-semibold hover:opacity-90 transition-colors cursor-pointer">Зарегистрироваться</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

// ─── Sub-components ───

function RegistrationsTab({ tournament, onRefresh }: { tournament: Tournament; onRefresh: () => void }) {
    const [regs, setRegs] = useState(tournament.registrations);

    const handleApprove = async (regId: number) => {
        try {
            await tournamentsApi.approveRegistration(tournament.id, regId);
            setRegs((prev) => prev.map((r) => r.id === regId ? { ...r, status: "approved" as const } : r));
            onRefresh();
        } catch {
            // ignore
        }
    };

    const handleReject = async (regId: number) => {
        try {
            await tournamentsApi.rejectRegistration(tournament.id, regId);
            setRegs((prev) => prev.map((r) => r.id === regId ? { ...r, status: "rejected" as const } : r));
            onRefresh();
        } catch {
            // ignore
        }
    };

    const statusBadgeColor: Record<string, string> = {
        pending: "#FFB020",
        approved: "#4CAF50",
        rejected: "#D32F2F",
    };

    return (
        <div className="space-y-3">
            {regs.length === 0 && <p className="text-gray-400 text-sm">Нет заявок.</p>}
            {regs.map((reg) => (
                <div key={reg.id} className="bg-[#2a2a2a] border border-[#3b3b3b] p-4 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-semibold">
                            {reg.team?.name || reg.user?.displayName || reg.user?.username || `Пользователь #${reg.userId}`}
                        </p>
                        <p className="text-xs text-gray-500">
                            {reg.team ? `Команда · ${reg.team.tag || ""}` : `Игрок · ID ${reg.userId}`}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span
                            className="text-[10px] uppercase font-semibold px-2 py-0.5"
                            style={{
                                color: statusBadgeColor[reg.status],
                                background: `${statusBadgeColor[reg.status]}15`,
                                border: `1px solid ${statusBadgeColor[reg.status]}30`,
                            }}
                        >
                            {reg.status}
                        </span>
                        {reg.status === "pending" && (
                            <>
                                <button
                                    onClick={() => handleApprove(reg.id)}
                                    className="bg-[#4CAF50] text-white px-3 py-1 text-xs font-semibold hover:opacity-90 transition-colors cursor-pointer"
                                >
                                    ✓
                                </button>
                                <button
                                    onClick={() => handleReject(reg.id)}
                                    className="bg-[#D32F2F] text-white px-3 py-1 text-xs font-semibold hover:opacity-90 transition-colors cursor-pointer"
                                >
                                    ✕
                                </button>
                            </>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

function ParticipantsTab({ tournament }: { tournament: Tournament }) {
    const participants: { id: number; name: string; role: string; avatar: string | null }[] = [];

    for (const reg of tournament.registrations) {
        if (reg.user) {
            const exists = participants.some((p) => p.id === reg.user!.id);
            if (!exists) {
                participants.push({
                    id: reg.user.id,
                    name: reg.user.displayName || reg.user.username,
                    role: "Игрок",
                    avatar: reg.user.avatar,
                });
            }
        }
        if (reg.team?.members) {
            for (const member of reg.team.members) {
                const exists = participants.some((p) => p.id === member.userId);
                if (!exists) {
                    participants.push({
                        id: member.userId,
                        name: `Участник #${member.userId}`,
                        role: member.role === "captain" ? "Капитан" : "Участник",
                        avatar: null,
                    });
                }
            }
        }
    }

    return (
        <div className="space-y-3">
            {participants.length === 0 && <p className="text-gray-400 text-sm">Нет участников.</p>}
            {participants.map((p) => (
                <div key={p.id} className="bg-[#2a2a2a] border border-[#3b3b3b] p-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded bg-[#3a3a3a] flex items-center justify-center text-xs text-gray-400 overflow-hidden">
                        {p.avatar ? <img src={p.avatar} alt="" className="w-full h-full object-cover" /> : p.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-semibold">{p.name}</p>
                    </div>
                    <span className="text-xs text-gray-500">{p.role}</span>
                </div>
            ))}
        </div>
    );
}

function TeamsTab({ tournament }: { tournament: Tournament }) {
    const teamMap = new Map<number, { name: string; tag: string | null; captainId: number; members: { userId: number; role: string }[] }>();

    for (const reg of tournament.registrations) {
        if (reg.team) {
            if (!teamMap.has(reg.team.id)) {
                teamMap.set(reg.team.id, {
                    name: reg.team.name,
                    tag: reg.team.tag,
                    captainId: reg.team.captainId,
                    members: reg.team.members || [],
                });
            }
        }
    }

    const teams = Array.from(teamMap.entries());

    return (
        <div className="space-y-3">
            {teams.length === 0 && <p className="text-gray-400 text-sm">Пока нет команд.</p>}
            {teams.map(([id, team]) => (
                <div key={id} className="bg-[#2a2a2a] border border-[#3b3b3b] p-4">
                    <h4 className="font-semibold mb-2">{team.name} {team.tag ? `(${team.tag})` : ""}</h4>
                    <p className="text-xs text-gray-500 mb-1">Капитан: ID {team.captainId}</p>
                    <p className="text-xs text-gray-400">
                        Игроки: {team.members.map((m) => `ID ${m.userId}${m.role === "captain" ? " ★" : ""}`).join(", ")}
                    </p>
                </div>
            ))}
        </div>
    );
}

function StandingsTab({ tournamentId }: { tournamentId: number }) {
    const [standings, setStandings] = useState<TournamentStanding[]>([]);

    useEffect(() => {
        tournamentsApi.getStandings(tournamentId).then(setStandings).catch(() => {});
    }, [tournamentId]);

    const toRoman = (n: number): string => {
        const lookup: [number, string][] = [[1000,"M"],[900,"CM"],[500,"D"],[400,"CD"],[100,"C"],[90,"XC"],[50,"L"],[40,"XL"],[10,"X"],[9,"IX"],[5,"V"],[4,"IV"],[1,"I"]];
        let r = "";
        for (const [v, s] of lookup) { while (n >= v) { r += s; n -= v; } }
        return r;
    };

    return (
        <div className="bg-[#2a2a2a] border border-[#3b3b3b] overflow-x-auto">
            {standings.length === 0 ? (
                <p className="text-gray-400 text-sm p-5">Таблица пока пуста.</p>
            ) : (
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-[#3b3b3b] text-xs uppercase text-gray-400">
                            <th className="px-4 py-3 text-left">#</th>
                            <th className="px-4 py-3 text-left">Команда</th>
                            <th className="px-4 py-3 text-center">Победы</th>
                            <th className="px-4 py-3 text-center">Поражения</th>
                            <th className="px-4 py-3 text-center">Ничьи</th>
                            <th className="px-4 py-3 text-center">Очки</th>
                        </tr>
                    </thead>
                    <tbody>
                        {standings.map((s, i) => (
                            <tr key={s.id} className="border-b border-[#3b3b3b]">
                                <td className="px-4 py-3">
                                    <span
                                        className={i < 3 ? "text-[10px] text-[#FA6814]" : "text-xs text-gray-500"}
                                        style={i < 3 ? { fontFamily: '"Press Start 2P", system-ui' } : undefined}
                                    >
                                        {toRoman(i + 1)}
                                    </span>
                                </td>
                                <td className="px-4 py-3">{s.teamTag ? `[${s.teamTag}] ` : ""}{s.teamName || `Команда #${s.teamId}`}</td>
                                <td className="px-4 py-3 text-center text-[#4CAF50]">{s.wins}</td>
                                <td className="px-4 py-3 text-center text-[#D32F2F]">{s.losses}</td>
                                <td className="px-4 py-3 text-center text-gray-400">{s.draws}</td>
                                <td className="px-4 py-3 text-center font-semibold">{s.points}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

function StatsTab({ tournamentId }: { tournamentId: number }) {
    const [stats, setStats] = useState<TournamentStats[]>([]);

    useEffect(() => {
        tournamentsApi.getStats(tournamentId).then(setStats).catch(() => {});
    }, [tournamentId]);

    return (
        <div className="bg-[#2a2a2a] border border-[#3b3b3b] overflow-x-auto">
            {stats.length === 0 ? (
                <p className="text-gray-400 text-sm p-5">Статистика пока пуста.</p>
            ) : (
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-[#3b3b3b] text-xs uppercase text-gray-400">
                            <th className="px-4 py-3 text-left">Игрок</th>
                            <th className="px-4 py-3 text-center">Матчи</th>
                            <th className="px-4 py-3 text-center">Победы</th>
                            <th className="px-4 py-3 text-center">Поражения</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stats.map((s) => (
                            <tr key={s.id} className="border-b border-[#3b3b3b]">
                                <td className="px-4 py-3">{s.displayName || s.username || `Игрок #${s.userId}`}</td>
                                <td className="px-4 py-3 text-center">{s.matches}</td>
                                <td className="px-4 py-3 text-center text-[#4CAF50]">{s.wins}</td>
                                <td className="px-4 py-3 text-center text-[#D32F2F]">{s.losses}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

function SettingsTab({ tournament, onRefresh }: { tournament: Tournament; onRefresh: () => void }) {
    const [form, setForm] = useState({
        title: tournament.title,
        description: tournament.description || "",
        format: tournament.format,
        participantType: tournament.participantType,
        registrationOpen: tournament.registrationOpen ? tournament.registrationOpen.slice(0, 16) : "",
        registrationClose: tournament.registrationClose ? tournament.registrationClose.slice(0, 16) : "",
        startDate: tournament.startDate ? tournament.startDate.slice(0, 16) : "",
        endDate: tournament.endDate ? tournament.endDate.slice(0, 16) : "",
    });

    const formatKeys: { key: string; label: string }[] = Object.entries(FORMAT_LABELS).map(([k, v]) => ({ key: k, label: v }));

    const handleSave = async () => {
        try {
            await tournamentsApi.update(tournament.id, {
                title: form.title,
                description: form.description,
                format: form.format,
                participantType: form.participantType,
                registrationOpen: form.registrationOpen || null,
                registrationClose: form.registrationClose || null,
                startDate: form.startDate || null,
                endDate: form.endDate || null,
            });
            onRefresh();
        } catch {
            // ignore
        }
    };

    return (
        <div className="bg-[#2a2a2a] border border-[#3b3b3b] p-6 max-w-2xl">
            <h3 className="text-sm uppercase text-gray-400 mb-4">Настройки турнира</h3>

            <label className="block text-xs uppercase text-gray-400 mb-2">Название</label>
            <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-300 px-3 py-2.5 outline-none focus:border-[#FA6814] transition-colors mb-4"
            />

            <label className="block text-xs uppercase text-gray-400 mb-2">Описание</label>
            <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-300 px-3 py-2.5 outline-none focus:border-[#FA6814] transition-colors resize-none h-24 mb-4"
            />

            <label className="block text-xs uppercase text-gray-400 mb-2">Формат</label>
            <select
                value={form.format}
                onChange={(e) => setForm({ ...form, format: e.target.value as TournamentFormat })}
                className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-300 px-3 py-2.5 outline-none focus:border-[#FA6814] transition-colors cursor-pointer mb-4"
            >
                {formatKeys.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
            </select>

            <label className="block text-xs uppercase text-gray-400 mb-2">Тип участников</label>
            <div className="flex gap-3 mb-4">
                {(["team", "player"] as const).map((pt) => (
                    <button
                        key={pt}
                        onClick={() => setForm({ ...form, participantType: pt })}
                        className="px-5 py-2.5 text-sm font-semibold transition-colors cursor-pointer"
                        style={{
                            background: form.participantType === pt ? "#FA6814" : "#1e1e1e",
                            color: form.participantType === pt ? "white" : "#9ca3af",
                            border: `1px solid ${form.participantType === pt ? "#FA6814" : "#3a3a3a"}`,
                        }}
                    >
                        {PARTICIPANT_LABELS[pt]}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-xs uppercase text-gray-400 mb-2">Открытие регистрации</label>
                    <input
                        type="datetime-local"
                        value={form.registrationOpen}
                        onChange={(e) => setForm({ ...form, registrationOpen: e.target.value })}
                        className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-300 px-3 py-2.5 outline-none focus:border-[#FA6814] transition-colors"
                    />
                </div>
                <div>
                    <label className="block text-xs uppercase text-gray-400 mb-2">Закрытие регистрации</label>
                    <input
                        type="datetime-local"
                        value={form.registrationClose}
                        onChange={(e) => setForm({ ...form, registrationClose: e.target.value })}
                        className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-300 px-3 py-2.5 outline-none focus:border-[#FA6814] transition-colors"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                    <label className="block text-xs uppercase text-gray-400 mb-2">Дата начала</label>
                    <input
                        type="datetime-local"
                        value={form.startDate}
                        onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                        className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-300 px-3 py-2.5 outline-none focus:border-[#FA6814] transition-colors"
                    />
                </div>
                <div>
                    <label className="block text-xs uppercase text-gray-400 mb-2">Дата окончания</label>
                    <input
                        type="datetime-local"
                        value={form.endDate}
                        onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                        className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-300 px-3 py-2.5 outline-none focus:border-[#FA6814] transition-colors"
                    />
                </div>
            </div>

            <button
                onClick={handleSave}
                className="bg-[#FA6814] text-white px-5 py-2.5 text-sm font-semibold hover:bg-[#ff7a2a] transition-colors cursor-pointer"
            >
                Сохранить
            </button>
        </div>
    );
}
