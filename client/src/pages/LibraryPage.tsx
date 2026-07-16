import { useState, useEffect, useCallback } from "react";

const BASE = import.meta.env.VITE_API_URL;

function authHeaders(): Record<string, string> {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
}

async function api<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${BASE}${path}`, { ...options, headers: { ...authHeaders(), ...options?.headers } });
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
    }
    return res.json();
}

interface Category {
    id: number;
    name: string;
    icon: string | null;
    orderIndex: number;
    documentCount: number;
}

interface Document {
    id: number;
    categoryId: number | null;
    title: string;
    description: string | null;
    filename: string;
    originalName: string;
    mimeType: string | null;
    size: number | null;
    uploadedBy: number | null;
    downloads: number;
    createdAt: string;
    categoryName: string | null;
    uploaderName: string | null;
}

interface Stats {
    documents: number;
    totalSize: number;
    downloads: number;
    categories: number;
}

const CATEGORY_ICONS: Record<string, string> = {
    "Приказы": "",
    "Протоколы": "",
    "Договоры": "",
    "Уставы": "",
    "Отчёты": "",
    "Презентации": "",
    "Шаблоны": "",
    "Другое": "",
};

function formatSize(bytes: number | null): string {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} Б`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

function getFileIcon(mime: string | null): string {
    if (!mime) return "";
    if (mime.includes("pdf")) return "";
    if (mime.includes("word") || mime.includes("docx")) return "";
    if (mime.includes("excel") || mime.includes("sheet") || mime.includes("xlsx")) return "";
    if (mime.includes("presentation") || mime.includes("pptx")) return "";
    if (mime.includes("image")) return "";
    if (mime.includes("video")) return "";
    if (mime.includes("zip") || mime.includes("rar") || mime.includes("7z")) return "";
    if (mime.includes("text")) return "";
    return "";
}

