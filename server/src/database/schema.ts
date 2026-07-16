import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// ──────────────────────────────────────────────
//  CORE
// ──────────────────────────────────────────────

export const users = sqliteTable("users", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    uuid: text("uuid").notNull().unique(),
    username: text("username").notNull().unique(),
    displayName: text("display_name"),
    surname: text("surname"),
    patronymic: text("patronymic"),
    dateOfBirth: text("date_of_birth"),
    phone: text("phone"),
    accessKeyHash: text("access_key_hash"),
    keyLookup: text("key_lookup"),
    avatar: text("avatar"),
    email: text("email").notNull().unique(),
    status: text("status").notNull().default("active"),
    createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
    updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
    lastLogin: text("last_login"),
    lastActive: text("last_active"),
});

export const roles = sqliteTable("roles", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull().unique(),
    priority: integer("priority").notNull().default(0),
    color: text("color"),
    description: text("description"),
});

export const permissions = sqliteTable("permissions", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    code: text("code").notNull().unique(),
    module: text("module").notNull(),
    description: text("description"),
});

export const rolePermissions = sqliteTable("role_permissions", {
    roleId: integer("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
    permissionId: integer("permission_id").notNull().references(() => permissions.id, { onDelete: "cascade" }),
});

export const userRoles = sqliteTable("user_roles", {
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    roleId: integer("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
});

export const sessions = sqliteTable("sessions", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    refreshToken: text("refresh_token").notNull(),
    expiresAt: text("expires_at").notNull(),
    createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
    ip: text("ip"),
    userAgent: text("user_agent"),
});

export const auditLogs = sqliteTable("audit_logs", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id").references(() => users.id),
    action: text("action").notNull(),
    entity: text("entity").notNull(),
    entityId: integer("entity_id"),
    payload: text("payload"),
    createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
    ip: text("ip"),
});

// ──────────────────────────────────────────────
//  USERS MODULE
// ──────────────────────────────────────────────

export const profiles = sqliteTable("profiles", {
    userId: integer("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
    discord: text("discord"),
    steam: text("steam"),
    ea: text("ea"),
    battleNet: text("battle_net"),
    country: text("country"),
    bio: text("bio"),
    birthday: text("birthday"),
});

export const avatars = sqliteTable("avatars", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    path: text("path").notNull(),
    uploadedAt: text("uploaded_at").notNull().default("CURRENT_TIMESTAMP"),
});

// ──────────────────────────────────────────────
//  GAMES MODULE
// ──────────────────────────────────────────────

export const games = sqliteTable("games", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    logo: text("logo"),
    cover: text("cover"),
    description: text("description"),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
});

export const gameModes = sqliteTable("game_modes", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    gameId: integer("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
});

export const gameMaps = sqliteTable("game_maps", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    gameId: integer("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    image: text("image"),
});

export const gamePlatforms = sqliteTable("game_platforms", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    gameId: integer("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
    platform: text("platform").notNull(),
});

// ──────────────────────────────────────────────
//  TEAMS MODULE
// ──────────────────────────────────────────────

export const teams = sqliteTable("teams", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull().unique(),
    tag: text("tag"),
    logo: text("logo"),
    captainId: integer("captain_id").notNull().references(() => users.id),
    createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const teamMembers = sqliteTable("team_members", {
    teamId: integer("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("member"),
    joinedAt: text("joined_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const teamInvites = sqliteTable("team_invites", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    teamId: integer("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("pending"),
    createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
});

// ──────────────────────────────────────────────
//  TOURNAMENT MODULE
// ──────────────────────────────────────────────

export const tournamentTemplates = sqliteTable("tournament_templates", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    gameId: integer("game_id").notNull().references(() => games.id),
    name: text("name").notNull(),
    description: text("description"),
    configJson: text("config_json"),
});

export const tournaments = sqliteTable("tournaments", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    templateId: integer("template_id").references(() => tournamentTemplates.id),
    gameId: integer("game_id").notNull().references(() => games.id),
    createdBy: integer("created_by").references(() => users.id),
    title: text("title").notNull(),
    description: text("description"),
    banner: text("banner"),
    status: text("status").notNull().default("draft"),
    format: text("format").notNull().default("single_elimination"),
    participantType: text("participant_type").notNull().default("team"),
    registrationOpen: text("registration_open"),
    registrationClose: text("registration_close"),
    startDate: text("start_date"),
    endDate: text("end_date"),
    registrationForm: text("registration_form"),
});

export const tournamentRules = sqliteTable("tournament_rules", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    tournamentId: integer("tournament_id").notNull().references(() => tournaments.id, { onDelete: "cascade" }),
    markdown: text("markdown").notNull(),
    version: integer("version").notNull().default(1),
});

