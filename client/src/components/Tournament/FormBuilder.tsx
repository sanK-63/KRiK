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

function CustomCheckbox({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <button
            type="button"
            role="checkbox"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className="w-5 h-5 shrink-0 flex items-center justify-center transition-colors cursor-pointer"
            style={{
                background: checked ? "#FA6814" : "#1e1e1e",
                border: `2px solid ${checked ? "#FA6814" : "#4a4a4a"}`,
            }}
        >
            {checked && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            )}
        </button>
    );
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
                        className="bg-[#1e1e1e] border border-[#3a3a3a] p-4 flex flex-wrap items-center gap-3"
                    >
                        <div className="flex flex-col gap-1">
                            <button
                                onClick={() => moveField(i, -1)}
                                disabled={i === 0}
                                className="text-gray-500 hover:text-white text-sm cursor-pointer disabled:opacity-30 disabled:cursor-default"
                            >
                                ▲
                            </button>
                            <button
                                onClick={() => moveField(i, 1)}
                                disabled={i === fields.length - 1}
                                className="text-gray-500 hover:text-white text-sm cursor-pointer disabled:opacity-30 disabled:cursor-default"
                            >
                                ▼
                            </button>
                        </div>

                        <input
                            type="text"
                            value={field.label}
                            onChange={(e) => updateField(i, { label: e.target.value })}
                            className="flex-1 min-w-[160px] bg-[#252525] border border-[#3a3a3a] text-sm text-gray-200 px-3 py-2 outline-none focus:border-[#FA6814]"
                        />

                        <select
                            value={field.type}
                            onChange={(e) => updateField(i, { type: e.target.value as FormField["type"] })}
                            className="bg-[#252525] border border-[#3a3a3a] text-sm text-gray-300 px-3 py-2 outline-none cursor-pointer"
                        >
                            {fieldTypes.map((t) => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>

                        <button
                            type="button"
                            onClick={() => updateField(i, { required: !field.required })}
                            className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer select-none hover:text-gray-200 transition-colors"
                        >
                            <CustomCheckbox checked={field.required} onChange={(v) => updateField(i, { required: v })} />
                            <span>Обязательное</span>
                        </button>

                        <button
                            onClick={() => removeField(i)}
                            className="text-gray-500 hover:text-[#D32F2F] text-base ml-1 cursor-pointer"
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
                    className="bg-[#303030] border border-[#404040] text-white px-4 py-2.5 text-sm font-semibold hover:bg-[#3a3a3a] transition-colors cursor-pointer"
                >
                    + Добавить поле
                </button>
            </div>

            {/* Preset fields */}
            <div>
                <p className="text-xs uppercase text-gray-400 mb-3">Готовые поля</p>
                <div className="flex flex-wrap gap-2">
                    {presetFields.map((preset) => {
                        const exists = fields.some((f) => f.preset === preset.value);
                        return (
                            <button
                                key={preset.value}
                                onClick={() => addPreset(preset)}
                                disabled={exists}
                                className="text-sm px-4 py-2 border transition-colors cursor-pointer"
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
                <pre className="bg-[#1e1e1e] border border-[#3a3a3a] p-4 text-xs text-gray-400 overflow-x-auto font-mono max-h-48">
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
