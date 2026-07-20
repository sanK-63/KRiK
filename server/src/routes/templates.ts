import { Router, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { db } from "../database";
import { docTemplates, users } from "../database/schema";
import { eq } from "drizzle-orm";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();

const isAdmin = (userId: number): boolean => {
    const user = db.select().from(users).where(eq(users.id, userId)).get() as any;
    return user?.username === "tunev";
};

const TEMPLATES_DIR = path.resolve(__dirname, "../../data/templates");
if (!fs.existsSync(TEMPLATES_DIR)) {
    fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
}

const upload = multer({
    storage: multer.diskStorage({
        destination: (_req, _file, cb) => cb(null, TEMPLATES_DIR),
        filename: (_req, file, cb) => {
            const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
            cb(null, `${unique}${path.extname(file.originalname)}`);
        },
    }),
    fileFilter: (_req, file, cb) => {
        if (path.extname(file.originalname).toLowerCase() === ".docx") {
            cb(null, true);
        } else {
            cb(new Error("Только .docx файлы"));
        }
    },
    limits: { fileSize: 10 * 1024 * 1024 },
});

function extractPlaceholders(filePath: string): string[] {
    const content = fs.readFileSync(filePath, "utf-8");
    const matches = content.match(/\{\{(\w+)\}\}/g);
    if (!matches) return [];
    const set = new Set<string>();
    for (const m of matches) {
        set.add(m.replace(/\{\{|\}\}/g, ""));
    }
    return Array.from(set);
}

router.post("/", authMiddleware, upload.single("template"), (req: AuthRequest, res: Response) => {
    if (!req.file) {
        res.status(400).json({ error: "Файл не загружен" });
        return;
    }

    try {
        const placeholders = extractPlaceholders(req.file.path);
        const name = (req.body.name || req.file.originalname.replace(/\.docx$/i, "")).trim();

        const result = db.insert(docTemplates).values({
            name,
            filename: req.file.filename,
            placeholders: JSON.stringify(placeholders),
            uploadedBy: req.userId,
        }).returning().get();

        res.json({
            id: result.id,
            name: result.name,
            placeholders,
            createdAt: result.createdAt,
        });
    } catch (err) {
        res.status(500).json({ error: "Ошибка обработки шаблона" });
    }
});

router.get("/", authMiddleware, (_req: AuthRequest, res: Response) => {
    const all = db.select().from(docTemplates).all();
    const result = all.map((t) => ({
        id: t.id,
        name: t.name,
        filename: t.filename,
        placeholders: JSON.parse(t.placeholders) as string[],
        createdAt: t.createdAt,
    }));
    res.json(result);
});

router.delete("/:id", authMiddleware, (req: AuthRequest, res: Response) => {
    const id = Number(req.params.id);
    const tmpl = db.select().from(docTemplates).where(eq(docTemplates.id, id)).get();
    if (!tmpl) {
        res.status(404).json({ error: "Шаблон не найден" });
        return;
    }
    if (tmpl.uploadedBy !== req.userId && !isAdmin(req.userId!)) {
        res.status(403).json({ error: "Forbidden" });
        return;
    }

    const filePath = path.join(TEMPLATES_DIR, tmpl.filename);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }

    db.delete(docTemplates).where(eq(docTemplates.id, id)).run();
    res.json({ ok: true });
});

router.post("/:id/generate", authMiddleware, (req: AuthRequest, res: Response) => {
    const id = Number(req.params.id);
    const tmpl = db.select().from(docTemplates).where(eq(docTemplates.id, id)).get();
    if (!tmpl) {
        res.status(404).json({ error: "Шаблон не найден" });
        return;
    }

    const filePath = path.join(TEMPLATES_DIR, tmpl.filename);
    if (!fs.existsSync(filePath)) {
        res.status(404).json({ error: "Файл шаблона не найден" });
        return;
    }

    try {
        const content = fs.readFileSync(filePath);
        const zip = new PizZip(content);
        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
            delimiters: { start: "{{", end: "}}" },
        });
        doc.render(req.body.data || {});

        const buf = doc.getZip().generate({ type: "nodebuffer" });
        const outName = `${tmpl.name}_${new Date().toISOString().slice(0, 10)}.docx`;

        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(outName)}`);
        res.send(buf);
    } catch (err) {
        const message = err instanceof Error ? err.message : "Ошибка генерации";
        res.status(500).json({ error: message });
    }
});

export default router;
