import { Router, Response } from "express";
import { db } from "../database";
import { constitutionDocuments, constitutionVersions, users } from "../database/schema";
import { eq, desc } from "drizzle-orm";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { getIO } from "../socket";
import PDFDocument from "pdfkit";

const router = Router();

function ensureDoc() {
    let doc = db.select().from(constitutionDocuments).limit(1).get();
    if (!doc) {
        doc = db.insert(constitutionDocuments).values({
            title: "Конституция Конторы",
            activeVersion: 1,
        }).returning().get();
    }
    return doc;
}

router.get("/", authMiddleware, (_req: AuthRequest, res: Response) => {
    const doc = ensureDoc();

    const version = db
        .select()
        .from(constitutionVersions)
        .where(eq(constitutionVersions.documentId, doc.id))
        .orderBy(desc(constitutionVersions.version))
        .limit(1)
        .get();

    if (!version) {
        res.json({ document: doc, version: null });
        return;
    }

    const author = db.select().from(users).where(eq(users.id, version.createdBy)).get();

    res.json({
        document: doc,
        version: {
            id: version.id,
            version: version.version,
            markdown: version.markdown,
            createdBy: author ? { id: author.id, displayName: author.displayName, username: author.username } : null,
            publishedAt: version.publishedAt,
        },
    });
});

router.get("/history", authMiddleware, (_req: AuthRequest, res: Response) => {
    const doc = db.select().from(constitutionDocuments).limit(1).get();
    if (!doc) {
        res.json([]);
        return;
    }

    const versions = db
        .select()
        .from(constitutionVersions)
        .where(eq(constitutionVersions.documentId, doc.id))
        .orderBy(desc(constitutionVersions.version))
        .all();

    const result = versions.map((v) => {
        const author = db.select().from(users).where(eq(users.id, v.createdBy)).get();
        return {
            id: v.id,
            version: v.version,
            createdBy: author ? { displayName: author.displayName, username: author.username } : null,
            publishedAt: v.publishedAt,
        };
    });

    res.json(result);
});

router.get("/download", authMiddleware, (_req: AuthRequest, res: Response) => {
    const doc = db.select().from(constitutionDocuments).limit(1).get();
    if (!doc) {
        res.status(404).json({ error: "Конституция не найдена" });
        return;
    }

    const version = db
        .select()
        .from(constitutionVersions)
        .where(eq(constitutionVersions.documentId, doc.id))
        .orderBy(desc(constitutionVersions.version))
        .limit(1)
        .get();

    if (!version) {
        res.status(404).json({ error: "Версия не найдена" });
        return;
    }

    const pdfDoc = new PDFDocument({ size: "A4", margin: 60 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="constitution_v${version.version}.pdf"`);
    pdfDoc.pipe(res);

    pdfDoc.registerFont("DejaVu", "C:/Windows/Fonts/dejavusans.ttf");
    pdfDoc.registerFont("DejaVuBold", "C:/Windows/Fonts/dejavusans-bold.ttf");
    pdfDoc.registerFont("DejaVuItalic", "C:/Windows/Fonts/dejavusansoblique.ttf");

    pdfDoc.font("DejaVuBold").fontSize(20).text(doc.title, { align: "center" });
    pdfDoc.moveDown(0.3);
    pdfDoc.font("DejaVu").fontSize(10).fillColor("#666666")
        .text(`Версия ${version.version} | ${version.publishedAt ? new Date(version.publishedAt).toLocaleDateString("ru-RU") : "—"}`, { align: "center" });
    pdfDoc.moveDown(1);
    pdfDoc.fillColor("#000000");

    const lines = version.markdown.split("\n");
    for (const line of lines) {
        const trimmed = line.trimEnd();

        if (trimmed.startsWith("## ")) {
            pdfDoc.moveDown(0.5);
            pdfDoc.font("DejaVuBold").fontSize(15).text(trimmed.slice(3));
            pdfDoc.moveDown(0.2);
        } else if (trimmed.startsWith("### ")) {
            pdfDoc.moveDown(0.3);
            pdfDoc.font("DejaVuBold").fontSize(13).text(trimmed.slice(4));
            pdfDoc.moveDown(0.15);
        } else if (trimmed.startsWith("#### ")) {
            pdfDoc.moveDown(0.2);
            pdfDoc.font("DejaVuBold").fontSize(11).text(trimmed.slice(5));
            pdfDoc.moveDown(0.1);
        } else if (trimmed.startsWith("- ")) {
            pdfDoc.font("DejaVu").fontSize(11).text(`  • ${trimmed.slice(2)}`, { indent: 15 });
        } else if (trimmed === "---") {
            pdfDoc.moveDown(0.3);
            pdfDoc.moveTo(60, pdfDoc.y).lineTo(555, pdfDoc.y).strokeColor("#cccccc").lineWidth(0.5).stroke();
            pdfDoc.moveDown(0.3);
        } else if (trimmed === "") {
            pdfDoc.moveDown(0.3);
        } else {
            pdfDoc.font("DejaVu").fontSize(11).text(trimmed);
        }

        if (pdfDoc.y > 780) {
            pdfDoc.addPage();
        }
    }

    pdfDoc.end();
});

router.get("/:versionId", authMiddleware, (req: AuthRequest, res: Response) => {
    const versionId = Number(req.params.versionId);
    const version = db
        .select()
        .from(constitutionVersions)
        .where(eq(constitutionVersions.id, versionId))
        .limit(1)
        .get();

    if (!version) {
        res.status(404).json({ error: "Версия не найдена" });
        return;
    }

    const author = db.select().from(users).where(eq(users.id, version.createdBy)).get();

    res.json({
        id: version.id,
        version: version.version,
        markdown: version.markdown,
        createdBy: author ? { id: author.id, displayName: author.displayName, username: author.username } : null,
        publishedAt: version.publishedAt,
    });
});

router.post("/", authMiddleware, (req: AuthRequest, res: Response) => {
    if (!req.userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }

    const { markdown } = req.body;
    if (!markdown || typeof markdown !== "string") {
        res.status(400).json({ error: "markdown обязателен" });
        return;
    }

    const doc = ensureDoc();

    const lastVersion = db
        .select()
        .from(constitutionVersions)
        .where(eq(constitutionVersions.documentId, doc.id))
        .orderBy(desc(constitutionVersions.version))
        .limit(1)
        .get();

    const newVersionNum = (lastVersion?.version || 0) + 1;

    const version = db.insert(constitutionVersions).values({
        documentId: doc.id,
        version: newVersionNum,
        markdown,
        createdBy: req.userId,
        publishedAt: new Date().toISOString(),
    }).returning().get();

    db.update(constitutionDocuments)
        .set({ activeVersion: newVersionNum })
        .where(eq(constitutionDocuments.id, doc.id))
        .run();

    try { getIO().emit("constitution:updated", { version: newVersionNum }); } catch {}

    res.json({ id: version.id, version: newVersionNum });
});

export default router;
