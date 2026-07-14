import { useState } from "react";
import type { Tournament, TournamentTemplate } from "./tournamentData";
import { mockTournaments, mockTemplates } from "./tournamentData";
import TournamentCard from "../components/Tournament/TournamentCard";
import TournamentWizard from "../components/Tournament/TournamentWizard";
import TournamentControlPanel from "../components/Tournament/TournamentControlPanel";
import BracketView from "../components/Tournament/BracketView";
import MatchCard from "../components/Tournament/MatchCard";
import GamesPage from "./GamesPage";

const statusTabs = ["Все", "Регистрация", "Идёт", "Завершён", "Черновик"];
const mainTabs = ["Турниры", "Шаблоны", "Игры", "Архив", "Статистика"];

export default function TournamentPage() {
    const [mainTab, setMainTab] = useState("Турниры");
    const [statusFilter, setStatusFilter] = useState("Все");
    const [showWizard, setShowWizard] = useState(false);
    const [tournaments, setTournaments] = useState<Tournament[]>(mockTournaments);
    const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
    const [detailTab, setDetailTab] = useState("Главная");

    const filtered = statusFilter === "Все"
        ? tournaments
        : tournaments.filter((t) => t.status === statusFilter);

    const archived = tournaments.filter((t) => t.status === "Завершён");

    const handleCreate = (tournament: Tournament) => {
        setTournaments([tournament, ...tournaments]);
        setShowWizard(false);
        setSelectedTournament(tournament);
    };

    // Detail view
    if (selectedTournament) {
        const t = tournaments.find((tt) => tt.id === selectedTournament.id) || selectedTournament;
        const detailTabs = ["Главная", "Новости", "Правила", "Регистрация", "Участники", "Команды", "Матчи", "Сетка", "Таблица", "Статистика", "Настройки"];

        return (
            <>
                <TournamentControlPanel tournament={t} onBack={() => setSelectedTournament(null)} />

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
                    <div className="grid grid-cols-2 gap-6">
                        <div className="bg-[#2a2a2a] border border-[#3b3b3b] p-5">
                            <h3 className="text-sm uppercase text-gray-400 mb-3">Описание</h3>
                            <p className="text-sm text-gray-300 leading-relaxed">{t.description}</p>
                        </div>
                        <div className="bg-[#2a2a2a] border border-[#3b3b3b] p-5">
                            <h3 className="text-sm uppercase text-gray-400 mb-3">Информация</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between"><span className="text-gray-500">Игра</span><span>{t.game}</span></div>
                                <div className="flex justify-between"><span className="text-gray-500">Формат</span><span>{t.format}</span></div>
                                <div className="flex justify-between"><span className="text-gray-500">Дата</span><span>{t.date} {t.time}</span></div>
                                <div className="flex justify-between"><span className="text-gray-500">Тип</span><span>{t.participantType}</span></div>
                                <div className="flex justify-between"><span className="text-gray-500">Приз</span><span className="text-[#FA6814]">{t.prize}</span></div>
                                <div className="flex justify-between"><span className="text-gray-500">Регистрация</span><span>{t.registrationOpen} — {t.registrationClose}</span></div>
                            </div>
                        </div>
                    </div>
                )}

                {detailTab === "Правила" && (
                    <div className="bg-[#2a2a2a] border border-[#3b3b3b] p-6">
                        <pre className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{t.rules || "Правила не заданы."}</pre>
                    </div>
                )}

                {detailTab === "Команды" && (
                    <div className="space-y-3">
                        {t.teams.length === 0 && <p className="text-gray-400 text-sm">Пока нет команд.</p>}
                        {t.teams.map((team) => (
                            <div key={team.id} className="bg-[#2a2a2a] border border-[#3b3b3b] p-4">
                                <h4 className="font-semibold mb-2">{team.name}</h4>
                                <p className="text-xs text-gray-500 mb-1">Капитан: {team.captain}</p>
                                <p className="text-xs text-gray-400">Игроки: {team.players.join(", ")}</p>
                            </div>
                        ))}
                    </div>
                )}

                {detailTab === "Матчи" && (
                    <div className="grid grid-cols-2 gap-4">
                        {t.matches.length === 0 && <p className="text-gray-400 text-sm">Матчи ещё не созданы.</p>}
                        {t.matches.map((m) => <MatchCard key={m.id} match={m} />)}
                    </div>
                )}

                {detailTab === "Сетка" && <BracketView matches={t.matches} />}

                {(detailTab === "Новости" || detailTab === "Регистрация" || detailTab === "Участники" || detailTab === "Таблица" || detailTab === "Статистика" || detailTab === "Настройки") && (
                    <div className="bg-[#2a2a2a] border border-[#3b3b3b] p-6">
                        <p className="text-gray-400 text-sm">{detailTab} — в разработке.</p>
                    </div>
                )}
            </>
        );
    }

    // Main views
    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl">Турниры</h2>
                <button
                    onClick={() => setShowWizard(true)}
                    className="bg-[#FA6814] text-white px-5 py-2.5 text-sm font-semibold uppercase hover:bg-[#ff7a2a] transition-colors cursor-pointer"
                >
                    Создать турнир
                </button>
            </div>

            {/* Main tabs */}
            <div className="flex gap-1 mb-6 border-b border-[#3b3b3b]">
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
                    <div className="flex gap-2 mb-6">
                        {statusTabs.map((s) => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className="px-3 py-1.5 text-xs transition-colors cursor-pointer"
                                style={{
                                    background: statusFilter === s ? "#FA6814" : "#2a2a2a",
                                    color: statusFilter === s ? "white" : "#9ca3af",
                                    border: `1px solid ${statusFilter === s ? "#FA6814" : "#3b3b3b"}`,
                                }}
                            >
                                {s}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        {filtered.map((t) => (
                            <TournamentCard key={t.id} tournament={t} onClick={() => setSelectedTournament(t)} />
                        ))}
                    </div>

                    {filtered.length === 0 && (
                        <p className="text-gray-400 text-sm text-center py-10">Нет турниров с этим статусом.</p>
                    )}
                </>
            )}

            {mainTab === "Шаблоны" && (
                <div className="grid grid-cols-3 gap-4">
                    {mockTemplates.map((tpl) => (
                        <div key={tpl.id} className="bg-[#2a2a2a] border border-[#3b3b3b] p-5">
                            <h3 className="font-semibold mb-2">{tpl.name}</h3>
                            <p className="text-xs text-gray-400 mb-3">{tpl.game} · {tpl.format}</p>
                            <p className="text-xs text-gray-500 mb-3">{tpl.participantType} · до {tpl.maxParticipants}</p>
                            <button
                                onClick={() => {
                                    setFormFromTemplate(tpl);
                                    setShowWizard(true);
                                }}
                                className="bg-[#303030] border border-[#404040] text-white px-4 py-2 text-xs font-semibold hover:bg-[#3a3a3a] transition-colors cursor-pointer"
                            >
                                Использовать шаблон
                            </button>
                        </div>
                    ))}
                    <div className="bg-[#2a2a2a] border border-[#3b3b3b] border-dashed p-5 flex items-center justify-center">
                        <button
                            onClick={() => setShowWizard(true)}
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
                        <TournamentCard key={t.id} tournament={t} onClick={() => setSelectedTournament(t)} />
                    ))}
                </div>
            )}

            {mainTab === "Статистика" && (
                <div className="grid grid-cols-4 gap-4">
                    <div className="bg-[#2a2a2a] border border-[#3b3b3b] p-5">
                        <div className="text-xs uppercase text-gray-400">Всего турниров</div>
                        <div className="text-3xl text-[#FA6814] mt-2">{tournaments.length}</div>
                    </div>
                    <div className="bg-[#2a2a2a] border border-[#3b3b3b] p-5">
                        <div className="text-xs uppercase text-gray-400">Активных</div>
                        <div className="text-3xl text-[#4CAF50] mt-2">{tournaments.filter((t) => t.status === "Регистрация" || t.status === "Идёт").length}</div>
                    </div>
                    <div className="bg-[#2a2a2a] border border-[#3b3b3b] p-5">
                        <div className="text-xs uppercase text-gray-400">Всего участников</div>
                        <div className="text-3xl text-[#FA6814] mt-2">{tournaments.reduce((s, t) => s + t.currentParticipants, 0)}</div>
                    </div>
                    <div className="bg-[#2a2a2a] border border-[#3b3b3b] p-5">
                        <div className="text-xs uppercase text-gray-400">Всего матчей</div>
                        <div className="text-3xl text-[#FA6814] mt-2">{tournaments.reduce((s, t) => s + t.matches.length, 0)}</div>
                    </div>
                </div>
            )}

            {showWizard && (
                <TournamentWizard
                    onSubmit={handleCreate}
                    onClose={() => setShowWizard(false)}
                />
            )}
        </>
    );
}

function setFormFromTemplate(tpl: TournamentTemplate) {
    // Template logic handled in parent
}