export const tournamentStages = sqliteTable("tournament_stages", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    tournamentId: integer("tournament_id").notNull().references(() => tournaments.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: text("type").notNull(),
    orderIndex: integer("order_index").notNull().default(0),
    settingsJson: text("settings_json"),
});

export const registrations = sqliteTable("registrations", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    tournamentId: integer("tournament_id").notNull().references(() => tournaments.id, { onDelete: "cascade" }),
    userId: integer("user_id").references(() => users.id),
    teamId: integer("team_id").references(() => teams.id),
    status: text("status").notNull().default("pending"),
    createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const registrationAnswers = sqliteTable("registration_answers", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    registrationId: integer("registration_id").notNull().references(() => registrations.id, { onDelete: "cascade" }),
    field: text("field").notNull(),
    value: text("value"),
});

export const brackets = sqliteTable("brackets", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    tournamentId: integer("tournament_id").notNull().references(() => tournaments.id, { onDelete: "cascade" }),
    stageId: integer("stage_id").references(() => tournamentStages.id),
    type: text("type").notNull(),
});

export const rounds = sqliteTable("rounds", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    bracketId: integer("bracket_id").notNull().references(() => brackets.id, { onDelete: "cascade" }),
    number: integer("number").notNull(),
});

export const matches = sqliteTable("matches", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    roundId: integer("round_id").notNull().references(() => rounds.id, { onDelete: "cascade" }),
    team1: integer("team1").references(() => teams.id),
    team2: integer("team2").references(() => teams.id),
    winner: integer("winner").references(() => teams.id),
    score1: integer("score1"),
    score2: integer("score2"),
    judgeId: integer("judge_id").references(() => users.id),
    status: text("status").notNull().default("scheduled"),
    scheduledAt: text("scheduled_at"),
});

export const matchMaps = sqliteTable("maps", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    matchId: integer("match_id").notNull().references(() => matches.id, { onDelete: "cascade" }),
    mapName: text("map_name").notNull(),
    winner: integer("winner").references(() => teams.id),
    score: text("score"),
});

export const standings = sqliteTable("standings", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    tournamentId: integer("tournament_id").notNull().references(() => tournaments.id, { onDelete: "cascade" }),
    teamId: integer("team_id").notNull().references(() => teams.id),
    wins: integer("wins").notNull().default(0),
    losses: integer("losses").notNull().default(0),
    draws: integer("draws").notNull().default(0),
    points: integer("points").notNull().default(0),
});

export const playerStatistics = sqliteTable("statistics", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    tournamentId: integer("tournament_id").notNull().references(() => tournaments.id, { onDelete: "cascade" }),
    userId: integer("user_id").notNull().references(() => users.id),
    teamId: integer("team_id").references(() => teams.id),
    matches: integer("matches").notNull().default(0),
    wins: integer("wins").notNull().default(0),
    losses: integer("losses").notNull().default(0),
});

// ──────────────────────────────────────────────
//  ELO MODULE
// ──────────────────────────────────────────────

