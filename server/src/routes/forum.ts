import { Router } from "express";
import { db, sqlite } from "../database";
import { users } from "../database/schema";
import { eq } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth";
import { getIO } from "../socket";
import { auditLog } from "../core/audit";
import { validate } from "../middleware/validate";
import { createPostSchema, createCommentSchema } from "../middleware/schemas";

const router = Router();

const isAdmin = (userId: number): boolean => {
    const user = db.select().from(users).where(eq(users.id, userId)).get() as any;
    return user?.username === "tunev";
};

function enrichPost(post: any, userId?: number) {
    if (!post) return null;
    const author = sqlite.prepare("SELECT id, display_name, username, avatar FROM users WHERE id = ?").get(post.author_id) as any;
    const commentCount = (sqlite.prepare("SELECT COUNT(*) as c FROM forum_comments WHERE post_id = ?").get(post.id) as any).c;

    let pollOptions: string[] | null = null;
    let pollResults: number[] | null = null;
    let userVote: number | null = null;

    if (post.poll_options) {
        try {
            pollOptions = JSON.parse(post.poll_options);
            pollResults = pollOptions!.map((_: string, i: number) =>
                (sqlite.prepare("SELECT COUNT(*) as c FROM forum_poll_votes WHERE post_id = ? AND option_index = ?").get(post.id, i) as any).c
            );
            if (userId) {
                const vote = sqlite.prepare("SELECT option_index FROM forum_poll_votes WHERE post_id = ? AND user_id = ?").get(post.id, userId) as any;
                userVote = vote ? vote.option_index : null;
            }
        } catch {}
    }

    return {
        ...post,
        authorName: author?.display_name || author?.username || "—",
        authorAvatar: author?.avatar || null,
        commentCount,
        pollOptions,
        pollResults,
        userVote,
    };
}

function enrichComment(comment: any): any {
    if (!comment) return null;
    const author = sqlite.prepare("SELECT id, display_name, username, avatar FROM users WHERE id = ?").get(comment.user_id) as any;
    const likes = (sqlite.prepare("SELECT COUNT(*) as c FROM forum_likes WHERE comment_id = ?").get(comment.id) as any).c;
    const replies = sqlite.prepare("SELECT * FROM forum_comments WHERE parent_id = ? ORDER BY created_at ASC").all(comment.id).map(enrichComment);
    return {
        ...comment,
        authorName: author?.display_name || author?.username || "—",
        authorAvatar: author?.avatar || null,
        likes,
        replies,
    };
}

// GET /api/forum — list all posts
router.get("/", (req, res) => {
    const userId = (req as any).userId;
    const posts = sqlite.prepare("SELECT * FROM forum_posts ORDER BY pinned DESC, created_at DESC").all();
    res.json(posts.map((p) => enrichPost(p, userId)));
});

// GET /api/forum/:id — get single post with comments
router.get("/:id", (req, res) => {
    const userId = (req as any).userId;
    const post = sqlite.prepare("SELECT * FROM forum_posts WHERE id = ?").get(req.params.id) as any;
    if (!post) return res.status(404).json({ error: "Post not found" });

    const topComments = sqlite.prepare("SELECT * FROM forum_comments WHERE post_id = ? AND parent_id IS NULL ORDER BY created_at ASC").all(post.id);
    res.json({
        ...enrichPost(post, userId),
        comments: topComments.map(enrichComment),
    });
});

// POST /api/forum — create post (with optional poll_options)
router.post("/", authMiddleware, validate(createPostSchema), (req, res) => {
    const { title, content, category, pollOptions } = req.body;
    if (!title || !content) return res.status(400).json({ error: "Title and content required" });
    const userId = (req as any).userId;

    const pollJson = (pollOptions && pollOptions.length >= 2) ? JSON.stringify(pollOptions) : null;
    const result = sqlite.prepare("INSERT INTO forum_posts (title, content, category, author_id, poll_options) VALUES (?, ?, ?, ?, ?)")
        .run(title, content, category || "Форум", userId, pollJson);
    const post = sqlite.prepare("SELECT * FROM forum_posts WHERE id = ?").get(result.lastInsertRowid);
    try { getIO().emit("forum:post_created", enrichPost(post, userId)); } catch {}
    auditLog({ userId, action: "forum.post.create", targetType: "forum_post", targetId: result.lastInsertRowid as number, details: { title }, ipAddress: req.ip });
    res.status(201).json(enrichPost(post, userId));
});

// PUT /api/forum/:id — edit post
router.put("/:id", authMiddleware, (req, res) => {
    const post = sqlite.prepare("SELECT * FROM forum_posts WHERE id = ?").get(req.params.id) as any;
    if (!post) return res.status(404).json({ error: "Post not found" });

    const userId = (req as any).userId;
    if (post.author_id !== userId && !isAdmin(userId)) {
        return res.status(403).json({ error: "Forbidden" });
    }

    const { title, content, category, pinned } = req.body;
    sqlite.prepare("UPDATE forum_posts SET title = ?, content = ?, category = ?, pinned = ? WHERE id = ?")
        .run(title ?? post.title, content ?? post.content, category ?? post.category, pinned ?? post.pinned, post.id);

    const updated = sqlite.prepare("SELECT * FROM forum_posts WHERE id = ?").get(post.id);
    try { getIO().emit("forum:post_updated", enrichPost(updated)); } catch {}
    auditLog({ userId, action: "forum.post.update", targetType: "forum_post", targetId: post.id, details: { title: title ?? post.title }, ipAddress: req.ip });
    res.json(enrichPost(updated));
});

