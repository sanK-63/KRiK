const BASE = import.meta.env.VITE_API_URL;

function authHeaders(): Record<string, string> {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${BASE}${path}`, { ...options, headers: { ...authHeaders(), ...options?.headers } });
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
    authorId: number;
    createdAt: string;
    author?: { id: number; displayName: string; username: string; avatar: string | null } | null;
}

export const softwareApi = {
    list: () => request<SoftwareItemData[]>("/api/software"),
    get: (id: number) => request<SoftwareItemData>(`/api/software/${id}`),
    create: (data: { category: string; title: string; description: string; tags: string[]; version?: string; downloadUrl?: string; downloadLabel?: string }) =>
        request<SoftwareItemData>("/api/software", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: Record<string, any>) =>
        request<SoftwareItemData>(`/api/software/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) =>
        request<{ ok: boolean }>(`/api/software/${id}`, { method: "DELETE" }),
};