export const userElo = sqliteTable("user_elo", {
    userId: integer("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
    elo: integer("elo").notNull().default(1000),
    gamesPlayed: integer("games_played").notNull().default(0),
    wins: integer("wins").notNull().default(0),
    losses: integer("losses").notNull().default(0),
    updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const eloHistory = sqliteTable("elo_history", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    tournamentId: integer("tournament_id").references(() => tournaments.id),
    matchId: integer("match_id").references(() => matches.id),
    oldElo: integer("old_elo").notNull(),
    newElo: integer("new_elo").notNull(),
    change: integer("change").notNull(),
    reason: text("reason").notNull(),
    createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
});

// ──────────────────────────────────────────────
//  FORUM MODULE
// ──────────────────────────────────────────────

export const forumCategories = sqliteTable("forum_categories", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    description: text("description"),
    orderIndex: integer("order_index").notNull().default(0),
});

export const forumTopics = sqliteTable("forum_topics", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    categoryId: integer("category_id").notNull().references(() => forumCategories.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    authorId: integer("author_id").notNull().references(() => users.id),
    pinned: integer("pinned", { mode: "boolean" }).notNull().default(false),
    locked: integer("locked", { mode: "boolean" }).notNull().default(false),
    createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
    updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const forumPosts = sqliteTable("forum_posts", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    topicId: integer("topic_id").notNull().references(() => forumTopics.id, { onDelete: "cascade" }),
    authorId: integer("author_id").notNull().references(() => users.id),
    content: text("content").notNull(),
    createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
    updatedAt: text("updated_at"),
});

export const forumReactions = sqliteTable("forum_reactions", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    postId: integer("post_id").notNull().references(() => forumPosts.id, { onDelete: "cascade" }),
    userId: integer("user_id").notNull().references(() => users.id),
    emoji: text("emoji").notNull(),
});

export const forumAttachments = sqliteTable("forum_attachments", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    postId: integer("post_id").notNull().references(() => forumPosts.id, { onDelete: "cascade" }),
    path: text("path").notNull(),
    uploadedAt: text("uploaded_at").notNull().default("CURRENT_TIMESTAMP"),
});

// ──────────────────────────────────────────────
//  PORTAL MODULE
// ──────────────────────────────────────────────

export const portalForms = sqliteTable("portal_forms", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    description: text("description"),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
});

export const portalFormFields = sqliteTable("portal_form_fields", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    formId: integer("form_id").notNull().references(() => portalForms.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    type: text("type").notNull(),
    required: integer("required", { mode: "boolean" }).notNull().default(false),
    orderIndex: integer("order_index").notNull().default(0),
});

export const portalFormResponses = sqliteTable("portal_form_responses", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    formId: integer("form_id").notNull().references(() => portalForms.id, { onDelete: "cascade" }),
    userId: integer("user_id").references(() => users.id),
    data: text("data").notNull(),
    createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const docTemplates = sqliteTable("doc_templates", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    filename: text("filename").notNull(),
    placeholders: text("placeholders").notNull(),
    uploadedBy: integer("uploaded_by").references(() => users.id),
    createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const appeals = sqliteTable("appeals", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id").notNull().references(() => users.id),
    title: text("title").notNull(),
    status: text("status").notNull().default("open"),
    createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
    updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const appealMessages = sqliteTable("appeal_messages", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    appealId: integer("appeal_id").notNull().references(() => appeals.id, { onDelete: "cascade" }),
    userId: integer("user_id").notNull().references(() => users.id),
    content: text("content").notNull(),
    createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
});

// ──────────────────────────────────────────────
//  CONSTITUTION MODULE
// ──────────────────────────────────────────────

export const constitutionDocuments = sqliteTable("constitution_documents", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    activeVersion: integer("active_version"),
});

export const constitutionVersions = sqliteTable("constitution_versions", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    documentId: integer("document_id").notNull().references(() => constitutionDocuments.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    markdown: text("markdown").notNull(),
    createdBy: integer("created_by").notNull().references(() => users.id),
    publishedAt: text("published_at"),
});

// ──────────────────────────────────────────────
//  NOTIFICATIONS MODULE
// ──────────────────────────────────────────────

export const notifications = sqliteTable("notifications", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    body: text("body"),
    type: text("type").notNull().default("info"),
    read: integer("read", { mode: "boolean" }).notNull().default(false),
    createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
});

// ──────────────────────────────────────────────
//  MESSAGES MODULE
// ──────────────────────────────────────────────

