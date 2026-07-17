const BASE = import.meta.env.VITE_API_URL;

function authHeaders(): Record<string, string> {
    return { "Content-Type": "application/json" };
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${BASE}${path}`, { ...options, credentials: "include", headers: { ...authHeaders(), ...options?.headers } });
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
    }
    return res.json();
}

export interface SoftwareItemData {
    id: number;
    category: string;
    title: string;
    description: string;
    tags: string[];
    version?: string;
    downloadUrl?: string;
    downloadLabel?: string;
    fileUrl?: string;
    fileName?: string;
    authorId: number;
    createdAt: string;
    author?: { id: number; displayName: string; username: string; avatar: string | null } | null;
}

export interface UploadResult {
    fileUrl: string;
    fileName: string;
    size: number;
}

export const softwareApi = {
    list: () => request<SoftwareItemData[]>("/api/software"),
    get: (id: number) => request<SoftwareItemData>(`/api/software/${id}`),
    create: (data: { category: string; title: string; description: string; tags: string[]; version?: string; downloadUrl?: string; downloadLabel?: string; fileUrl?: string; fileName?: string }) =>
        request<SoftwareItemData>("/api/software", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: Record<string, any>) =>
        request<SoftwareItemData>(`/api/software/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) =>
        request<{ ok: boolean }>(`/api/software/${id}`, { method: "DELETE" }),
    uploadFile: async (file: File): Promise<UploadResult> => {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(`${BASE}/api/software/upload`, {
            method: "POST",
            credentials: "include",
            body: formData,
        });
        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.error || `HTTP ${res.status}`);
        }
        return res.json();
    },
};
