let API_URL = "http://localhost:5000";
let TOKEN = "";

export function setApiUrl(url: string) {
    API_URL = url.replace(/\/$/, "");
}

export function setToken(token: string) {
    TOKEN = token;
}

export function getToken() {
    return TOKEN;
}

async function request(path: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {
        "Content-Type": "application/json; charset=utf-8",
        ...(options.headers as Record<string, string> || {}),
    };
    if (TOKEN) headers["Authorization"] = `Bearer ${TOKEN}`;

    const res = await fetch(`${API_URL}${path}`, { ...options, headers });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || "Ошибка запроса");
    }
    return res.json();
}

export async function login(key: string) {
    const data = await request("/api/auth/key-login", {
        method: "POST",
        body: JSON.stringify({ key }),
    });
    TOKEN = data.token;
    return data.user;
}

export async function getUsers() {
    return request("/api/users");
}

export async function getNotifications() {
    return request("/api/notifications");
}

export async function getUnreadCount() {
    return request("/api/notifications/unread-count");
}

export async function sendNotification(userId: number, title: string, body: string, sendEmail: boolean) {
    return request("/api/notifications", {
        method: "POST",
        body: JSON.stringify({ userId, title, body, type: "info", sendEmail }),
    });
}

export async function sendBulkNotification(userIds: number[], title: string, body: string, sendEmail: boolean) {
    return request("/api/notifications/bulk-email", {
        method: "POST",
        body: JSON.stringify({ userIds, title, body }),
    });
}

export async function sendToAll(title: string, body: string, sendEmail: boolean) {
    return request("/api/notifications/send-to-all", {
        method: "POST",
        body: JSON.stringify({ title, body, sendEmail }),
    });
}
