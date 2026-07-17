import { useState, useEffect, useMemo, useRef } from "react";
import { useUser } from "../context/UserContext";
import { useSocket } from "../context/SocketContext";
import { softwareApi, type SoftwareItemData } from "../services/software";

const CATEGORY_LABELS: Record<string, string> = {
    софт: "Софт",
    игры: "Игры",
    файлы: "Файлы",
    оптимизация: "Оптимизация",
    инструкции: "Инструкции",
};

const CATEGORY_COLORS: Record<string, string> = {
    софт: "#FA6814",
    игры: "#9C27B0",
    файлы: "#4CAF50",
    оптимизация: "#5B9BD5",
    инструкции: "#FFB020",
};

const CATEGORY_ICONS: Record<string, string> = {
    софт: "📦",
    игры: "🎮",
    файлы: "📁",
    оптимизация: "⚡",
    инструкции: "📖",
};

const tabs = ["Лента", "Софт", "Игры", "Файлы", "Оптимизация", "Инструкции"];

const catForTab: Record<string, string | null> = {
    "Лента": null, "Софт": "софт", "Игры": "игры", "Файлы": "файлы", "Оптимизация": "оптимизация", "Инструкции": "инструкции",
};

function getCatForTab(tab: string): string | null {
    return catForTab[tab] ?? null;
}

