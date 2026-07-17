export type TournamentStatus = "draft" | "registration" | "active" | "completed";
export type ParticipantType = "team" | "player";
export type TournamentFormat = "single_elimination" | "double_elimination" | "round_robin" | "swiss" | "groups_playoff";

export interface FormField {
    id: string;
    type: "text" | "number" | "date" | "select" | "multiselect" | "checkbox" | "file" | "preset";
    label: string;
    required: boolean;
    options?: string[];
    preset?: string;
}

export interface Game {
    id: number;
    name: string;
    slug: string;
    logo: string | null;
    cover: string | null;
    description: string | null;
    active: boolean;
    platforms: string[];
    maps: { id: number; name: string; image: string | null }[];
    modes: string[];
}

export interface Team {
    id: number;
    name: string;
    tag: string | null;
    logo: string | null;
    captainId: number;
    members?: { userId: number; role: string }[];
}

export interface TournamentRegistration {
    id: number;
    tournamentId: number;
    userId: number | null;
    teamId: number | null;
    status: "pending" | "approved" | "rejected";
    createdAt: string;
    team?: Team | null;
    user?: { id: number; username: string; displayName: string | null; avatar: string | null } | null;
    answers?: { id: number; field: string; value: string | null }[];
}

export interface BracketMatch {
    id: number;
    roundId: number;
    team1: number | null;
    team2: number | null;
    winner: number | null;
    score1: number | null;
    score2: number | null;
    judgeId: number | null;
    status: string;
    scheduledAt: string | null;
    team1Name: string | null;
    team2Name: string | null;
}

export interface BracketRound {
    id: number;
    bracketId: number;
    number: number;
    matches: BracketMatch[];
}

export interface Bracket {
    id: number;
    tournamentId: number;
    type: string;
    rounds: BracketRound[];
}

export interface TournamentStanding {
    id: number;
    tournamentId: number;
    teamId: number;
    wins: number;
    losses: number;
    draws: number;
    points: number;
    teamName: string | null;
    teamTag: string | null;
}

export interface TournamentStats {
    id: number;
    tournamentId: number;
    userId: number;
    teamId: number | null;
    matches: number;
    wins: number;
    losses: number;
    username: string | null;
    displayName: string | null;
    avatar: string | null;
}

export interface Tournament {
    id: number;
    templateId: number | null;
    gameId: number;
    createdBy: number | null;
    title: string;
    description: string | null;
    banner: string | null;
    status: TournamentStatus;
    format: TournamentFormat;
    participantType: ParticipantType;
    registrationOpen: string | null;
    registrationClose: string | null;
    startDate: string | null;
    endDate: string | null;
    gameName: string | null;
    rules: string | null;
    stages: { id: number; name: string; type: string }[];
    registrations: TournamentRegistration[];
    matches: BracketMatch[];
    standings: TournamentStanding[];
    stats: TournamentStats[];
    teamsCount: number;
    registrationCount?: number;
    matchCount?: number;
    creatorName: string | null;
    creatorAvatar: string | null;
    registrationForm: FormField[];
}

export interface TournamentListItem {
    id: number;
    templateId: number | null;
    gameId: number;
    createdBy: number | null;
    title: string;
    description: string | null;
    banner: string | null;
    status: TournamentStatus;
    format: TournamentFormat;
    participantType: ParticipantType;
    registrationOpen: string | null;
    registrationClose: string | null;
    startDate: string | null;
    endDate: string | null;
    gameName: string | null;
    registrationCount: number;
    matchCount: number;
    creatorName: string | null;
    creatorAvatar: string | null;
}

export interface TournamentTemplate {
    id: number;
    gameId: number;
    name: string;
    description: string | null;
    gameName: string | null;
    config: Record<string, unknown>;
}

export const STATUS_LABELS: Record<TournamentStatus, string> = {
    draft: "Черновик",
    registration: "Регистрация",
    active: "Идёт",
    completed: "Завершён",
};

export const FORMAT_LABELS: Record<TournamentFormat, string> = {
    single_elimination: "Single Elimination",
    double_elimination: "Double Elimination",
    round_robin: "Round Robin",
    swiss: "Swiss",
    groups_playoff: "Groups + Playoff",
};

export const PARTICIPANT_LABELS: Record<ParticipantType, string> = {
    team: "Команды",
    player: "Игроки",
};

export const presetFields: { label: string; value: string }[] = [
    { label: "Discord", value: "discord" },
    { label: "Steam", value: "steam" },
    { label: "EA ID", value: "ea_id" },
    { label: "Battle.net", value: "battlenet" },
    { label: "Xbox", value: "xbox" },
    { label: "PlayStation", value: "playstation" },
    { label: "Country", value: "country" },
    { label: "Team Name", value: "team_name" },
    { label: "Nickname", value: "nickname" },
];
