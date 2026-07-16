import { useState, useEffect } from "react";
import type { Game, TournamentFormat, ParticipantType } from "../../pages/tournamentData";
import { FORMAT_LABELS, PARTICIPANT_LABELS } from "../../pages/tournamentData";
import { gamesApi } from "../../services/tournaments";
import FormBuilder from "./FormBuilder";
import type { FormField } from "../../pages/tournamentData";

const formatKeys: TournamentFormat[] = ["single_elimination", "double_elimination", "round_robin", "swiss", "groups_playoff"];
const participantKeys: ParticipantType[] = ["team", "player"];

interface Props {
    onSubmit: (data: {
        gameId: number;
        title: string;
        description: string;
        rules: string;
        participantType: ParticipantType;
        format: TournamentFormat;
        registrationOpen: string;
        registrationClose: string;
        startDate: string;
        endDate: string;
        registrationForm: FormField[];
    }) => void;
    onClose: () => void;
}

export default function TournamentWizard({ onSubmit, onClose }: Props) {
    const [step, setStep] = useState(1);
    const [games, setGames] = useState<Game[]>([]);
    const [form, setForm] = useState({
        title: "",
        gameId: 0,
        description: "",
        rules: "",
        participantType: "team" as ParticipantType,
        format: "single_elimination" as TournamentFormat,
        startDate: "",
        endDate: "",
        registrationOpen: "",
        registrationClose: "",
    });
    const [formFields, setFormFields] = useState<FormField[]>([
        { id: "name", type: "text", label: "Nickname", required: true },
        { id: "discord", type: "text", label: "Discord", required: false },
    ]);

    const steps = ["Основная информация", "Формат", "Регистрация", "Форма"];

    useEffect(() => {
        gamesApi.list().then(setGames).catch(() => {});
    }, []);

    const handleNext = () => { if (step < 4) setStep(step + 1); };
    const handleBack = () => { if (step > 1) setStep(step - 1); };

    const handleSubmit = () => {
        onSubmit({
            gameId: form.gameId,
            title: form.title,
            description: form.description,
            rules: form.rules,
            participantType: form.participantType,
            format: form.format,
            registrationOpen: form.registrationOpen,
            registrationClose: form.registrationClose,
            startDate: form.startDate,
            endDate: form.endDate,
            registrationForm: formFields,
        });
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.6)" }}
            onClick={onClose}
        >
            <div
                className="w-full max-w-[900px] max-h-[90vh] flex flex-col bg-[#2a2a2a] border border-[#3b3b3b]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header + step indicator */}
                <div className="p-6 border-b border-[#3b3b3b] shrink-0">
                    <h3 className="text-lg font-semibold mb-5">Новый турнир</h3>
                    <div className="flex items-center gap-2">
                        {steps.map((s, i) => {
                            const active = i + 1 <= step;
                            const current = i + 1 === step;
                            return (
                                <div key={i} className="flex items-center gap-2">
                                    <div
                                        className="w-8 h-8 flex items-center justify-center text-xs font-bold transition-colors"
                                        style={{
                                            background: active ? "#FA6814" : "#3a3a3a",
                                            color: active ? "white" : "#6b7280",
                                        }}
                                    >
                                        {i + 1}
                                    </div>
                                    <span className={`text-xs hidden sm:inline ${current ? "text-white font-medium" : active ? "text-gray-300" : "text-gray-500"}`}>
                                        {s}
                                    </span>
                                    {i < steps.length - 1 && (
                                        <div className="w-8 h-px mx-1" style={{ background: i + 1 < step ? "#FA6814" : "#3b3b3b" }} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {step === 1 && (
                        <div>
                            <label className="block text-sm text-gray-300 mb-2">Название *</label>
                            <input
                                type="text"
                                placeholder="Battlefield 6 Summer Cup"
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-200 px-4 py-3 outline-none focus:border-[#FA6814] transition-colors mb-5"
                            />

                            <label className="block text-sm text-gray-300 mb-2">Игра *</label>
                            <select
                                value={form.gameId}
                                onChange={(e) => setForm({ ...form, gameId: Number(e.target.value) })}
                                className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-200 px-4 py-3 outline-none focus:border-[#FA6814] transition-colors cursor-pointer mb-5"
                            >
                                <option value={0}>Выберите игру</option>
                                {games.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                            </select>

                            <label className="block text-sm text-gray-300 mb-2">Описание</label>
                            <textarea
                                placeholder="Описание турнира..."
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-200 px-4 py-3 outline-none focus:border-[#FA6814] transition-colors resize-none h-28 mb-5"
                            />

                            <label className="block text-sm text-gray-300 mb-2">Правила</label>
                            <textarea
                                placeholder="Правила турнира..."
                                value={form.rules}
                                onChange={(e) => setForm({ ...form, rules: e.target.value })}
                                className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-200 px-4 py-3 outline-none focus:border-[#FA6814] transition-colors resize-none h-28"
                            />
                        </div>
                    )}

                    {step === 2 && (
                        <div>
                            <label className="block text-sm text-gray-300 mb-3">Тип участников</label>
                            <div className="flex gap-3 mb-8">
                                {participantKeys.map((pt) => (
                                    <button
                                        key={pt}
                                        onClick={() => setForm({ ...form, participantType: pt })}
                                        className="px-6 py-3 text-sm font-semibold transition-colors cursor-pointer"
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

                            <label className="block text-sm text-gray-300 mb-3">Формат</label>
                            <select
                                value={form.format}
                                onChange={(e) => setForm({ ...form, format: e.target.value as TournamentFormat })}
                                className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-200 px-4 py-3 outline-none focus:border-[#FA6814] transition-colors cursor-pointer"
                            >
                                {formatKeys.map((f) => <option key={f} value={f}>{FORMAT_LABELS[f]}</option>)}
                            </select>
                        </div>
                    )}

                    {step === 3 && (
                        <div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                                <div>
                                    <label className="block text-sm text-gray-300 mb-2">Открытие регистрации</label>
                                    <input
                                        type="datetime-local"
                                        value={form.registrationOpen}
                                        onChange={(e) => setForm({ ...form, registrationOpen: e.target.value })}
                                        className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-200 px-4 py-3 outline-none focus:border-[#FA6814] transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-300 mb-2">Закрытие регистрации</label>
                                    <input
                                        type="datetime-local"
                                        value={form.registrationClose}
                                        onChange={(e) => setForm({ ...form, registrationClose: e.target.value })}
                                        className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-200 px-4 py-3 outline-none focus:border-[#FA6814] transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm text-gray-300 mb-2">Дата начала</label>
                                    <input
                                        type="datetime-local"
                                        value={form.startDate}
                                        onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                                        className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-200 px-4 py-3 outline-none focus:border-[#FA6814] transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-300 mb-2">Дата окончания</label>
                                    <input
                                        type="datetime-local"
                                        value={form.endDate}
                                        onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                                        className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-200 px-4 py-3 outline-none focus:border-[#FA6814] transition-colors"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div>
                            <FormBuilder fields={formFields} onChange={setFormFields} />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-[#3b3b3b] flex justify-between shrink-0">
                    <button
                        onClick={onClose}
                        className="bg-[#303030] border border-[#404040] text-white px-6 py-2.5 text-sm font-semibold hover:bg-[#3a3a3a] transition-colors cursor-pointer"
                    >
                        Отмена
                    </button>
                    <div className="flex gap-3">
                        {step > 1 && (
                            <button
                                onClick={handleBack}
                                className="bg-[#303030] border border-[#404040] text-white px-6 py-2.5 text-sm font-semibold hover:bg-[#3a3a3a] transition-colors cursor-pointer"
                            >
                                Назад
                            </button>
                        )}
                        {step < 4 ? (
                            <button
                                onClick={handleNext}
                                className="bg-[#FA6814] text-white px-6 py-2.5 text-sm font-semibold hover:bg-[#ff7a2a] transition-colors cursor-pointer"
                            >
                                Далее
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                className="bg-[#FA6814] text-white px-6 py-2.5 text-sm font-semibold hover:bg-[#ff7a2a] transition-colors cursor-pointer"
                            >
                                Создать турнир
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
