import type { Tournament, TournamentStatus } from "../../pages/tournamentData";
import { STATUS_LABELS, FORMAT_LABELS, PARTICIPANT_LABELS } from "../../pages/tournamentData";

const statusColors: Record<string, string> = {
    draft: "#9C27B0",
    registration: "#4CAF50",
    active: "#FA6814",
    completed: "#6b7280",
};

interface Props {
    tournament: Tournament;
    currentUserId: number | null;
    onBack: () => void;
    onStatusChange: (status: TournamentStatus) => void;
    onGenerateBracket: () => void;
    onDelete: () => void;
    onRegister?: () => void;
    onUnregister?: () => void;
    isRegistered?: boolean;
}

export default function TournamentControlPanel({ tournament, currentUserId, onBack, onStatusChange, onGenerateBracket, onDelete, onRegister, onUnregister, isRegistered }: Props) {
    const t = tournament;
    const isCreator = currentUserId !== null && t.createdBy === currentUserId;
    const isDraft = t.status === "draft";

    return (
        <div className="bg-[#2a2a2a] border border-[#3b3b3b] p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="text-gray-400 hover:text-white transition-colors cursor-pointer text-sm"
                    >
                        &larr; Назад
                    </button>
                    <h2 className="text-xl font-bold">{t.title}</h2>
                    <span
                        className="text-[10px] uppercase font-semibold px-2 py-0.5"
                        style={{
                            color: statusColors[t.status],
                            background: `${statusColors[t.status]}15`,
                            border: `1px solid ${statusColors[t.status]}30`,
                        }}
                    >
                        {STATUS_LABELS[t.status]}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
                <div className="bg-[#1e1e1e] border border-[#3a3a3a] p-3">
                    <div className="text-[10px] uppercase text-gray-500">Игра</div>
                    <div className="text-xl font-bold text-[#FA6814]">{t.gameName || "—"}</div>
                </div>
                <div className="bg-[#1e1e1e] border border-[#3a3a3a] p-3">
                    <div className="text-[10px] uppercase text-gray-500">Формат</div>
                    <div className="text-xl font-bold text-[#FA6814]">{FORMAT_LABELS[t.format]}</div>
                </div>
                <div className="bg-[#1e1e1e] border border-[#3a3a3a] p-3">
                    <div className="text-[10px] uppercase text-gray-500">Участники</div>
                    <div className="text-xl font-bold text-[#FA6814]">{t.registrations.length}</div>
                </div>
                <div className="bg-[#1e1e1e] border border-[#3a3a3a] p-3">
                    <div className="text-[10px] uppercase text-gray-500">Матчи</div>
                    <div className="text-xl font-bold text-[#FA6814]">{t.matches.length}</div>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
                <div className="text-xs text-gray-500">
                    Тип: <span className="text-gray-300">{PARTICIPANT_LABELS[t.participantType]}</span>
                </div>
                <div className="text-xs text-gray-500 ml-4">
                    Команды: <span className="text-gray-300">{t.teamsCount}</span>
                </div>
                {t.creatorName && (
                    <div className="text-xs text-gray-500 ml-4 flex items-center gap-1">
                        Создатель:
                        {t.creatorAvatar && <img src={t.creatorAvatar} className="w-4 h-4" style={{ borderRadius: 4, objectFit: "cover" }} />}
                        <span className="text-gray-300">{t.creatorName}</span>
                    </div>
                )}
            </div>

            <div className="flex flex-wrap gap-2">
                {t.status === "registration" && (
                    <>
                        {isRegistered ? (
                            <button
                                onClick={onUnregister}
                                className="bg-[#D32F2F] text-white px-4 py-2 text-xs font-semibold hover:opacity-90 transition-colors cursor-pointer"
                            >
                                Отменить регистрацию
                            </button>
                        ) : (
                            <button
                                onClick={onRegister}
                                className="bg-[#4CAF50] text-white px-4 py-2 text-xs font-semibold hover:opacity-90 transition-colors cursor-pointer"
                            >
                                Зарегистрироваться
                            </button>
                        )}
                    </>
                )}

                {isDraft && isCreator && (
                    <button
                        onClick={() => onStatusChange("registration")}
                        className="bg-[#4CAF50] text-white px-4 py-2 text-xs font-semibold hover:opacity-90 transition-colors cursor-pointer"
                    >
                        Опубликовать
                    </button>
                )}
                {t.status === "registration" && isCreator && (
                    <>
                        <button
                            onClick={() => onStatusChange("active")}
                            className="bg-[#D32F2F] text-white px-4 py-2 text-xs font-semibold hover:opacity-90 transition-colors cursor-pointer"
                        >
                            Закрыть регистрацию
                        </button>
                        <button
                            onClick={onGenerateBracket}
                            className="bg-[#FA6814] text-white px-4 py-2 text-xs font-semibold hover:bg-[#ff7a2a] transition-colors cursor-pointer"
                        >
                            Сгенерировать сетку
                        </button>
                    </>
                )}
                {t.status === "active" && isCreator && (
                    <button
                        onClick={() => onStatusChange("completed")}
                        className="bg-[#4CAF50] text-white px-4 py-2 text-xs font-semibold hover:opacity-90 transition-colors cursor-pointer"
                    >
                        Завершить турнир
                    </button>
                )}
                {isCreator && (
                    <button
                        onClick={onDelete}
                        className="bg-[#303030] border border-[#404040] text-white px-4 py-2 text-xs font-semibold hover:bg-[#D32F2F] transition-colors cursor-pointer"
                    >
                        Удалить
                    </button>
                )}
            </div>
        </div>
    );
}
