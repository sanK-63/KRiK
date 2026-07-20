import { Router, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { db, sqlite } from "../database";
import { libraryCategories, libraryDocuments, users } from "../database/schema";
import { eq, like, sql } from "drizzle-orm";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { auditLog } from "../core/audit";

const router = Router();

const isAdmin = (userId: number): boolean => {
    const user = db.select().from(users).where(eq(users.id, userId)).get() as any;
    return user?.username === "tunev";
};

const UPLOADS_DIR = path.resolve(__dirname, "../../data/uploads/library");
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
    limits: { fileSize: 50 * 1024 * 1024 },
});

// ─── Categories ───

router.get("/categories", authMiddleware, (_req: AuthRequest, res: Response) => {
    const cats = db.select().from(libraryCategories).all().sort((a, b) => a.orderIndex - b.orderIndex);
    const result = cats.map((c) => {
        const count = sqlite.prepare("SELECT COUNT(*) as c FROM library_documents WHERE category_id = ?").get(c.id) as { c: number };
        return { ...c, documentCount: count.c };
    });
    res.json(result);
});

router.post("/categories", authMiddleware, (req: AuthRequest, res: Response) => {
    const { name, icon } = req.body;
    if (!name) {
        res.status(400).json({ error: "name is required" });
        return;
    }
    const maxOrder = sqlite.prepare("SELECT MAX(order_index) as m FROM library_categories").get() as { m: number | null };
    const cat = db.insert(libraryCategories).values({
        name,
        icon: icon || null,
        orderIndex: (maxOrder.m ?? -1) + 1,
    }).returning().get();
    res.status(201).json({ ...cat, documentCount: 0 });
});

router.put("/categories/:id", authMiddleware, (req: AuthRequest, res: Response) => {
    const id = Number(req.params.id);
    const cat = db.select().from(libraryCategories).where(eq(libraryCategories.id, id)).get();
    if (!cat) {
        res.status(404).json({ error: "Category not found" });
        return;
    }
    const { name, icon, orderIndex } = req.body;
    db.update(libraryCategories).set({
        ...(name !== undefined && { name }),
        ...(icon !== undefined && { icon }),
        ...(orderIndex !== undefined && { orderIndex }),
    }).where(eq(libraryCategories.id, id)).run();
    res.json({ ok: true });
});

router.delete("/categories/:id", authMiddleware, (req: AuthRequest, res: Response) => {
    const id = Number(req.params.id);
    const cat = db.select().from(libraryCategories).where(eq(libraryCategories.id, id)).get();
    if (!cat) {
        res.status(404).json({ error: "Category not found" });
        return;
    }
    db.delete(libraryCategories).where(eq(libraryCategories.id, id)).run();
    res.json({ ok: true });
});

// ─── Documents ───