export const conversations = sqliteTable("conversations", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title"),
    isGroup: integer("is_group", { mode: "boolean" }).notNull().default(false),
    createdBy: integer("created_by").references(() => users.id),
    avatar: text("avatar"),
    createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const conversationParticipants = sqliteTable("conversation_participants", {
    conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    joinedAt: text("joined_at").notNull().default("CURRENT_TIMESTAMP"),
    lastReadAt: text("last_read_at"),
    role: text("role").notNull().default("member"),
});

export const messages = sqliteTable("messages", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
    senderId: integer("sender_id").notNull().references(() => users.id),
    content: text("content"),
    attachmentPath: text("attachment_path"),
    attachmentName: text("attachment_name"),
    createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const messageReactions = sqliteTable("message_reactions", {
    messageId: integer("message_id").notNull().references(() => messages.id, { onDelete: "cascade" }),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    emoji: text("emoji").notNull(),
});

// ──────────────────────────────────────────────
//  SETTINGS MODULE
// ──────────────────────────────────────────────

export const systemSettings = sqliteTable("system_settings", {
    key: text("key").primaryKey(),
    value: text("value").notNull(),
});

// ──────────────────────────────────────────────
//  TAVERN MODULE
// ──────────────────────────────────────────────

export const recipes = sqliteTable("recipes", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    description: text("description"),
    ingredients: text("ingredients").notNull(),
    instructions: text("instructions").notNull(),
    category: text("category").notNull().default("Блюдо"),
    authorId: integer("author_id").references(() => users.id),
    image: text("image"),
    createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
});

// ──────────────────────────────────────────────
//  MEMES MODULE
// ──────────────────────────────────────────────

export const memes = sqliteTable("memes", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title"),
    image: text("image").notNull(),
    category: text("category").notNull().default("general"),
    authorId: integer("author_id").references(() => users.id),
    likes: integer("likes").notNull().default(0),
    createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const memeLikes = sqliteTable("meme_likes", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    memeId: integer("meme_id").notNull().references(() => memes.id, { onDelete: "cascade" }),
    userId: integer("user_id").notNull().references(() => users.id),
});

export const memeComments = sqliteTable("meme_comments", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    memeId: integer("meme_id").notNull().references(() => memes.id, { onDelete: "cascade" }),
    userId: integer("user_id").notNull().references(() => users.id),
    content: text("content").notNull(),
    createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
});

// ──────────────────────────────────────────────
//  EVENTS MODULE
// ──────────────────────────────────────────────

export const events = sqliteTable("events", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    description: text("description"),
    date: text("date").notNull(),
    time: text("time"),
    location: text("location"),
    category: text("category").notNull().default("general"),
    image: text("image"),
    video: text("video"),
    authorId: integer("author_id").references(() => users.id),
    createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
});

// ──────────────────────────────────────────────
//  CINEMA MODULE
// ──────────────────────────────────────────────

export const movies = sqliteTable("movies", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    year: integer("year"),
    genre: text("genre").notNull().default("Боевик"),
    rating: integer("rating"),
    description: text("description"),
    poster: text("poster"),
    addedBy: integer("added_by").references(() => users.id),
    createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const movieComments = sqliteTable("movie_comments", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    movieId: integer("movie_id").notNull().references(() => movies.id, { onDelete: "cascade" }),
    userId: integer("user_id").notNull().references(() => users.id),
    content: text("content").notNull(),
    rating: integer("rating"),
    createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const libraryCategories = sqliteTable("library_categories", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    icon: text("icon"),
    orderIndex: integer("order_index").notNull().default(0),
});

export const libraryDocuments = sqliteTable("library_documents", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    categoryId: integer("category_id").references(() => libraryCategories.id),
    title: text("title").notNull(),
    description: text("description"),
    filename: text("filename").notNull(),
    originalName: text("original_name").notNull(),
    mimeType: text("mime_type"),
    size: integer("size"),
    uploadedBy: integer("uploaded_by").references(() => users.id),
    downloads: integer("downloads").notNull().default(0),
    createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const logs = sqliteTable("logs", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id").references(() => users.id),
    action: text("action").notNull(),
    targetType: text("target_type"),
    targetId: integer("target_id"),
    details: text("details"),
    ipAddress: text("ip_address"),
    createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const softwareItems = sqliteTable("software_items", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    category: text("category").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    tags: text("tags"),
    version: text("version"),
    downloadUrl: text("download_url"),
    downloadLabel: text("download_label"),
    authorId: integer("author_id").notNull().references(() => users.id),
    createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
});
