import { useState, useEffect } from "react";
import type { Game, TournamentFormat, ParticipantType } from "../../pages/tournamentData";
import { FORMAT_LABELS, PARTICIPANT_LABELS } from "../../pages/tournamentData";
import { gamesApi } from "../../services/tournaments";

const formatKeys: TournamentFormat[] = ["single_elimination", "double_elimination", "round_robin", "swiss", "groups_playoff"];
const participantKeys: ParticipantType[] = ["team", "player"];

interface Props {
    onSubmit: (data: {
        gameId: number;
        name: string;
        description: string;
        config: {
            format: TournamentFormat;
            participantType: ParticipantType;
            rules?: string;
        };
    }) => void;
    onClose: () => void;
}

export default function TemplateWizard({ onSubmit, onClose }: Props) {
    const [games, setGames] = useState<Game[]>([]);
    const [form, setForm] = useState({
        gameId: 0,
        name: "",
        description: "",
        format: "single_elimination" as TournamentFormat,
        participantType: "team" as ParticipantType,
        rules: "",
    });

    useEffect(() => {
        gamesApi.list().then(setGames).catch(() => {});
    }, []);

    const handleSubmit = () => {
        if (!form.gameId || !form.name) return;
        onSubmit({
            gameId: form.gameId,
            name: form.name,
            description: form.description,
            config: {
                format: form.format,
                participantType: form.participantType,
                rules: form.rules || undefined,
            },
        });
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.6)" }}
            onClick={onClose}
        >
            <div
                className="w-[600px] max-h-[90vh] overflow-y-auto bg-[#2a2a2a] border border-[#3b3b3b]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 border-b border-[#3b3b3b]">
                    <h3 className="text-lg font-semibold">Новый шаблон турнира</h3>
                </div>

                <div className="p-6 space-y-5">
                    <div>
                        <label className="block text-xs uppercase text-gray-400 mb-2">Название шаблона *</label>
                        <input
                            type="text"
                            placeholder="CS2 Weekly Cup"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-300 px-3 py-2.5 outline-none focus:border-[#FA6814] transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-xs uppercase text-gray-400 mb-2">Игра *</label>
                        <select
                            value={form.gameId}
                            onChange={(e) => setForm({ ...form, gameId: Number(e.target.value) })}
                            className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-300 px-3 py-2.5 outline-none focus:border-[#FA6814] transition-colors cursor-pointer"
                        >
                            <option value={0}>Выберите игру</option>
                            {games.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs uppercase text-gray-400 mb-2">Описание</label>
                        <textarea
                            placeholder="Описание шаблона..."
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-300 px-3 py-2.5 outline-none focus:border-[#FA6814] transition-colors resize-none h-20"
                        />
                    </div>

                    <div>
                        <label className="block text-xs uppercase text-gray-400 mb-2">Формат</label>
                        <select
                            value={form.format}
                            onChange={(e) => setForm({ ...form, format: e.target.value as TournamentFormat })}
                            className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-300 px-3 py-2.5 outline-none focus:border-[#FA6814] transition-colors cursor-pointer"
                        >
                            {formatKeys.map((f) => <option key={f} value={f}>{FORMAT_LABELS[f]}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs uppercase text-gray-400 mb-2">Тип участников</label>
                        <div className="flex gap-3">
                            {participantKeys.map((pt) => (
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
                    </div>

                    <div>
                        <label className="block text-xs uppercase text-gray-400 mb-2">Правила</label>
                        <textarea
                            placeholder="Правила турнира по умолчанию..."
                            value={form.rules}
                            onChange={(e) => setForm({ ...form, rules: e.target.value })}
                            className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-300 px-3 py-2.5 outline-none focus:border-[#FA6814] transition-colors resize-none h-20"
                        />
                    </div>
                </div>

                <div className="p-6 border-t border-[#3b3b3b] flex justify-between">
                    <button
                        onClick={onClose}
                        className="bg-[#303030] border border-[#404040] text-white px-5 py-2.5 text-sm font-semibold hover:bg-[#3a3a3a] transition-colors cursor-pointer"
                    >
                        Отмена
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!form.gameId || !form.name}
                        className="bg-[#FA6814] text-white px-5 py-2.5 text-sm font-semibold hover:bg-[#ff7a2a] disabled:opacity-30 transition-colors cursor-pointer"
                    >
                        Создать шаблон
                    </button>
                </div>
            </div>
        </div>
    );
}
