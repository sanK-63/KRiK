export type TournamentStatus = "Регистрация" | "Идёт" | "Завершён" | "Черновик";
export type ParticipantType = "Игроки" | "Команды";
export type TournamentFormat = "Single Elimination" | "Double Elimination" | "Round Robin" | "Swiss" | "Groups + Playoff";

export interface FormField {
    id: string;
    type: "text" | "number" | "date" | "select" | "multiselect" | "checkbox" | "file" | "preset";
    label: string;
    required: boolean;
    options?: string[];
    preset?: string;
}

export interface Team {
    id: number;
    name: string;
    captain: string;
    players: string[];
    logo?: string;
}

export interface TournamentRegistration {
    id: number;
    participantName: string;
    teamId?: number;
    formData: Record<string, any>;
    status: "pending" | "approved" | "rejected";
    date: string;
}

export interface Match {
    id: number;
    round: number;
    position: number;
    player1: string;
    player2: string;
    score1: number;
    score2: number;
    maps: { name: string; winner: string }[];
    status: "pending" | "live" | "finished";
    judge?: string;
    comment?: string;
    tournamentId: number;
}

export interface Tournament {
    id: number;
    name: string;
    game: string;
    description: string;
    banner?: string;
    rules?: string;
    participantType: ParticipantType;
    format: TournamentFormat;
    status: TournamentStatus;
    date: string;
    time: string;
    maxParticipants: number;
    minParticipants: number;
    currentParticipants: number;
    registrationOpen: string;
    registrationClose: string;
    autoApprove: boolean;
    formFields: FormField[];
    teams: Team[];
    registrations: TournamentRegistration[];
    matches: Match[];
    prize: string;
    organizer: string;
}

export interface TournamentTemplate {
    id: number;
    name: string;
    game: string;
    participantType: ParticipantType;
    format: TournamentFormat;
    maxParticipants: number;
    minParticipants: number;
    formFields: FormField[];
    rules: string;
}

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

export const defaultFormFields: FormField[] = [
    { id: " nickname", type: "text", label: "Nickname", required: true },
    { id: "discord", type: "text", label: "Discord", required: false },
];

export const mockTournaments: Tournament[] = [
    {
        id: 1,
        name: "Battlefield 6 Summer Cup",
        game: "Battlefield 6",
        description: "Летний кубок по Battlefield 6. Команды 5v5, жёсткая борьба за титул чемпиона Синдиката.",
        rules: "1. Честь\n2. Без читов\n3. Решения судей окончательны",
        participantType: "Команды",
        format: "Single Elimination",
        status: "Регистрация",
        date: "15.08.2026",
        time: "19:00",
        maxParticipants: 16,
        minParticipants: 4,
        currentParticipants: 14,
        registrationOpen: "01.07.2026",
        registrationClose: "14.08.2026",
        autoApprove: true,
        formFields: [
            { id: "team_name", type: "text", label: "Название команды", required: true },
            { id: "ea_id", type: "text", label: "EA ID", required: true },
            { id: "platform", type: "select", label: "Платформа", options: ["PC", "Xbox", "PlayStation"], required: true },
        ],
        teams: [
            { id: 1, name: "Syndicate", captain: "Александр", players: ["Player2", "Player3", "Player4", "Player5"] },
            { id: 2, name: "Phantom", captain: "Дмитрий", players: ["Ghost", "Shadow", "Blaze", "Storm"] },
        ],
        registrations: [],
        matches: [],
        prize: "100 000 ₽",
        organizer: "Александр",
    },
    {
        id: 2,
        name: "CS2 Midnight League",
        game: "CS2",
        description: "Ночная лига для самых стойких. Матчи начинаются после 22:00.",
        participantType: "Команды",
        format: "Double Elimination",
        status: "Идёт",
        date: "10.07.2026",
        time: "22:00",
        maxParticipants: 8,
        minParticipants: 4,
        currentParticipants: 8,
        registrationOpen: "01.07.2026",
        registrationClose: "09.07.2026",
        autoApprove: false,
        formFields: defaultFormFields,
        teams: [],
        registrations: [],
        matches: [
            { id: 1, round: 1, position: 0, player1: "Syndicate", player2: "Phantom", score1: 2, score2: 1, maps: [{ name: "Dust2", winner: "Syndicate" }, { name: "Mirage", winner: "Phantom" }, { name: "Inferno", winner: "Syndicate" }], status: "finished", tournamentId: 2 },
            { id: 2, round: 1, position: 1, player1: "Wolves", player2: "Eagle One", score1: 0, score2: 0, maps: [], status: "pending", tournamentId: 2 },
        ],
        prize: "30 000 ₽",
        organizer: "Дмитрий",
    },
    {
        id: 3,
        name: "Шахматный блиц",
        game: "Шахматы",
        description: "Блиц-турнир. 3 минуты на партию. Без снисхождения.",
        participantType: "Игроки",
        format: "Swiss",
        status: "Завершён",
        date: "05.07.2026",
        time: "14:00",
        maxParticipants: 32,
        minParticipants: 8,
        currentParticipants: 24,
        registrationOpen: "20.06.2026",
        registrationClose: "04.07.2026",
        autoApprove: true,
        formFields: [
            { id: "nickname", type: "text", label: "Nickname", required: true },
            { id: "rating", type: "number", label: "Рейтинг", required: false },
        ],
        teams: [],
        registrations: [],
        matches: [],
        prize: "Бронза + Грамота",
        organizer: "Елена",
    },
];

export const mockTemplates: TournamentTemplate[] = [
    {
        id: 1,
        name: "CS2 5v5 Standard",
        game: "CS2",
        participantType: "Команды",
        format: "Single Elimination",
        maxParticipants: 16,
        minParticipants: 4,
        formFields: [
            { id: "team_name", type: "text", label: "Название команды", required: true },
            { id: "steam", type: "text", label: "Steam ID капитана", required: true },
            { id: "discord", type: "text", label: "Discord", required: true },
        ],
        rules: "Standard CS2 rules",
    },
    {
        id: 2,
        name: "Dota 2 5v5 Standard",
        game: "Dota 2",
        participantType: "Команды",
        format: "Double Elimination",
        maxParticipants: 8,
        minParticipants: 4,
        formFields: [
            { id: "team_name", type: "text", label: "Название команды", required: true },
            { id: "steam", type: "text", label: "Steam ID", required: true },
        ],
        rules: "Standard Dota 2 rules",
    },
];