export default function LibraryPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    const [showUpload, setShowUpload] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [editingDoc, setEditingDoc] = useState<Document | null>(null);
    const [newCatName, setNewCatName] = useState("");
    const [newCatIcon, setNewCatIcon] = useState("");

    const loadCategories = useCallback(() => {
        api<Category[]>("/api/library/categories").then(setCategories).catch(() => {});
    }, []);

    const loadStats = useCallback(() => {
        api<Stats>("/api/library/stats").then(setStats).catch(() => {});
    }, []);

    const loadDocuments = useCallback(() => {
        setLoading(true);
        let url = "/api/library?";
        if (selectedCategory) url += `categoryId=${selectedCategory}&`;
        if (search) url += `search=${encodeURIComponent(search)}&`;
        api<Document[]>(url).then(setDocuments).finally(() => setLoading(false)).catch(() => setLoading(false));
    }, [selectedCategory, search]);

    useEffect(() => { loadCategories(); loadStats(); }, [loadCategories, loadStats]);
    useEffect(() => { loadDocuments(); }, [loadDocuments]);

    const handleUpload = async (file: File, title: string, description: string, categoryId: number | null) => {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("title", title);
        fd.append("description", description);
        if (categoryId) fd.append("categoryId", String(categoryId));

        const token = localStorage.getItem("token");
        await fetch(`${BASE}/api/library`, {
            method: "POST",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: fd,
        });
        setShowUpload(false);
        loadDocuments();
        loadStats();
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Удалить документ?")) return;
        await api(`/api/library/${id}`, { method: "DELETE" });
        loadDocuments();
        loadStats();
    };

    const handleAddCategory = async () => {
        if (!newCatName.trim()) return;
        await api("/api/library/categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: newCatName, icon: newCatIcon }),
        });
        setNewCatName("");
        setNewCatIcon("");
        setShowCategoryModal(false);
        loadCategories();
    };

    const handleDeleteCategory = async (id: number) => {
        if (!confirm("Удалить категорию? Документы не будут удалены.")) return;
        await api(`/api/library/categories/${id}`, { method: "DELETE" });
        if (selectedCategory === id) setSelectedCategory(null);
        loadCategories();
    };

    const handleDownload = (doc: Document) => {
        const token = localStorage.getItem("token");
        const a = document.createElement("a");
        a.href = `${BASE}/api/library/${doc.id}/download`;
        a.setAttribute("download", "");
        if (token) {
            fetch(a.href, { headers: { Authorization: `Bearer ${token}` } })
                .then((r) => r.blob())
                .then((blob) => {
                    const url = URL.createObjectURL(blob);
                    a.href = url;
                    a.click();
                    URL.revokeObjectURL(url);
                });
        }
        loadDocuments();
    };

    const handleUpdateDoc = async () => {
        if (!editingDoc) return;
        await api(`/api/library/${editingDoc.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: editingDoc.title, description: editingDoc.description, categoryId: editingDoc.categoryId }),
        });
        setEditingDoc(null);
        loadDocuments();
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl">Библиотека</h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowCategoryModal(true)}
                        className="bg-[#303030] border border-[#404040] text-white px-4 py-2 text-sm font-semibold hover:bg-[#3a3a3a] transition-colors cursor-pointer"
                    >
                        + Категория
                    </button>
                    <button
                        onClick={() => setShowUpload(true)}
                        className="bg-[#FA6814] text-white px-5 py-2.5 text-sm font-semibold uppercase hover:bg-[#ff7a2a] transition-colors cursor-pointer"
                    >
                        Загрузить файл
                    </button>
                </div>
            </div>

            {stats && (
                <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="bg-[#2a2a2a] border border-[#3b3b3b] p-4">
                        <div className="text-[10px] uppercase text-gray-500">Документов</div>
                        <div className="text-2xl text-[#FA6814] mt-1">{stats.documents}</div>
                    </div>
                    <div className="bg-[#2a2a2a] border border-[#3b3b3b] p-4">
                        <div className="text-[10px] uppercase text-gray-500">Объём</div>
                        <div className="text-2xl text-[#FA6814] mt-1">{formatSize(stats.totalSize)}</div>
                    </div>
                    <div className="bg-[#2a2a2a] border border-[#3b3b3b] p-4">
                        <div className="text-[10px] uppercase text-gray-500">Загрузок</div>
                        <div className="text-2xl text-[#FA6814] mt-1">{stats.downloads}</div>
                    </div>
                    <div className="bg-[#2a2a2a] border border-[#3b3b3b] p-4">
                        <div className="text-[10px] uppercase text-gray-500">Категорий</div>
                        <div className="text-2xl text-[#FA6814] mt-1">{stats.categories}</div>
                    </div>
                </div>
            )}

            <div className="flex gap-6">
                {/* Sidebar: categories */}
                <div className="w-56 shrink-0">
                    <h3 className="text-xs uppercase text-gray-500 mb-3">Категории</h3>
                    <div className="space-y-1">
                        <button
                            onClick={() => setSelectedCategory(null)}
                            className="w-full text-left px-3 py-2 text-sm transition-colors cursor-pointer"
                            style={{
                                background: selectedCategory === null ? "#FA6814" : "transparent",
                                color: selectedCategory === null ? "white" : "#9ca3af",
                            }}
                        >
                            Все документы
                        </button>
                        {categories.map((c) => (
                            <div key={c.id} className="flex items-center group">
                                <button
                                    onClick={() => setSelectedCategory(c.id)}
                                    className="flex-1 text-left px-3 py-2 text-sm transition-colors cursor-pointer"
                                    style={{
                                        background: selectedCategory === c.id ? "#FA6814" : "transparent",
                                        color: selectedCategory === c.id ? "white" : "#9ca3af",
                                    }}
                                >
                                    {CATEGORY_ICONS[c.name] || c.icon || ""} {c.name}
                                    <span className="ml-2 text-[10px] opacity-60">{c.documentCount}</span>
                                </button>
                                <button
                                    onClick={() => handleDeleteCategory(c.id)}
                                    className="text-gray-600 hover:text-[#D32F2F] text-xs px-2 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main: documents */}
                <div className="flex-1 min-w-0">
                    <div className="mb-4">
                        <input
                            type="text"
                            placeholder="Поиск документов..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-300 px-4 py-2.5 outline-none focus:border-[#FA6814] transition-colors"
                        />
                    </div>

                    {loading ? (
                        <div className="text-gray-400 text-sm py-10 text-center">Загрузка...</div>
                    ) : documents.length === 0 ? (
                        <div className="bg-[#1e1e1e] border border-[#3b3b3b] p-10 text-center">
                            <div className="text-4xl mb-2"></div>
                            <p className="text-gray-400 text-sm">Нет документов</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {documents.map((doc) => (
                                <div
                                    key={doc.id}
                                    className="bg-[#2a2a2a] border border-[#3b3b3b] p-4 flex items-center gap-4 hover:border-[#4a4a4a] transition-colors group"
                                >
                                    <div className="text-2xl shrink-0">{getFileIcon(doc.mimeType)}</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-sm font-semibold truncate">{doc.title}</h4>
                                            {doc.categoryName && (
                                                <span className="text-[10px] px-2 py-0.5 bg-[#1e1e1e] border border-[#3a3a3a] text-gray-400">
                                                    {doc.categoryName}
                                                </span>
                                            )}
                                        </div>
                                        {doc.description && <p className="text-xs text-gray-500 mt-1 truncate">{doc.description}</p>}
                                        <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-600">
                                            <span>{doc.originalName}</span>
                                            <span>{formatSize(doc.size)}</span>
                                            <span>{doc.downloads} загрузок</span>
                                            {doc.uploaderName && <span>Загрузил: {doc.uploaderName}</span>}
                                            <span>{new Date(doc.createdAt).toLocaleDateString("ru-RU")}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                        <button
                                            onClick={() => handleDownload(doc)}
                                            className="bg-[#4CAF50] text-white px-3 py-1.5 text-[10px] font-semibold hover:opacity-90 transition-colors cursor-pointer"
                                        >
                                            ↓ Скачать
                                        </button>
                                        <button
                                            onClick={() => setEditingDoc(doc)}
                                            className="bg-[#303030] border border-[#404040] text-white px-3 py-1.5 text-[10px] font-semibold hover:bg-[#3a3a3a] transition-colors cursor-pointer"
                                        >
                                            ✎
                                        </button>
                                        <button
                                            onClick={() => handleDelete(doc.id)}
                                            className="bg-[#303030] border border-[#D32F2F30] text-[#D32F2F] px-3 py-1.5 text-[10px] font-semibold hover:bg-[#D32F2F15] transition-colors cursor-pointer"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Upload modal */}
            {showUpload && <UploadModal categories={categories} onUpload={handleUpload} onClose={() => setShowUpload(false)} />}

            {/* Category modal */}
            {showCategoryModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }} onClick={() => setShowCategoryModal(false)}>
                    <div className="w-[400px] bg-[#2a2a2a] border border-[#3b3b3b] p-6" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold mb-4">Новая категория</h3>
                        <label className="block text-xs uppercase text-gray-400 mb-2">Название</label>
                        <input
                            type="text"
                            value={newCatName}
                            onChange={(e) => setNewCatName(e.target.value)}
                            placeholder="Приказы"
                            className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-300 px-3 py-2.5 outline-none focus:border-[#FA6814] transition-colors mb-4"
                        />
                        <label className="block text-xs uppercase text-gray-400 mb-2">Иконка</label>
                        <div className="flex gap-2 flex-wrap mb-4">
                            {Object.values(CATEGORY_ICONS).map((icon) => (
                                <button
                                    key={icon}
                                    onClick={() => setNewCatIcon(icon)}
                                    className="w-9 h-9 flex items-center justify-center text-lg border cursor-pointer"
                                    style={{
                                        background: newCatIcon === icon ? "#FA6814" : "#1e1e1e",
                                        borderColor: newCatIcon === icon ? "#FA6814" : "#3a3a3a",
                                    }}
                                >
                                    {icon}
                                </button>
                            ))}
                        </div>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowCategoryModal(false)} className="bg-[#303030] border border-[#404040] text-white px-4 py-2 text-sm font-semibold hover:bg-[#3a3a3a] transition-colors cursor-pointer">Отмена</button>
                            <button onClick={handleAddCategory} disabled={!newCatName.trim()} className="bg-[#FA6814] text-white px-4 py-2 text-sm font-semibold hover:bg-[#ff7a2a] disabled:opacity-30 transition-colors cursor-pointer">Создать</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit doc modal */}
            {editingDoc && (
                <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }} onClick={() => setEditingDoc(null)}>
                    <div className="w-[500px] bg-[#2a2a2a] border border-[#3b3b3b] p-6" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold mb-4">Редактировать документ</h3>
                        <label className="block text-xs uppercase text-gray-400 mb-2">Название</label>
                        <input
                            type="text"
                            value={editingDoc.title}
                            onChange={(e) => setEditingDoc({ ...editingDoc, title: e.target.value })}
                            className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-300 px-3 py-2.5 outline-none focus:border-[#FA6814] transition-colors mb-4"
                        />
                        <label className="block text-xs uppercase text-gray-400 mb-2">Описание</label>
                        <textarea
                            value={editingDoc.description || ""}
                            onChange={(e) => setEditingDoc({ ...editingDoc, description: e.target.value })}
                            className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-300 px-3 py-2.5 outline-none focus:border-[#FA6814] transition-colors resize-none h-20 mb-4"
                        />
                        <label className="block text-xs uppercase text-gray-400 mb-2">Категория</label>
                        <select
                            value={editingDoc.categoryId ?? ""}
                            onChange={(e) => setEditingDoc({ ...editingDoc, categoryId: e.target.value ? Number(e.target.value) : null })}
                            className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-300 px-3 py-2.5 outline-none focus:border-[#FA6814] transition-colors cursor-pointer mb-4"
                        >
                            <option value="">Без категории</option>
                            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setEditingDoc(null)} className="bg-[#303030] border border-[#404040] text-white px-4 py-2 text-sm font-semibold hover:bg-[#3a3a3a] transition-colors cursor-pointer">Отмена</button>
                            <button onClick={handleUpdateDoc} className="bg-[#FA6814] text-white px-4 py-2 text-sm font-semibold hover:bg-[#ff7a2a] transition-colors cursor-pointer">Сохранить</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function UploadModal({ categories, onUpload, onClose }: { categories: Category[]; onUpload: (file: File, title: string, description: string, categoryId: number | null) => Promise<void>; onClose: () => void }) {
    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [categoryId, setCategoryId] = useState<number | null>(null);
    const [uploading, setUploading] = useState(false);

    const handleSubmit = async () => {
        if (!file) return;
        setUploading(true);
        await onUpload(file, title, description, categoryId);
        setUploading(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }} onClick={onClose}>
            <div className="w-[500px] bg-[#2a2a2a] border border-[#3b3b3b] p-6" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-semibold mb-4">Загрузить документ</h3>

                <label className="block text-xs uppercase text-gray-400 mb-2">Файл *</label>
                <input
                    type="file"
                    onChange={(e) => {
                        const f = e.target.files?.[0] || null;
                        setFile(f);
                        if (f && !title) setTitle(f.name.replace(/\.[^.]+$/, ""));
                    }}
                    className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-300 px-3 py-2.5 outline-none focus:border-[#FA6814] transition-colors mb-4 file:mr-3 file:py-1 file:px-3 file:border-0 file:bg-[#FA6814] file:text-white file:text-xs file:font-semibold file:cursor-pointer"
                />

                <label className="block text-xs uppercase text-gray-400 mb-2">Название</label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Название документа"
                    className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-300 px-3 py-2.5 outline-none focus:border-[#FA6814] transition-colors mb-4"
                />

                <label className="block text-xs uppercase text-gray-400 mb-2">Описание</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Краткое описание..."
                    className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-300 px-3 py-2.5 outline-none focus:border-[#FA6814] transition-colors resize-none h-16 mb-4"
                />

                <label className="block text-xs uppercase text-gray-400 mb-2">Категория</label>
                <select
                    value={categoryId ?? ""}
                    onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full bg-[#1e1e1e] border border-[#3a3a3a] text-sm text-gray-300 px-3 py-2.5 outline-none focus:border-[#FA6814] transition-colors cursor-pointer mb-4"
                >
                    <option value="">Без категории</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>

                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="bg-[#303030] border border-[#404040] text-white px-4 py-2 text-sm font-semibold hover:bg-[#3a3a3a] transition-colors cursor-pointer">Отмена</button>
                    <button onClick={handleSubmit} disabled={!file || uploading} className="bg-[#FA6814] text-white px-4 py-2 text-sm font-semibold hover:bg-[#ff7a2a] disabled:opacity-30 transition-colors cursor-pointer">
                        {uploading ? "Загрузка..." : "Загрузить"}
                    </button>
                </div>
            </div>
        </div>
    );
}
