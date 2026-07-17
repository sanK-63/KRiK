import { Router, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { db } from "../database";
import { softwareItems, users } from "../database/schema";
import { eq } from "drizzle-orm";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { getIO } from "../socket";

const router = Router();

const UPLOADS_DIR = path.resolve(__dirname, "../../data/uploads/software");
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const upload = multer({
    storage: multer.diskStorage({
        destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
        filename: (_req, file, cb) => {
            const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
            cb(null, `${unique}${path.extname(file.originalname)}`);
        },
    }),
    limits: { fileSize: 500 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowed = [
            ".zip", ".rar", ".7z", ".tar", ".gz", ".torrent",
            ".exe", ".msi", ".dmg", ".deb", ".rpm",
            ".pdf", ".doc", ".docx", ".txt",
            ".png", ".jpg", ".jpeg", ".gif", ".webp",
        ];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error(`Файлы типа ${ext || "(нет расширения)"} не разрешены`));
        }
    },
});

function enrichItem(item: any) {
    const author = db.select().from(users).where(eq(users.id, item.authorId || 0)).get();
    return {
        ...item,
        tags: (() => { try { return JSON.parse(item.tags || "[]"); } catch { return []; } })(),
        author: author ? { id: author.id, displayName: author.displayName, username: author.username, avatar: author.avatar } : null,
    };
}

router.get("/", authMiddleware, (_req: AuthRequest, res: Response) => {
    const all = db.select().from(softwareItems).all();
    res.json(all.map(enrichItem));
});

router.get("/:id", authMiddleware, (req: AuthRequest, res: Response) => {
    const id = Number(req.params.id);
    const item = db.select().from(softwareItems).where(eq(softwareItems.id, id)).get();
    if (!item) {
        res.status(404).json({ error: "Публикация не найдена" });
        return;
    }
    res.json(enrichItem(item));
});

router.post("/upload", authMiddleware, upload.single("file"), (req: AuthRequest, res: Response) => {
    if (!req.userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    if (!req.file) {
        res.status(400).json({ error: "Файл не загружен" });
        return;
    }
    const fileUrl = `/api/software/file/${req.file.filename}`;
    const fileName = req.file.originalname;
    res.json({ fileUrl, fileName, size: req.file.size });
});

router.get("/file/:filename", authMiddleware, (req: AuthRequest, res: Response) => {
    const filePath = path.join(UPLOADS_DIR, req.params.filename);
    if (!fs.existsSync(filePath)) {
        res.status(404).json({ error: "Файл не найден" });
        return;
    }
    res.download(filePath);
});

router.post("/", authMiddleware, (req: AuthRequest, res: Response) => {
    if (!req.userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    const { category, title, description, tags, version, downloadUrl, downloadLabel, fileUrl, fileName } = req.body;
    if (!title || !description || !category) {
        res.status(400).json({ error: "Заголовок, описание и категория обязательны" });
        return;
    }
    const result = db.insert(softwareItems).values({
        category,
        title,
        description,
        tags: JSON.stringify(tags || []),
        version: version || null,
        downloadUrl: downloadUrl || null,
        downloadLabel: downloadLabel || null,
        fileUrl: fileUrl || null,
        fileName: fileName || null,
        authorId: req.userId,
    }).returning().get();

    try { getIO().emit("software:created", enrichItem(result)); } catch {}

    res.json(enrichItem(result));
});

router.put("/:id", authMiddleware, (req: AuthRequest, res: Response) => {
    if (!req.userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    const id = Number(req.params.id);
    const item = db.select().from(softwareItems).where(eq(softwareItems.id, id)).get();
    if (!item) {
        res.status(404).json({ error: "Публикация не найдена" });
        return;
    }
    if (item.authorId !== req.userId) {
        res.status(403).json({ error: "Нет прав на редактирование" });
        return;
    }
    const { category, title, description, tags, version, downloadUrl, downloadLabel, fileUrl, fileName } = req.body;
    const updated = db.update(softwareItems).set({
        ...(category !== undefined && { category }),
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(tags !== undefined && { tags: JSON.stringify(tags) }),
        ...(version !== undefined && { version: version || null }),
        ...(downloadUrl !== undefined && { downloadUrl: downloadUrl || null }),
        ...(downloadLabel !== undefined && { downloadLabel: downloadLabel || null }),
        ...(fileUrl !== undefined && { fileUrl: fileUrl || null }),
        ...(fileName !== undefined && { fileName: fileName || null }),
    }).where(eq(softwareItems.id, id)).returning().get();

    try { getIO().emit("software:updated", enrichItem(updated)); } catch {}

    res.json(enrichItem(updated));
});

router.delete("/:id", authMiddleware, (req: AuthRequest, res: Response) => {
    if (!req.userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    const id = Number(req.params.id);
    const item = db.select().from(softwareItems).where(eq(softwareItems.id, id)).get();
    if (!item) {
        res.status(404).json({ error: "Публикация не найдена" });
        return;
    }
    if (item.authorId !== req.userId) {
        res.status(403).json({ error: "Нет прав на удаление" });
        return;
    }

    if (item.fileUrl) {
        const filename = path.basename(item.fileUrl);
        const filePath = path.join(UPLOADS_DIR, filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }

    db.delete(softwareItems).where(eq(softwareItems.id, id)).run();

    try { getIO().emit("software:deleted", { id }); } catch {}

    res.json({ ok: true });
});

export default router;
