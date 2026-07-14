import { useState } from "react";
import type { Tournament, FormField, TournamentFormat, ParticipantType } from "../../pages/tournamentData";
import { presetFields } from "../../pages/tournamentData";
import FormBuilder from "./FormBuilder";

const games = ["CS2", "Dota 2", "Valorant", "Battlefield 6", "PUBG", "Шахматы", "Tekken 8", "Street Fighter 6", "Другое"];
const formats: TournamentFormat[] = ["Single Elimination", "Double Elimination", "Round Robin", "Swiss", "Groups + Playoff"];
const participantTypes: ParticipantType[] = ["Игроки", "Команды"];

interface Props {
    onSubmit: (tournament: Tournament) => void;
    onClose: () => void;
}

export default function TournamentWizard({ onSubmit, onClose }: Props) {
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({
        name: "",
        game: "CS2",
        description: "",
        rules: "",
        participantType: "Команды" as ParticipantType,
        format: "Single Elimination" as TournamentFormat,
        date: "",
        time: "",
        maxParticipants: 16,
        minParticipants: 4,
        registrationOpen: "",
        registrationClose: "",
        autoApprove: true,
        prize: "",
    });
    const [formFields, setFormFields] = useState<FormField[]>([
        { id: "name", type: "text", label: "Nickname", required: true },
        { id: "discord", type: "text", label: "Discord", required: false },
    ]);

    const steps = ["Основная информация", "Формат", "Регистрация", "Форма"];

    const handleNext = () => {
        if (step < 4) setStep(step + 1);
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleSubmit = () => {
        const tournament: Tournament = {
            id: Date.now(),
            name: form.name,
            game: form.game,
            description: form.description,
            rules: form.rules,
            participantType: form.participantType,
            format: form.format,
            status: "Черновик",
            date: form.date,
            time: form.time,
            maxParticipants: form.maxParticipants,
            minParticipants: form.minParticipants,
            currentParticipants: 0,
            registrationOpen: form.registrationOpen,
            registrationClose: form.registrationClose,
            autoApprove: form.autoApprove,
            formFields,
            teams: [],
            registrations: [],
            matches: [],
            prize: form.prize,
            organizer: "Александр",
        };
        onSubmit(tournament);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.6)" }}
            onClick={onClose}
        >
            <div
                className="w-[700px] max-h-[90vh] overflow-y-auto bg-[#2a2a2a] border border-[#3b3b3b]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-[#3b3b3b]">
                    <h3 className="text-lg font-semibold mb-4">Новый турнир</h3>
                    <div className="flex gap-2">
                        {steps.map((s, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <div
                                    className="w-7 h-7 flex items-center justify-center text-xs font-semibold"
                                    style={{
                                        background: i + 1 <= step ? "#FA6814" : "#3a3a3a",
                                        color: i + 1 <= step ? "white" : "#6b7280",
                                        borderRadius: 4,
                                    }}
                                >
                                    {i + 1}
                                </div>
                                <span className={`text-xs ${i + 1 <= step ? "text-gray-300" : "text-gray-500"}`}>
                                    {s}
                                </span>
                                {i < steps.length - 1 && <div className="w-6 h-px bg-[#3b3b3b] mx-1" />}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Step content */}
                <div className="p-6">
                    {step === 1 && (
                        <div>
                            <h4 className="text-sm uppercase text-gray-400 mb-4">Основная информация</h4>

                            <label className="block text-xs uppercase text-gray-400 mb-2">Название *</label>
                            <input
                                type="text"
                                placeholder="Battlefield 6 Summer Cup"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-300 px-3 py-2.5 outline-none focus:border-[#FA6814] transition-colors mb-4"
                            />

                            <label className="block text-xs uppercase text-gray-400 mb-2">Игра *</label>
                            <select
                                value={form.game}
                                onChange={(e) => setForm({ ...form, game: e.target.value })}
                                className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-300 px-3 py-2.5 outline-none focus:border-[#FA6814] transition-colors cursor-pointer mb-4"
                            >
                                {games.map((g) => <option key={g} value={g}>{g}</option>)}
                            </select>

                            <label className="block text-xs uppercase text-gray-400 mb-2">Описание</label>
                            <textarea
                                placeholder="Описание турнира..."
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-300 px-3 py-2.5 outline-none focus:border-[#FA6814] transition-colors resize-none h-24 mb-4"
                            />

                            <label className="block text-xs uppercase text-gray-400 mb-2">Правила</label>
                            <textarea
                                placeholder="Правила турнира..."
                                value={form.rules}
                                onChange={(e) => setForm({ ...form, rules: e.target.value })}
                                className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-300 px-3 py-2.5 outline-none focus:border-[#FA6814] transition-colors resize-none h-24"
                            />
                        </div>
                    )}

                    {step === 2 && (
                        <div>
                            <h4 className="text-sm uppercase text-gray-400 mb-4">Формат</h4>

                            <label className="block text-xs uppercase text-gray-400 mb-2">Тип участников</label>
                            <div className="flex gap-3 mb-6">
                                {participantTypes.map((pt) => (
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
                                        {pt}
                                    </button>
                                ))}
                            </div>

                            <label className="block text-xs uppercase text-gray-400 mb-2">Формат</label>
                            <select
                                value={form.format}
                                onChange={(e) => setForm({ ...form, format: e.target.value as TournamentFormat })}
                                className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-300 px-3 py-2.5 outline-none focus:border-[#FA6814] transition-colors cursor-pointer mb-4"
                            >
                                {formats.map((f) => <option key={f} value={f}>{f}</option>)}
                            </select>

                            <label className="block text-xs uppercase text-gray-400 mb-2">Приз</label>
                            <input
                                type="text"
                                placeholder="50 000 ₽"
                                value={form.prize}
                                onChange={(e) => setForm({ ...form, prize: e.target.value })}
                                className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-300 px-3 py-2.5 outline-none focus:border-[#FA6814] transition-colors"
                            />
                        </div>
                    )}

                    {step === 3 && (
                        <div>
                            <h4 className="text-sm uppercase text-gray-400 mb-4">Регистрация</h4>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-xs uppercase text-gray-400 mb-2">Дата турнира</label>
                                    <input
                                        type="text"
                                        placeholder="15.08.2026"
                                        value={form.date}
                                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                                        className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-300 px-3 py-2.5 outline-none focus:border-[#FA6814] transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs uppercase text-gray-400 mb-2">Время</label>
                                    <input
                                        type="text"
                                        placeholder="19:00"
                                        value={form.time}
                                        onChange={(e) => setForm({ ...form, time: e.target.value })}
                                        className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-300 px-3 py-2.5 outline-none focus:border-[#FA6814] transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-xs uppercase text-gray-400 mb-2">Открытие регистрации</label>
                                    <input
                                        type="text"
                                        placeholder="01.07.2026"
                                        value={form.registrationOpen}
                                        onChange={(e) => setForm({ ...form, registrationOpen: e.target.value })}
                                        className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-300 px-3 py-2.5 outline-none focus:border-[#FA6814] transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs uppercase text-gray-400 mb-2">Закрытие регистрации</label>
                                    <input
                                        type="text"
                                        placeholder="14.08.2026"
                                        value={form.registrationClose}
                                        onChange={(e) => setForm({ ...form, registrationClose: e.target.value })}
                                        className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-300 px-3 py-2.5 outline-none focus:border-[#FA6814] transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-xs uppercase text-gray-400 mb-2">Макс. участников</label>
                                    <input
                                        type="number"
                                        min={2}
                                        value={form.maxParticipants}
                                        onChange={(e) => setForm({ ...form, maxParticipants: Number(e.target.value) })}
                                        className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-300 px-3 py-2.5 outline-none focus:border-[#FA6814] transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs uppercase text-gray-400 mb-2">Мин. участников</label>
                                    <input
                                        type="number"
                                        min={2}
                                        value={form.minParticipants}
                                        onChange={(e) => setForm({ ...form, minParticipants: Number(e.target.value) })}
                                        className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-300 px-3 py-2.5 outline-none focus:border-[#FA6814] transition-colors"
                                    />
                                </div>
                            </div>

                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.autoApprove}
                                    onChange={(e) => setForm({ ...form, autoApprove: e.target.checked })}
                                    className="w-4 h-4 accent-[#FA6814]"
                                />
                                <span className="text-sm text-gray-300">Автоматическое подтверждение заявок</span>
                            </label>
                        </div>
                    )}

                    {step === 4 && (
                        <div>
                            <h4 className="text-sm uppercase text-gray-400 mb-4">Конструктор формы регистрации</h4>
                            <FormBuilder fields={formFields} onChange={setFormFields} />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-[#3b3b3b] flex justify-between">
                    <button
                        onClick={onClose}
                        className="bg-[#303030] border border-[#404040] text-white px-5 py-2.5 text-sm font-semibold hover:bg-[#3a3a3a] transition-colors cursor-pointer"
                    >
                        Отмена
                    </button>
                    <div className="flex gap-3">
                        {step > 1 && (
                            <button
                                onClick={handleBack}
                                className="bg-[#303030] border border-[#404040] text-white px-5 py-2.5 text-sm font-semibold hover:bg-[#3a3a3a] transition-colors cursor-pointer"
                            >
                                Назад
                            </button>
                        )}
                        {step < 4 ? (
                            <button
                                onClick={handleNext}
                                className="bg-[#FA6814] text-white px-5 py-2.5 text-sm font-semibold hover:bg-[#ff7a2a] transition-colors cursor-pointer"
                            >
                                Далее
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                className="bg-[#FA6814] text-white px-5 py-2.5 text-sm font-semibold hover:bg-[#ff7a2a] transition-colors cursor-pointer"
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