// DELETE /api/forum/:id — delete post
router.delete("/:id", authMiddleware, (req, res) => {
    const post = sqlite.prepare("SELECT * FROM forum_posts WHERE id = ?").get(req.params.id) as any;
    if (!post) return res.status(404).json({ error: "Post not found" });

    const userId = (req as any).userId;
    if (post.author_id !== userId && !isAdmin(userId)) {
        return res.status(403).json({ error: "Forbidden" });
    }

    sqlite.prepare("DELETE FROM forum_posts WHERE id = ?").run(post.id);
    try { getIO().emit("forum:post_deleted", { id: post.id }); } catch {}
    auditLog({ userId, action: "forum.post.delete", targetType: "forum_post", targetId: post.id, details: { title: post.title }, ipAddress: req.ip });
    res.json({ ok: true });
});

// POST /api/forum/:id/comments — add comment
router.post("/:id/comments", authMiddleware, validate(createCommentSchema), (req, res) => {
    const post = sqlite.prepare("SELECT * FROM forum_posts WHERE id = ?").get(req.params.id) as any;
    if (!post) return res.status(404).json({ error: "Post not found" });

    const { content, parentId } = req.body;
    if (!content) return res.status(400).json({ error: "Content required" });
    const userId = (req as any).userId;

    const result = sqlite.prepare("INSERT INTO forum_comments (post_id, parent_id, user_id, content) VALUES (?, ?, ?, ?)")
        .run(post.id, parentId || null, userId, content);

    const comment = sqlite.prepare("SELECT * FROM forum_comments WHERE id = ?").get(result.lastInsertRowid);
    try { getIO().emit("forum:comment_created", { postId: post.id, comment: enrichComment(comment) }); } catch {}
    auditLog({ userId, action: "forum.comment.create", targetType: "forum_comment", targetId: result.lastInsertRowid as number, details: { postId: post.id }, ipAddress: req.ip });
    res.status(201).json(enrichComment(comment));
});

// DELETE /api/forum/comments/:id — delete comment
router.delete("/comments/:id", authMiddleware, (req, res) => {
    const comment = sqlite.prepare("SELECT * FROM forum_comments WHERE id = ?").get(req.params.id) as any;
    if (!comment) return res.status(404).json({ error: "Comment not found" });

    const userId = (req as any).userId;
    if (comment.user_id !== userId && !isAdmin(userId)) {
        return res.status(403).json({ error: "Forbidden" });
    }

    sqlite.prepare("DELETE FROM forum_comments WHERE id = ?").run(comment.id);
    try { getIO().emit("forum:comment_deleted", { postId: comment.post_id, commentId: comment.id }); } catch {}
    auditLog({ userId, action: "forum.comment.delete", targetType: "forum_comment", targetId: comment.id, details: { postId: comment.post_id }, ipAddress: req.ip });
    res.json({ ok: true });
});

// POST /api/forum/comments/:id/like — toggle like
router.post("/comments/:id/like", authMiddleware, (req, res) => {
    const comment = sqlite.prepare("SELECT * FROM forum_comments WHERE id = ?").get(req.params.id) as any;
    if (!comment) return res.status(404).json({ error: "Comment not found" });
    const userId = (req as any).userId;

    const existing = sqlite.prepare("SELECT id FROM forum_likes WHERE comment_id = ? AND user_id = ?").get(comment.id, userId);
    if (existing) {
        sqlite.prepare("DELETE FROM forum_likes WHERE id = ?").run((existing as any).id);
    } else {
        sqlite.prepare("INSERT INTO forum_likes (comment_id, user_id) VALUES (?, ?)").run(comment.id, userId);
    }

    const likes = (sqlite.prepare("SELECT COUNT(*) as c FROM forum_likes WHERE comment_id = ?").get(comment.id) as any).c;
    try { getIO().emit("forum:comment_liked", { postId: comment.post_id, commentId: comment.id, likes, liked: !existing }); } catch {}
    auditLog({ userId, action: existing ? "forum.comment.unlike" : "forum.comment.like", targetType: "forum_comment", targetId: comment.id, ipAddress: req.ip });
    res.json({ likes, liked: !existing });
});

// POST /api/forum/:id/vote — vote in poll
router.post("/:id/vote", authMiddleware, (req, res) => {
    const userId = (req as any).userId;
    const post = sqlite.prepare("SELECT * FROM forum_posts WHERE id = ?").get(req.params.id) as any;
    if (!post) return res.status(404).json({ error: "Post not found" });
    if (!post.poll_options) return res.status(400).json({ error: "Not a poll" });

    const { optionIndex } = req.body;
    if (optionIndex === undefined) return res.status(400).json({ error: "optionIndex required" });

    const options = JSON.parse(post.poll_options);
    if (optionIndex < 0 || optionIndex >= options.length) return res.status(400).json({ error: "Invalid option" });

    const existing = sqlite.prepare("SELECT id, option_index FROM forum_poll_votes WHERE post_id = ? AND user_id = ?").get(post.id, userId) as any;
    if (existing) {
        if (existing.option_index === optionIndex) {
            sqlite.prepare("DELETE FROM forum_poll_votes WHERE id = ?").run(existing.id);
        } else {
            sqlite.prepare("UPDATE forum_poll_votes SET option_index = ? WHERE id = ?").run(optionIndex, existing.id);
        }
    } else {
        sqlite.prepare("INSERT INTO forum_poll_votes (post_id, option_index, user_id) VALUES (?, ?, ?)").run(post.id, optionIndex, userId);
    }

    const updated = sqlite.prepare("SELECT * FROM forum_posts WHERE id = ?").get(post.id);
    try { getIO().emit("forum:poll_voted", enrichPost(updated, userId)); } catch {}
    auditLog({ userId, action: "forum.poll.vote", targetType: "forum_post", targetId: post.id, details: { optionIndex }, ipAddress: req.ip });
    res.json(enrichPost(updated, userId));
});

export default router;