router.get("/", authMiddleware, (req: AuthRequest, res: Response) => {
    const { categoryId, search } = req.query;

    let docs;
    if (categoryId) {
        docs = db.select().from(libraryDocuments).where(eq(libraryDocuments.categoryId, Number(categoryId))).all();
    } else if (search && typeof search === "string") {
        docs = db.select().from(libraryDocuments).where(like(libraryDocuments.title, `%${search}%`)).all();
    } else {
        docs = db.select().from(libraryDocuments).all();
    }

    const result = docs.map((d) => {
        const cat = d.categoryId ? db.select().from(libraryCategories).where(eq(libraryCategories.id, d.categoryId)).get() : null;
        const uploader = d.uploadedBy ? sqlite.prepare("SELECT id, username, display_name FROM users WHERE id = ?").get(d.uploadedBy) as any : null;
        return {
            ...d,
            categoryName: cat?.name || null,
            uploaderName: uploader?.display_name || uploader?.username || null,
        };
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json(result);
});

router.get("/stats", authMiddleware, (_req: AuthRequest, res: Response) => {
    const totalDocs = sqlite.prepare("SELECT COUNT(*) as c FROM library_documents").get() as { c: number };
    const totalSize = sqlite.prepare("SELECT COALESCE(SUM(size), 0) as s FROM library_documents").get() as { s: number };
    const totalDownloads = sqlite.prepare("SELECT COALESCE(SUM(downloads), 0) as d FROM library_documents").get() as { d: number };
    const totalCategories = sqlite.prepare("SELECT COUNT(*) as c FROM library_categories").get() as { c: number };
    res.json({
        documents: totalDocs.c,
        totalSize: totalSize.s,
        downloads: totalDownloads.d,
        categories: totalCategories.c,
    });
});

router.get("/:id", authMiddleware, (req: AuthRequest, res: Response) => {
    const id = Number(req.params.id);
    const doc = db.select().from(libraryDocuments).where(eq(libraryDocuments.id, id)).get();
    if (!doc) {
        res.status(404).json({ error: "Document not found" });
        return;
    }
    const cat = doc.categoryId ? db.select().from(libraryCategories).where(eq(libraryCategories.id, doc.categoryId)).get() : null;
    const uploader = doc.uploadedBy ? sqlite.prepare("SELECT id, username, display_name FROM users WHERE id = ?").get(doc.uploadedBy) as any : null;
    res.json({
        ...doc,
        categoryName: cat?.name || null,
        uploaderName: uploader?.display_name || uploader?.username || null,
    });
});

router.post("/", authMiddleware, upload.single("file"), (req: AuthRequest, res: Response) => {
    if (!req.file) {
        res.status(400).json({ error: "File is required" });
        return;
    }
    const { title, description, categoryId } = req.body;

    const doc = db.insert(libraryDocuments).values({
        categoryId: categoryId ? Number(categoryId) : null,
        title: title || req.file.originalname,
        description: description || null,
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        uploadedBy: req.userId || null,
    }).returning().get();

    auditLog({ userId: req.userId ?? undefined, action: "library.document.upload", targetType: "library_document", targetId: doc.id, details: { title: doc.title, filename: doc.filename }, ipAddress: req.ip });
    res.status(201).json({ id: doc.id, title: doc.title, filename: doc.filename });
});

router.put("/:id", authMiddleware, (req: AuthRequest, res: Response) => {
    const id = Number(req.params.id);
    const doc = db.select().from(libraryDocuments).where(eq(libraryDocuments.id, id)).get();
    if (!doc) {
        res.status(404).json({ error: "Document not found" });
        return;
    }
    if (doc.uploadedBy !== req.userId && !isAdmin(req.userId!)) {
        res.status(403).json({ error: "Forbidden" });
        return;
    }
    const { title, description, categoryId } = req.body;
    db.update(libraryDocuments).set({
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(categoryId !== undefined && { categoryId: categoryId ? Number(categoryId) : null }),
    }).where(eq(libraryDocuments.id, id)).run();
    auditLog({ userId: req.userId ?? undefined, action: "library.document.update", targetType: "library_document", targetId: id, details: { title: title ?? doc.title }, ipAddress: req.ip });
    res.json({ ok: true });
});

router.delete("/:id", authMiddleware, (req: AuthRequest, res: Response) => {
    const id = Number(req.params.id);
    const doc = db.select().from(libraryDocuments).where(eq(libraryDocuments.id, id)).get();
    if (!doc) {
        res.status(404).json({ error: "Document not found" });
        return;
    }
    if (doc.uploadedBy !== req.userId && !isAdmin(req.userId!)) {
        res.status(403).json({ error: "Forbidden" });
        return;
    }
    const filePath = path.join(UPLOADS_DIR, doc.filename);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
    db.delete(libraryDocuments).where(eq(libraryDocuments.id, id)).run();
    auditLog({ userId: req.userId ?? undefined, action: "library.document.delete", targetType: "library_document", targetId: id, details: { title: doc.title }, ipAddress: req.ip });
    res.json({ ok: true });
});

router.get("/:id/download", authMiddleware, (req: AuthRequest, res: Response) => {
    const id = Number(req.params.id);
    const doc = db.select().from(libraryDocuments).where(eq(libraryDocuments.id, id)).get();
    if (!doc) {
        res.status(404).json({ error: "Document not found" });
        return;
    }
    db.update(libraryDocuments).set({ downloads: doc.downloads + 1 }).where(eq(libraryDocuments.id, id)).run();

    const filePath = path.join(UPLOADS_DIR, doc.filename);
    if (!fs.existsSync(filePath)) {
        res.status(404).json({ error: "File not found on disk" });
        return;
    }
    res.download(filePath, doc.originalName);
});

export default router;
