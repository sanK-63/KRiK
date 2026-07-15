import { Router } from "express";
import { sqlite } from "../database";
import { authMiddleware } from "../middleware/auth";

const router = Router();

function enrichPost(post: any) {
    if (!post) return null;
    const author = sqlite.prepare("SELECT id, display_name, username, avatar FROM users WHERE id = ?").get(post.author_id) as any;
    const commentCount = (sqlite.prepare("SELECT COUNT(*) as c FROM forum_comments WHERE post_id = ?").get(post.id) as any).c;
    return {
        ...post,
        authorName: author?.display_name || author?.username || "—",
        authorAvatar: author?.avatar || null,
        commentCount,
    };
}

function enrichComment(comment: any) {
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
router.get("/", (_req, res) => {
    const posts = sqlite.prepare("SELECT * FROM forum_posts ORDER BY pinned DESC, created_at DESC").all();
    res.json(posts.map(enrichPost));
});

// GET /api/forum/:id — get single post with comments
router.get("/:id", (req, res) => {
    const post = sqlite.prepare("SELECT * FROM forum_posts WHERE id = ?").get(req.params.id) as any;
    if (!post) return res.status(404).json({ error: "Post not found" });

    const topComments = sqlite.prepare("SELECT * FROM forum_comments WHERE post_id = ? AND parent_id IS NULL ORDER BY created_at ASC").all(post.id);
    res.json({
        ...enrichPost(post),
        comments: topComments.map(enrichComment),
    });
});

// POST /api/forum — create post
router.post("/", authMiddleware, (req, res) => {
    const { title, content, category } = req.body;
    if (!title || !content) return res.status(400).json({ error: "Title and content required" });
    const userId = (req as any).userId;

    const result = sqlite.prepare("INSERT INTO forum_posts (title, content, category, author_id) VALUES (?, ?, ?, ?)").run(title, content, category || "Форум", userId);
    const post = sqlite.prepare("SELECT * FROM forum_posts WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json(enrichPost(post));
});

// PUT /api/forum/:id — edit post
router.put("/:id", authMiddleware, (req, res) => {
    const post = sqlite.prepare("SELECT * FROM forum_posts WHERE id = ?").get(req.params.id) as any;
    if (!post) return res.status(404).json({ error: "Post not found" });

    const { title, content, category, pinned } = req.body;
    sqlite.prepare("UPDATE forum_posts SET title = ?, content = ?, category = ?, pinned = ? WHERE id = ?")
        .run(title ?? post.title, content ?? post.content, category ?? post.category, pinned ?? post.pinned, post.id);

    const updated = sqlite.prepare("SELECT * FROM forum_posts WHERE id = ?").get(post.id);
    res.json(enrichPost(updated));
});

// DELETE /api/forum/:id — delete post
router.delete("/:id", authMiddleware, (req, res) => {
    const post = sqlite.prepare("SELECT * FROM forum_posts WHERE id = ?").get(req.params.id) as any;
    if (!post) return res.status(404).json({ error: "Post not found" });
    sqlite.prepare("DELETE FROM forum_posts WHERE id = ?").run(post.id);
    res.json({ ok: true });
});

// POST /api/forum/:id/comments — add comment
router.post("/:id/comments", authMiddleware, (req, res) => {
    const post = sqlite.prepare("SELECT * FROM forum_posts WHERE id = ?").get(req.params.id) as any;
    if (!post) return res.status(404).json({ error: "Post not found" });

    const { content, parentId } = req.body;
    if (!content) return res.status(400).json({ error: "Content required" });
    const userId = (req as any).userId;

    const result = sqlite.prepare("INSERT INTO forum_comments (post_id, parent_id, user_id, content) VALUES (?, ?, ?, ?)")
        .run(post.id, parentId || null, userId, content);

    const comment = sqlite.prepare("SELECT * FROM forum_comments WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json(enrichComment(comment));
});

// DELETE /api/forum/comments/:id — delete comment
router.delete("/comments/:id", authMiddleware, (req, res) => {
    const comment = sqlite.prepare("SELECT * FROM forum_comments WHERE id = ?").get(req.params.id) as any;
    if (!comment) return res.status(404).json({ error: "Comment not found" });
    sqlite.prepare("DELETE FROM forum_comments WHERE id = ?").run(comment.id);
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
    res.json({ likes, liked: !existing });
});

export default router;
