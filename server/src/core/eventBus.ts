type EventHandler<T = any> = (data: T) => void | Promise<void>;

class EventBus {
    private handlers: Map<string, EventHandler[]> = new Map();

    on<T = any>(event: string, handler: EventHandler<T>) {
        const handlers = this.handlers.get(event) || [];
        handlers.push(handler);
        this.handlers.set(event, handlers);
    }

    off<T = any>(event: string, handler: EventHandler<T>) {
        const handlers = this.handlers.get(event) || [];
        this.handlers.set(event, handlers.filter((h) => h !== handler));
    }

    async emit<T = any>(event: string, data: T): Promise<void> {
        const handlers = this.handlers.get(event) || [];
        for (const handler of handlers) {
            try {
                await handler(data);
            } catch (error) {
                console.error(`[EventBus] Error in handler for "${event}":`, error);
            }
        }
    }
}

export const eventBus = new EventBus();

export const Events = {
    USER_LOGIN: "user.login",
    USER_LOGOUT: "user.logout",
    USER_CREATED: "user.created",
    USER_UPDATED: "user.updated",
    USER_DELETED: "user.deleted",

    TOURNAMENT_CREATED: "tournament.created",
    TOURNAMENT_UPDATED: "tournament.updated",
    TOURNAMENT_DELETED: "tournament.deleted",
    TOURNAMENT_REGISTRATION: "tournament.registration",

    TEAM_CREATED: "team.created",
    TEAM_UPDATED: "team.updated",
    TEAM_DELETED: "team.deleted",
    TEAM_MEMBER_ADDED: "team.member_added",
    TEAM_MEMBER_REMOVED: "team.member_removed",

    FORUM_TOPIC_CREATED: "forum.topic_created",
    FORUM_POST_CREATED: "forum.post_created",

    APPEAL_CREATED: "appeal.created",
    APPEAL_UPDATED: "appeal.updated",
    APPEAL_RESOLVED: "appeal.resolved",

    CONSTITUTION_UPDATED: "constitution.updated",

    VIOLATION_CREATED: "violation.created",
    VIOLATION_RESOLVED: "violation.resolved",

    RECIPE_CREATED: "recipe.created",
    RECIPE_DELETED: "recipe.deleted",

    MOVIE_CREATED: "movie.created",
    MOVIE_UPDATED: "movie.updated",
    MOVIE_DELETED: "movie.deleted",
    MOVIE_COMMENT_CREATED: "movie_comment.created",
    MOVIE_COMMENT_DELETED: "movie_comment.deleted",

    NOTIFICATION_SENT: "notification.sent",
} as const;
