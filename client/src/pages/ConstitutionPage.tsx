import { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";

interface ConstitutionVersion {
    id: number;
    version: number;
    markdown: string;
    createdBy: { id: number; displayName: string | null; username: string } | null;
    publishedAt: string | null;
}

interface ConstitutionHistory {
    id: number;
    version: number;
    createdBy: { displayName: string | null; username: string } | null;
    publishedAt: string | null;
}

const tabs = ["Конституция", "История изменений"];

function renderMarkdown(md: string): string {
    const lines = md.split("\n");
    let html = "";
    let inList = false;

    for (const line of lines) {
        const t = line.trimEnd();

        if (t.startsWith("#### ")) {
            if (inList) { html += "</ul>"; inList = false; }
            html += `<h4 style="font-size:13px;color:#e0e0e0;margin:8px 0 4px;font-weight:600">${t.slice(5)}</h4>`;
        } else if (t.startsWith("### ")) {
            if (inList) { html += "</ul>"; inList = false; }
            html += `<h3 style="font-size:15px;color:#e0e0e0;margin:16px 0 6px;font-weight:700">${t.slice(4)}</h3>`;
        } else if (t.startsWith("## ")) {
            if (inList) { html += "</ul>"; inList = false; }
            html += `<h2 style="font-size:18px;color:#F2F2F2;margin:24px 0 8px;font-weight:700">${t.slice(3)}</h2>`;
        } else if (t.startsWith("# ")) {
            if (inList) { html += "</ul>"; inList = false; }
            html += `<h1 style="font-size:24px;color:#F2F2F2;margin:0 0 16px;font-weight:700;text-align:center">${t.slice(2)}</h1>`;
        } else if (t.startsWith("- ")) {
            if (!inList) { html += "<ul style='margin:4px 0;padding-left:24px'>"; inList = true; }
            html += `<li style="color:#c0c0c0;margin:2px 0;font-size:14px;line-height:1.6">${t.slice(2)}</li>`;
        } else if (t === "---") {
            if (inList) { html += "</ul>"; inList = false; }
            html += `<hr style="border:none;border-top:1px solid #3a3a3a;margin:16px 0">`;
        } else if (t === "") {
            if (inList) { html += "</ul>"; inList = false; }
            html += "<br>";
        } else {
            if (inList) { html += "</ul>"; inList = false; }
            html += `<p style="color:#b0b0b0;margin:4px 0;font-size:14px;line-height:1.6">${t}</p>`;
        }
    }
    if (inList) html += "</ul>";
    return html;
}

export default function ConstitutionPage() {
    const { user } = useUser();
    const isAdmin = user?.roles?.some((r) => r.priority >= 100) ?? false;

    const [activeTab, setActiveTab] = useState("Конституция");
    const [currentVersion, setCurrentVersion] = useState<ConstitutionVersion | null>(null);
    const [history, setHistory] = useState<ConstitutionHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [editMarkdown, setEditMarkdown] = useState("");
    const [saving, setSaving] = useState(false);
    const [downloading, setDownloading] = useState(false);

    const loadConstitution = () => {
        fetch(`${import.meta.env.VITE_API_URL}/api/constitution`, {
            credentials: "include",
        })
            .then((r) => (r.ok ? r.json() : { version: null }))
            .then((data) => {
                setCurrentVersion(data.version);
                if (data.version) setEditMarkdown(data.version.markdown);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    };

    const loadHistory = () => {
        fetch(`${import.meta.env.VITE_API_URL}/api/constitution/history`, {
            credentials: "include",
        })
            .then((r) => (r.ok ? r.json() : []))
            .then(setHistory)
            .catch(() => {});
    };

    useEffect(() => {
        loadConstitution();
        loadHistory();
    }, []);

    const handleSave = async () => {
        if (!editMarkdown.trim()) return;
        setSaving(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/constitution`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ markdown: editMarkdown }),
            });
            if (res.ok) {
                setEditing(false);
                loadConstitution();
                loadHistory();
            }
        } finally {
            setSaving(false);
        }
    };

    const handleDownload = async () => {
        setDownloading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/constitution/download`, {
                credentials: "include",
            });
            if (res.ok) {
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `constitution_v${currentVersion?.version || 1}.pdf`;
                a.click();
                URL.revokeObjectURL(url);
            }
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return (
            <>
                <h1 className="text-xl sm:text-2xl lg:text-3xl mb-8">Конституция</h1>
                <div className="bg-[#2b2b2b] border border-[#3b3b3b] p-10 text-center text-gray-500">Загрузка...</div>
            </>
        );
    }

    return (
        <>
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-xl sm:text-2xl lg:text-3xl">Конституция</h1>
                <div className="flex gap-2">
                    {isAdmin && !editing && currentVersion && (
                        <button
                            onClick={() => setEditing(true)}
                            className="px-4 py-2 bg-[#2a2a2a] border border-[#3a3a3a] text-gray-300 hover:text-white hover:border-[#fa6814] text-sm"
                            style={{ borderRadius: 4 }}
                        >
                            Редактировать
                        </button>
                    )}
                    <button
                        onClick={handleDownload}
                        disabled={downloading || !currentVersion}
                        className="px-4 py-2 bg-[#fa6814] text-white text-sm hover:bg-[#ff7d30] disabled:opacity-40"
                        style={{ borderRadius: 4 }}
                    >
                        {downloading ? "Генерация..." : "Скачать PDF"}
                    </button>
                </div>
            </div>

            <div className="flex gap-0 border-b border-[#3a3a3a] mb-6 overflow-x-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className="px-5 py-2.5 text-sm text-gray-400 bg-transparent border-none cursor-pointer hover:text-white transition-colors"
                        style={{
                            borderBottom: activeTab === tab ? "2px solid #FA6814" : "2px solid transparent",
                            color: activeTab === tab ? "#F2F2F2" : undefined,
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {activeTab === "Конституция" && (
                <>
                    {editing ? (
                        <div>
                            <textarea
                                value={editMarkdown}
                                onChange={(e) => setEditMarkdown(e.target.value)}
                                className="w-full bg-[#2a2a2a] border border-[#3a3a3a] text-[#e0e0e0] p-4 text-sm font-mono resize-y"
                                style={{ borderRadius: 4, minHeight: 500 }}
                                placeholder="Markdown конституции..."
                            />
                            <div className="flex gap-2 mt-4">
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="px-4 py-2 bg-[#4caf50] text-white text-sm hover:bg-[#3cb371] disabled:opacity-40"
                                    style={{ borderRadius: 4 }}
                                >
                                    {saving ? "Сохранение..." : "Опубликовать"}
                                </button>
                                <button
                                    onClick={() => { setEditing(false); setEditMarkdown(currentVersion?.markdown || ""); }}
                                    className="px-4 py-2 bg-[#2a2a2a] border border-[#3a3a3a] text-gray-300 text-sm hover:text-white hover:border-[#fa6814]"
                                    style={{ borderRadius: 4 }}
                                >
                                    Отмена
                                </button>
                            </div>
                            <div className="mt-6">
                                <p className="text-xs text-gray-500 mb-2">Предпросмотр:</p>
                                <div
                                    className="bg-[#282828] border border-[#3a3a3a] p-6"
                                    style={{ borderRadius: 4 }}
                                    dangerouslySetInnerHTML={{ __html: renderMarkdown(editMarkdown) }}
                                />
                            </div>
                        </div>
                    ) : currentVersion ? (
                        <div>
                            <div className="flex items-center gap-4 mb-6 text-xs text-gray-500">
                                <span>Версия {currentVersion.version}</span>
                                {currentVersion.publishedAt && (
                                    <span>{new Date(currentVersion.publishedAt).toLocaleDateString("ru-RU")}</span>
                                )}
                                {currentVersion.createdBy && (
                                    <span>{currentVersion.createdBy.displayName || currentVersion.createdBy.username}</span>
                                )}
                            </div>
                            <div
                                className="bg-[#282828] border border-[#3a3a3a] p-6"
                                style={{ borderRadius: 4 }}
                                dangerouslySetInnerHTML={{ __html: renderMarkdown(currentVersion.markdown) }}
                            />
                        </div>
                    ) : (
                        <div className="bg-[#2b2b2b] border border-[#3b3b3b] p-10 text-center text-gray-500">
                            <p>Конституция ещё не опубликована.</p>
                            {isAdmin && (
                                <button
                                    onClick={() => { setEditing(true); setEditMarkdown("# Конституция Конторы\n\n---\n\n## Раздел I. Общие положения\n\n### Статья 1. Название\nОписание...\n"); }}
                                    className="mt-4 px-4 py-2 bg-[#fa6814] text-white text-sm hover:bg-[#ff7d30]"
                                    style={{ borderRadius: 4 }}
                                >
                                    Создать Конституцию
                                </button>
                            )}
                        </div>
                    )}
                </>
            )}

            {activeTab === "История изменений" && (
                <div>
                    {history.length === 0 ? (
                        <div className="bg-[#2b2b2b] border border-[#3b3b3b] p-10 text-center text-gray-500">
                            История пуста.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {history.map((h) => (
                                <div
                                    key={h.id}
                                    className="flex items-center justify-between bg-[#282828] border border-[#3a3a3a] p-4"
                                    style={{ borderRadius: 4 }}
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="text-[#fa6814] text-sm font-bold">v{h.version}</span>
                                        <span className="text-gray-300 text-sm">
                                            {h.createdBy?.displayName || h.createdBy?.username || "—"}
                                        </span>
                                    </div>
                                    <span className="text-gray-500 text-xs">
                                        {h.publishedAt ? new Date(h.publishedAt).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" }) : "—"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
