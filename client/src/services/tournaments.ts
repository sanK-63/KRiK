import type {
    Tournament,
    TournamentListItem,
    TournamentTemplate,
    Game,
    TournamentRegistration,
    Bracket,
    TournamentStanding,
    TournamentStats,
} from "../pages/tournamentData";

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

// ─── Games ───

export const gamesApi = {
    list: () => request<Game[]>("/api/games"),
    get: (id: number) => request<Game>(`/api/games/${id}`),
    create: (data: { name: string; slug: string; logo?: string; description?: string; platforms?: string[]; maps?: string[]; modes?: string[] }) =>
        request<{ id: number; name: string; slug: string }>("/api/games", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: Record<string, unknown>) =>
        request<{ ok: boolean }>(`/api/games/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) => request<{ ok: boolean }>(`/api/games/${id}`, { method: "DELETE" }),
};

// ─── Templates ───

export const templatesApi = {
    list: () => request<TournamentTemplate[]>("/api/tournament-templates"),
    get: (id: number) => request<TournamentTemplate>(`/api/tournament-templates/${id}`),
    create: (data: { gameId: number; name: string; description?: string; config?: Record<string, unknown> }) =>
        request<{ id: number; name: string; gameId: number }>("/api/tournament-templates", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: Record<string, unknown>) =>
        request<{ ok: boolean }>(`/api/tournament-templates/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) => request<{ ok: boolean }>(`/api/tournament-templates/${id}`, { method: "DELETE" }),
};

// ─── Tournaments ───

export const tournamentsApi = {
    list: () => request<TournamentListItem[]>("/api/tournaments"),

    get: (id: number) => request<Tournament>(`/api/tournaments/${id}`),

    create: (data: {
        gameId: number;
        title: string;
        description?: string;
        banner?: string;
        format?: string;
        participantType?: string;
        registrationOpen?: string;
        registrationClose?: string;
        startDate?: string;
        endDate?: string;
        rules?: string;
        templateId?: number;
        registrationForm?: { id: string; type: string; label: string; required: boolean; options?: string[] }[];
    }) => request<{ id: number; title: string; status: string }>("/api/tournaments", { method: "POST", body: JSON.stringify(data) }),

    update: (id: number, data: Record<string, unknown>) =>
        request<{ ok: boolean }>(`/api/tournaments/${id}`, { method: "PUT", body: JSON.stringify(data) }),

    delete: (id: number) => request<{ ok: boolean }>(`/api/tournaments/${id}`, { method: "DELETE" }),

    setStatus: (id: number, status: string) =>
        request<{ id: number; status: string; elo: unknown }>(`/api/tournaments/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),

    // Registrations
    getRegistrations: (id: number) => request<TournamentRegistration[]>(`/api/tournaments/${id}/registrations`),

    register: (id: number, data: { teamId?: number; answers?: { field: string; value: string }[] }) =>
        request<{ id: number; status: string }>(`/api/tournaments/${id}/register`, { method: "POST", body: JSON.stringify(data) }),

    unregister: (id: number) => request<{ ok: boolean }>(`/api/tournaments/${id}/register`, { method: "DELETE" }),

    approveRegistration: (tournamentId: number, regId: number) =>
        request<{ ok: boolean; status: string }>(`/api/tournaments/${tournamentId}/registrations/${regId}/approve`, { method: "PATCH" }),

    rejectRegistration: (tournamentId: number, regId: number) =>
        request<{ ok: boolean; status: string }>(`/api/tournaments/${tournamentId}/registrations/${regId}/reject`, { method: "PATCH" }),

    // Bracket
    generateBracket: (id: number) =>
        request<{ ok: boolean; bracketId: number; rounds: number }>(`/api/tournaments/${id}/generate-bracket`, { method: "POST" }),

    getBracket: (id: number) => request<{ brackets: Bracket[] }>(`/api/tournaments/${id}/bracket`),

    // Standings & Stats
    getStandings: (id: number) => request<TournamentStanding[]>(`/api/tournaments/${id}/standings`),
    getStats: (id: number) => request<TournamentStats[]>(`/api/tournaments/${id}/stats`),

    // Match management
    updateMatch: (tournamentId: number, matchId: number, data: { score1?: number; score2?: number; winnerTeamId?: number; status?: string; judgeId?: number }) =>
        request<{ id: number; elo: unknown }>(`/api/tournaments/${tournamentId}/matches/${matchId}`, { method: "PATCH", body: JSON.stringify(data) }),
};
