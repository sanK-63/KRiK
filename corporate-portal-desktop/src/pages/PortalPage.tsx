import { useState, useEffect } from "react";

interface DocTemplate {
    id: number;
    name: string;
    filename: string;
    placeholders: string[];
    createdAt: string;
}

export default function PortalPage() {
    const [templates, setTemplates] = useState<DocTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<DocTemplate | null>(null);
    const [formValues, setFormValues] = useState<Record<string, string>>({});
    const [generating, setGenerating] = useState(false);
    const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
    const token = localStorage.getItem("token");

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/api/templates`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => (r.ok ? r.json() : []))
            .then(setTemplates)
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const handleSelect = (t: DocTemplate) => {
        setSelected(t);
        const init: Record<string, string> = {};
        t.placeholders.forEach((p) => (init[p] = ""));
        setFormValues(init);
        setGeneratedUrl(null);
    };

    const handleGenerate = async () => {
        if (!selected || !token) return;
        setGenerating(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/templates/${selected.id}/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ data: formValues }),
            });
            if (res.ok) {
                const blob = await res.blob();
                if (generatedUrl) URL.revokeObjectURL(generatedUrl);
                const url = URL.createObjectURL(blob);
                setGeneratedUrl(url);
            } else {
                const err = await res.json();
                alert(err.error || "Ошибка генерации");
            }
        } catch {
            alert("Ошибка сети");
        }
        setGenerating(false);
    };

    const handleDownload = () => {
        if (!generatedUrl || !selected) return;
        const a = document.createElement("a");
        a.href = generatedUrl;
        a.download = `${selected.name}_${new Date().toISOString().slice(0, 10)}.docx`;
        a.click();
    };

    return (
        <div className="space-y-6">
            <h1 className="text-sm text-[#FA6814]" style={{ fontFamily: '"Press Start 2P", system-ui' }}>
                Портал
            </h1>

            <div className="flex gap-1 border-b border-[#3b3b3b]">
                <button className="px-4 py-2.5 text-xs font-medium text-[#FA6814] border-b-2 border-[#FA6814] transition-colors cursor-pointer">
                    Генератор документов
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
                <div className="lg:col-span-4 space-y-4">
                    <div className="p-4 space-y-3" style={{ background: "#2a2a2a", border: "1px solid #3b3b3b", borderRadius: 4 }}>
                        <h3 className="text-[10px] uppercase text-gray-400">Шаблоны документов</h3>
                        {loading ? (
                            <p className="text-xs text-gray-500">Загрузка...</p>
                        ) : templates.length === 0 ? (
                            <p className="text-xs text-gray-500">Нет доступных шаблонов</p>
                        ) : (
                            <div className="space-y-2">
                                {templates.map((t) => (
                                    <div
                                        key={t.id}
                                        onClick={() => handleSelect(t)}
                                        className="p-3 cursor-pointer transition-colors"
                                        style={{
                                            background: selected?.id === t.id ? "#333" : "#1e1e1e",
                                            border: `1px solid ${selected?.id === t.id ? "#FA6814" : "#3a3a3a"}`,
                                            borderRadius: 4,
                                        }}
                                    >
                                        <p className="text-xs text-white font-medium">{t.name}</p>
                                        <p className="text-[10px] text-gray-500 mt-0.5">{t.placeholders.length} полей</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-8">
                    {selected ? (
                        <div className="space-y-4">
                            <div className="p-4 space-y-4" style={{ background: "#2a2a2a", border: "1px solid #3b3b3b", borderRadius: 4 }}>
                                <h3 className="text-xs text-white font-medium">{selected.name}</h3>
                                <div className="space-y-3">
                                    {selected.placeholders.map((p) => (
                                        <div key={p}>
                                            <label className="text-[10px] text-gray-500 block mb-1">{p}</label>
                                            <input
                                                type="text"
                                                value={formValues[p] || ""}
                                                onChange={(e) => setFormValues((prev) => ({ ...prev, [p]: e.target.value }))}
                                                placeholder={`Введите значение...`}
                                                className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-xs text-gray-300 px-3 py-2 outline-none focus:border-[#FA6814] transition-colors"
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleGenerate}
                                        disabled={generating}
                                        className="flex-1 text-[10px] uppercase px-4 py-3 bg-[#FA6814] text-white font-medium hover:bg-[#FF7D30] disabled:opacity-50 transition-colors cursor-pointer"
                                    >
                                        {generating ? "Генерация..." : "Сгенерировать"}
                                    </button>
                                    {generatedUrl && (
                                        <button
                                            onClick={handleDownload}
                                            className="text-[10px] uppercase px-4 py-3 bg-[#4CAF50] text-white font-medium hover:bg-[#5CBF60] transition-colors cursor-pointer"
                                        >
                                            Скачать .docx
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div
                            className="flex flex-col items-center justify-center h-full min-h-[400px]"
                            style={{ background: "#2a2a2a", border: "1px solid #3b3b3b", borderRadius: 4 }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#3a3a3a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/>
                                <path d="M14 2v6h6"/>
                                <path d="M16 13H8"/>
                                <path d="M16 17H8"/>
                                <path d="M10 9H8"/>
                            </svg>
                            <p className="text-xs text-gray-500 mt-3">Выберите шаблон из списка слева</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
