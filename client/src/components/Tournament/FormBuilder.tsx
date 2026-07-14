import type { FormField } from "../../pages/tournamentData";
import { presetFields } from "../../pages/tournamentData";

const fieldTypes = [
    { value: "text", label: "Текст" },
    { value: "number", label: "Число" },
    { value: "date", label: "Дата" },
    { value: "select", label: "Выбор" },
    { value: "checkbox", label: "Чекбокс" },
    { value: "file", label: "Файл" },
    { value: "preset", label: "Готовое поле" },
];

interface Props {
    fields: FormField[];
    onChange: (fields: FormField[]) => void;
}

export default function FormBuilder({ fields, onChange }: Props) {
    const addField = () => {
        const newField: FormField = {
            id: `field_${Date.now()}`,
            type: "text",
            label: "Новое поле",
            required: false,
        };
        onChange([...fields, newField]);
    };

    const addPreset = (preset: { label: string; value: string }) => {
        if (fields.some((f) => f.preset === preset.value)) return;
        const newField: FormField = {
            id: preset.value,
            type: "text",
            label: preset.label,
            required: false,
            preset: preset.value,
        };
        onChange([...fields, newField]);
    };

    const updateField = (index: number, updates: Partial<FormField>) => {
        const updated = [...fields];
        updated[index] = { ...updated[index], ...updates };
        onChange(updated);
    };

    const removeField = (index: number) => {
        onChange(fields.filter((_, i) => i !== index));
    };

    const moveField = (index: number, direction: -1 | 1) => {
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= fields.length) return;
        const updated = [...fields];
        [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
        onChange(updated);
    };

    return (
        <div>
            {/* Current fields */}
            <div className="space-y-3 mb-6">
                {fields.map((field, i) => (
                    <div
                        key={field.id}
                        className="bg-[#1e1e1e] border border-[#3a3a3a] p-4 flex items-center gap-3"
                    >
                        <div className="flex flex-col gap-1">
                            <button
                                onClick={() => moveField(i, -1)}
                                className="text-gray-500 hover:text-white text-xs cursor-pointer"
                            >
                                ▲
                            </button>
                            <button
                                onClick={() => moveField(i, 1)}
                                className="text-gray-500 hover:text-white text-xs cursor-pointer"
                            >
                                ▼
                            </button>
                        </div>

                        <input
                            type="text"
                            value={field.label}
                            onChange={(e) => updateField(i, { label: e.target.value })}
                            className="flex-1 bg-[#252525] border border-[#3a3a3a] text-sm text-gray-300 px-3 py-1.5 outline-none focus:border-[#FA6814]"
                        />

                        <select
                            value={field.type}
                            onChange={(e) => updateField(i, { type: e.target.value as FormField["type"] })}
                            className="bg-[#252525] border border-[#3a3a3a] text-xs text-gray-300 px-2 py-1.5 outline-none cursor-pointer"
                        >
                            {fieldTypes.map((t) => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>

                        <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={field.required}
                                onChange={(e) => updateField(i, { required: e.target.checked })}
                                className="accent-[#FA6814]"
                            />
                            *
                        </label>

                        <button
                            onClick={() => removeField(i)}
                            className="text-gray-500 hover:text-[#D32F2F] text-sm cursor-pointer"
                        >
                            ✕
                        </button>
                    </div>
                ))}
            </div>

            {/* Add field */}
            <div className="flex gap-3 mb-6">
                <button
                    onClick={addField}
                    className="bg-[#303030] border border-[#404040] text-white px-4 py-2 text-xs font-semibold hover:bg-[#3a3a3a] transition-colors cursor-pointer"
                >
                    + Добавить поле
                </button>
            </div>

            {/* Preset fields */}
            <div>
                <p className="text-xs uppercase text-gray-400 mb-2">Готовые поля</p>
                <div className="flex flex-wrap gap-2">
                    {presetFields.map((preset) => {
                        const exists = fields.some((f) => f.preset === preset.value);
                        return (
                            <button
                                key={preset.value}
                                onClick={() => addPreset(preset)}
                                disabled={exists}
                                className="text-xs px-3 py-1.5 border transition-colors cursor-pointer"
                                style={{
                                    background: exists ? "#1e1e1e" : "#252525",
                                    borderColor: exists ? "#2a2a2a" : "#3a3a3a",
                                    color: exists ? "#4b5563" : "#9ca3af",
                                    cursor: exists ? "default" : "pointer",
                                }}
                            >
                                {exists ? "✓ " : ""}{preset.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* JSON preview */}
            <div className="mt-6">
                <p className="text-xs uppercase text-gray-400 mb-2">JSON</p>
                <pre className="bg-[#1e1e1e] border border-[#3a3a3a] p-4 text-xs text-gray-400 overflow-x-auto font-mono">
                    {JSON.stringify(
                        fields.map(({ id, type, label, required, options }) => ({
                            id, type, label, required, ...(options ? { options } : {}),
                        })),
                        null,
                        2
                    )}
                </pre>
            </div>
        </div>
    );
}