function formatDate(d: Date): string {
    const months = ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function getFileIcon(name: string): string {
    const ext = name.split(".").pop()?.toLowerCase() || "";
    if (["zip","rar","7z","tar","gz"].includes(ext)) return "📦";
    if (ext === "torrent") return "🧲";
    if (["exe","msi"].includes(ext)) return "⚙️";
    if (["pdf"].includes(ext)) return "📄";
    if (["doc","docx","txt"].includes(ext)) return "📝";
    if (["png","jpg","jpeg","gif","webp"].includes(ext)) return "🖼️";
    return "📎";
}

export default function SoftwarePage() {
    const { user } = useUser();
    const socket = useSocket();
    const [activeTab, setActiveTab] = useState("Лента");
    const [items, setItems] = useState<SoftwareItemData[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [editItem, setEditItem] = useState<SoftwareItemData | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const editFileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    const [form, setForm] = useState({
        title: "", description: "", tags: "", version: "", downloadUrl: "", downloadLabel: "", category: "софт",
    });
    const [formFile, setFormFile] = useState<{ fileUrl: string; fileName: string } | null>(null);

    const currentCat = getCatForTab(activeTab);

    useEffect(() => {
        softwareApi.list().then(setItems).catch(() => {}).finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!socket) return;
        const onCreated = (item: SoftwareItemData) => setItems((prev) => [item, ...prev]);
        const onUpdated = (item: SoftwareItemData) => setItems((prev) => prev.map((i) => i.id === item.id ? item : i));
        const onDeleted = ({ id }: { id: number }) => setItems((prev) => prev.filter((i) => i.id !== id));
        socket.on("software:created", onCreated);
        socket.on("software:updated", onUpdated);
        socket.on("software:deleted", onDeleted);
        return () => { socket.off("software:created", onCreated); socket.off("software:updated", onUpdated); socket.off("software:deleted", onDeleted); };
    }, [socket]);

    const filteredItems = useMemo(() => {
        if (currentCat === null) return [...items].sort((a, b) => b.id - a.id);
        return items.filter((i) => i.category === currentCat).sort((a, b) => b.id - a.id);
    }, [items, currentCat]);

    const resetForm = () => {
        setForm({ title: "", description: "", tags: "", version: "", downloadUrl: "", downloadLabel: "", category: "софт" });
        setFormFile(null);
    };

    const openAdd = () => {
        resetForm();
        if (currentCat) setForm((p) => ({ ...p, category: currentCat }));
        setShowAdd(true);
    };

    const openEdit = (item: SoftwareItemData) => {
        setForm({
            title: item.title,
            description: item.description,
            tags: (item.tags || []).join(", "),
            version: item.version || "",
            downloadUrl: item.downloadUrl || "",
            downloadLabel: item.downloadLabel || "",
            category: item.category,
        });
        setFormFile(item.fileUrl ? { fileUrl: item.fileUrl, fileName: item.fileName || "" } : null);
        setEditItem(item);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, _isEdit: boolean) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const result = await softwareApi.uploadFile(file);
            setFormFile({ fileUrl: result.fileUrl, fileName: result.fileName });
        } catch (err) {
            alert("Ошибка загрузки файла");
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    };

    const handleAdd = async () => {
        if (!form.title.trim() || !form.description.trim() || !user) return;
        const cat = currentCat || form.category;
        try {
            const created = await softwareApi.create({
                category: cat,
                title: form.title.trim(),
                description: form.description.trim(),
                tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
                version: form.version.trim() || undefined,
                downloadUrl: form.downloadUrl.trim() || undefined,
                downloadLabel: form.downloadLabel.trim() || undefined,
                fileUrl: formFile?.fileUrl || undefined,
                fileName: formFile?.fileName || undefined,
            });
            setItems((prev) => [created, ...prev]);
            resetForm();
            setShowAdd(false);
        } catch {}
    };

    const handleEdit = async () => {
        if (!editItem || !form.title.trim() || !form.description.trim()) return;
        try {
            const updated = await softwareApi.update(editItem.id, {
                category: form.category,
                title: form.title.trim(),
                description: form.description.trim(),
                tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
                version: form.version.trim() || null,
                downloadUrl: form.downloadUrl.trim() || null,
                downloadLabel: form.downloadLabel.trim() || null,
                fileUrl: formFile?.fileUrl || null,
                fileName: formFile?.fileName || null,
            });
            setItems((prev) => prev.map((i) => i.id === updated.id ? updated : i));
            setEditItem(null);
            resetForm();
        } catch {}
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Удалить публикацию?")) return;
        try {
            await softwareApi.delete(id);
            setItems((prev) => prev.filter((i) => i.id !== id));
        } catch {}
    };

    const removeFormFile = () => setFormFile(null);

    return (
        <div className="max-w-4xl xl:max-w-5xl space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-sm text-[#FA6814]" style={{ fontFamily: '"Press Start 2P", system-ui' }}>
                    Софт
                </h1>
                <button
                    onClick={openAdd}
                    className="bg-[#FA6814] text-white px-5 py-2.5 text-sm font-semibold uppercase hover:bg-[#ff7a2a] transition-colors cursor-pointer"
                >
                    Добавить
                </button>
            </div>

            <div className="flex gap-1 border-b border-[#3b3b3b] overflow-x-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className="px-4 py-2.5 text-xs uppercase transition-colors cursor-pointer"
                        style={{
                            color: activeTab === tab ? "#FA6814" : "#6b7280",
                            borderBottom: activeTab === tab ? "2px solid #FA6814" : "2px solid transparent",
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="text-center py-10 text-gray-500 text-xs">Загрузка...</div>
            ) : filteredItems.length === 0 ? (
                <div className="bg-[#2a2a2a] border border-[#3b3b3b] p-8 text-center">
                    <p className="text-xs text-gray-500">Пока нет публикаций в этой категории.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredItems.map((item) => (
                        <div
                            key={item.id}
                            className="space-y-0"
                            style={{ background: "#2a2a2a", border: "1px solid #3b3b3b" }}
                        >
                            <div className="px-5 py-4 border-b border-[#3b3b3b]">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-[#212121] border border-[#3b3b3b] flex items-center justify-center text-[10px] text-[#FA6814] font-bold">
                                            {item.author ? (item.author.displayName || item.author.username)[0].toUpperCase() : "?"}
                                        </div>
                                        <div>
                                            <span className="text-xs text-white font-medium">{item.author?.displayName || item.author?.username || "—"}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span
                                            className="text-[9px] px-2 py-0.5 uppercase font-semibold"
                                            style={{
                                                color: CATEGORY_COLORS[item.category],
                                                background: `${CATEGORY_COLORS[item.category]}15`,
                                                border: `1px solid ${CATEGORY_COLORS[item.category]}30`,
                                            }}
                                        >
                                            {CATEGORY_LABELS[item.category]}
                                        </span>
                                        <span className="text-[10px] text-gray-500">{formatDate(new Date(item.createdAt))}</span>
                                        {user && (user.id === item.authorId || user.username === "tunev") && (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => openEdit(item)}
                                                    className="text-gray-600 hover:text-[#FA6814] text-[10px] transition-colors cursor-pointer"
                                                >
                                                    ✎
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="text-gray-600 hover:text-[#D32F2F] text-[10px] transition-colors cursor-pointer"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <h2 className="text-base font-bold text-white">{item.title}</h2>
                                <div className="flex gap-2 mt-2">
                                    {(item.tags || []).map((tag) => (
                                        <span
                                            key={tag}
                                            className="text-[9px] px-2 py-0.5 bg-[#212121] border border-[#3b3b3b] text-gray-400"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="px-5 py-4">
                                <p className="text-xs text-gray-300 leading-relaxed">{item.description}</p>
                            </div>

                            {(item.downloadUrl || item.fileUrl || item.version) && (
                                <div className="px-5 py-3 border-t border-[#3b3b3b] flex items-center justify-between">
                                    <span className="text-[10px] text-gray-500">
                                        {item.version && <>Версия: <span className="text-white">{item.version}</span></>}
                                        {item.fileName && (
                                            <>
                                                {item.version ? " · " : ""}
                                                <span className="text-gray-400">{getFileIcon(item.fileName)} {item.fileName}</span>
                                            </>
                                        )}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        {item.fileUrl && (
                                            <a
                                                href={`${import.meta.env.VITE_API_URL}${item.fileUrl}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[10px] uppercase px-5 py-2 bg-[#4CAF50] text-white font-medium hover:bg-[#5CBF60] transition-colors inline-block"
                                            >
                                                {item.downloadLabel || "Скачать файл"}
                                            </a>
                                        )}
                                        {item.downloadUrl && (
                                            <a
                                                href={item.downloadUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[10px] uppercase px-5 py-2 bg-[#FA6814] text-white font-medium hover:bg-[#FF7D30] transition-colors inline-block"
                                            >
                                                {item.downloadLabel || "Скачать"}
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {(showAdd || editItem) && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center"
                    style={{ background: "rgba(0,0,0,0.6)" }}
                    onClick={() => { setShowAdd(false); setEditItem(null); resetForm(); }}
                >
                    <div className="w-full max-w-[550px] mx-4 max-h-[85vh] overflow-y-auto bg-[#2a2a2a] border border-[#3b3b3b] p-6" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold mb-5">{editItem ? "Редактировать" : "Новая публикация"}</h3>

                        {currentCat && !editItem && (
                            <div className="mb-4">
                                <span
                                    className="text-[10px] px-2 py-0.5 uppercase font-semibold inline-block"
                                    style={{
                                        color: CATEGORY_COLORS[currentCat],
                                        background: `${CATEGORY_COLORS[currentCat]}15`,
                                        border: `1px solid ${CATEGORY_COLORS[currentCat]}30`,
                                    }}
                                >
                                    {CATEGORY_ICONS[currentCat]} {CATEGORY_LABELS[currentCat]}
                                </span>
                            </div>
                        )}

                        {(!currentCat || editItem) && (
                            <>
                                <label className="block text-xs uppercase text-gray-400 mb-2">Категория *</label>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {(["софт", "игры", "файлы", "оптимизация", "инструкции"] as const).map((cat) => (
                                        <button
                                            key={cat}
                                            onClick={() => setForm({ ...form, category: cat })}
                                            className="px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer"
                                            style={{
                                                background: form.category === cat ? CATEGORY_COLORS[cat] : "#1e1e1e",
                                                color: form.category === cat ? "white" : "#9ca3af",
                                                border: `1px solid ${form.category === cat ? CATEGORY_COLORS[cat] : "#3a3a3a"}`,
                                            }}
                                        >
                                            {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat]}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}

                        <label className="block text-xs uppercase text-gray-400 mb-2">Заголовок *</label>
                        <input
                            type="text" value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            placeholder="Название публикации"
                            className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-300 px-3 py-2.5 outline-none focus:border-[#FA6814] transition-colors mb-4"
                        />

                        <label className="block text-xs uppercase text-gray-400 mb-2">Описание *</label>
                        <textarea
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            placeholder="Описание..."
                            className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-300 px-3 py-2.5 outline-none focus:border-[#FA6814] transition-colors resize-none h-24 mb-4"
                        />

                        <label className="block text-xs uppercase text-gray-400 mb-2">Теги (через запятую)</label>
                        <input
                            type="text" value={form.tags}
                            onChange={(e) => setForm({ ...form, tags: e.target.value })}
                            placeholder="Nox App, Релиз, Обновление"
                            className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-300 px-3 py-2.5 outline-none focus:border-[#FA6814] transition-colors mb-4"
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-xs uppercase text-gray-400 mb-2">Версия</label>
                                <input
                                    type="text" value={form.version}
                                    onChange={(e) => setForm({ ...form, version: e.target.value })}
                                    placeholder="v2.0.0"
                                    className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-300 px-3 py-2.5 outline-none focus:border-[#FA6814] transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs uppercase text-gray-400 mb-2">Ссылка на скачивание</label>
                                <input
                                    type="text" value={form.downloadUrl}
                                    onChange={(e) => setForm({ ...form, downloadUrl: e.target.value })}
                                    placeholder="https://..."
                                    className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-300 px-3 py-2.5 outline-none focus:border-[#FA6814] transition-colors"
                                />
                            </div>
                        </div>

                        {form.downloadUrl && (
                            <>
                                <label className="block text-xs uppercase text-gray-400 mb-2">Текст кнопки</label>
                                <input
                                    type="text" value={form.downloadLabel}
                                    onChange={(e) => setForm({ ...form, downloadLabel: e.target.value })}
                                    placeholder="Скачать"
                                    className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-300 px-3 py-2.5 outline-none focus:border-[#FA6814] transition-colors mb-4"
                                />
                            </>
                        )}

                        <div className="mb-4">
                            <label className="block text-xs uppercase text-gray-400 mb-2">Файл (торент / архив / установщик)</label>
                            {formFile ? (
                                <div className="flex items-center gap-3 bg-[#1e1e1e] border border-[#3a3a3a] px-3 py-2.5">
                                    <span className="text-sm">{getFileIcon(formFile.fileName)}</span>
                                    <span className="text-xs text-gray-300 flex-1 truncate">{formFile.fileName}</span>
                                    <button
                                        onClick={removeFormFile}
                                        className="text-gray-600 hover:text-[#D32F2F] text-[10px] transition-colors cursor-pointer"
                                    >
                                        ✕ Удалить
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <input
                                        ref={editItem ? editFileInputRef : fileInputRef}
                                        type="file"
                                        onChange={(e) => handleFileUpload(e, !!editItem)}
                                        className="hidden"
                                        accept=".zip,.rar,.7z,.tar,.gz,.torrent,.exe,.msi,.dmg,.deb,.rpm,.pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif,.webp"
                                    />
                                    <button
                                        onClick={() => (editItem ? editFileInputRef : fileInputRef).current?.click()}
                                        disabled={uploading}
                                        className="w-full border border-dashed border-[#3a3a3a] bg-[#1e1e1e] text-gray-400 text-xs px-3 py-4 hover:border-[#FA6814] hover:text-[#FA6814] transition-colors cursor-pointer disabled:opacity-50"
                                    >
                                        {uploading ? "⏳ Загрузка..." : "📎 Нажмите для загрузки файла (.zip, .torrent, .rar, .exe и др.)"}
                                    </button>
                                </>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 mt-5">
                            <button onClick={() => { setShowAdd(false); setEditItem(null); resetForm(); }} className="bg-[#303030] border border-[#404040] text-white px-5 py-2.5 text-sm font-semibold hover:bg-[#3a3a3a] transition-colors cursor-pointer">
                                Отмена
                            </button>
                            <button
                                onClick={editItem ? handleEdit : handleAdd}
                                disabled={!form.title.trim() || !form.description.trim() || uploading}
                                className="bg-[#FA6814] text-white px-5 py-2.5 text-sm font-semibold hover:bg-[#ff7a2a] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            >
                                {editItem ? "Сохранить" : "Опубликовать"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
