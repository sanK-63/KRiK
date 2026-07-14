import { Document, Packer, Paragraph, TextRun, AlignmentType } from "docx";
import fs from "fs";
import path from "path";
import { db } from "./database";
import { docTemplates } from "./database/schema";

const TEMPLATES_DIR = path.resolve(__dirname, "../data/templates");
if (!fs.existsSync(TEMPLATES_DIR)) {
    fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
}

interface TemplateDef {
    name: string;
    lines: { text: string; bold?: boolean; size?: number; center?: boolean }[];
}

const templates: TemplateDef[] = [
    {
        name: "Акт",
        lines: [
            { text: "АКТ", bold: true, size: 32, center: true },
            { text: "{{title}}", bold: true, size: 26, center: true },
            { text: "" },
            { text: "Дата: {{date}}", size: 22 },
            { text: "Составил: {{author}}", size: 22 },
            { text: "" },
            { text: "________________________________________" },
            { text: "" },
            { text: "{{content}}", size: 22 },
            { text: "" },
            { text: "Участники: {{participants}}", size: 22 },
            { text: "" },
            { text: "________________________________________" },
            { text: "" },
            { text: "Подпись: ___________________  {{author}}", size: 22 },
        ],
    },
    {
        name: "Заявление",
        lines: [
            { text: "ЗАЯВЛЕНИЕ", bold: true, size: 32, center: true },
            { text: "" },
            { text: "Дата: {{date}}", size: 22 },
            { text: "От: {{author}}", size: 22 },
            { text: "" },
            { text: "Тема: {{title}}", bold: true, size: 24 },
            { text: "" },
            { text: "________________________________________" },
            { text: "" },
            { text: "{{content}}", size: 22 },
            { text: "" },
            { text: "________________________________________" },
            { text: "" },
            { text: "Подпись: ___________________  {{author}}", size: 22 },
        ],
    },
    {
        name: "Служебная записка",
        lines: [
            { text: "СЛУЖЕБНАЯ ЗАПИСКА", bold: true, size: 32, center: true },
            { text: "" },
            { text: "Дата: {{date}}", size: 22 },
            { text: "Кому: {{recipient}}", size: 22 },
            { text: "От: {{author}}", size: 22 },
            { text: "" },
            { text: "Тема: {{title}}", bold: true, size: 24 },
            { text: "" },
            { text: "________________________________________" },
            { text: "" },
            { text: "{{content}}", size: 22 },
            { text: "" },
            { text: "________________________________________" },
            { text: "" },
            { text: "Подпись: ___________________  {{author}}", size: 22 },
        ],
    },
    {
        name: "Приказ",
        lines: [
            { text: "ПРИКАЗ", bold: true, size: 32, center: true },
            { text: "{{title}}", bold: true, size: 26, center: true },
            { text: "" },
            { text: "Дата: {{date}}", size: 22 },
            { text: "От: {{author}}", size: 22 },
            { text: "" },
            { text: "________________________________________" },
            { text: "" },
            { text: "{{content}}", size: 22 },
            { text: "" },
            { text: "Срок исполнения: {{deadline}}", size: 22 },
            { text: "Ответственный: {{executor}}", size: 22 },
            { text: "" },
            { text: "________________________________________" },
            { text: "" },
            { text: "Подпись: ___________________  {{author}}", size: 22 },
        ],
    },
    {
        name: "Предложение",
        lines: [
            { text: "ПРЕДЛОЖЕНИЕ", bold: true, size: 32, center: true },
            { text: "" },
            { text: "Дата: {{date}}", size: 22 },
            { text: "От: {{author}}", size: 22 },
            { text: "" },
            { text: "Тема: {{title}}", bold: true, size: 24 },
            { text: "" },
            { text: "________________________________________" },
            { text: "" },
            { text: "{{content}}", size: 22 },
            { text: "" },
            { text: "Обоснование:", bold: true, size: 22 },
            { text: "{{justification}}", size: 22 },
            { text: "" },
            { text: "________________________________________" },
            { text: "" },
            { text: "Подпись: ___________________  {{author}}", size: 22 },
        ],
    },
    {
        name: "Отчёт",
        lines: [
            { text: "ОТЧЁТ", bold: true, size: 32, center: true },
            { text: "{{title}}", bold: true, size: 26, center: true },
            { text: "" },
            { text: "Дата: {{date}}", size: 22 },
            { text: "Автор: {{author}}", size: 22 },
            { text: "Период: {{periodFrom}} — {{periodTo}}", size: 22 },
            { text: "" },
            { text: "________________________________________" },
            { text: "" },
            { text: "{{content}}", size: 22 },
            { text: "" },
            { text: "Показатели:", bold: true, size: 22 },
            { text: "{{metrics}}", size: 22 },
            { text: "" },
            { text: "________________________________________" },
            { text: "" },
            { text: "Подпись: ___________________  {{author}}", size: 22 },
        ],
    },
];

export async function seedDocTemplates() {
    const existing = db.select().from(docTemplates).limit(1).get();
    if (existing) return;

    console.log("Seeding document templates...");

    for (const def of templates) {
        const paragraphs = def.lines.map(
            (l) =>
                new Paragraph({
                    children: [new TextRun({ text: l.text, bold: l.bold, size: l.size })],
                    alignment: l.center ? AlignmentType.CENTER : AlignmentType.LEFT,
                })
        );

        const doc = new Document({ sections: [{ children: paragraphs }] });
        const buffer = await Packer.toBuffer(doc);
        const filename = `${def.name}_${Date.now()}.docx`;
        fs.writeFileSync(path.join(TEMPLATES_DIR, filename), buffer);

        const allText = def.lines.map((l) => l.text).join(" ");
        const matches = allText.match(/\{\{(\w+)\}\}/g);
        const placeholders = [...new Set(matches ? matches.map((m) => m.replace(/\{\{|\}\}/g, "")) : [])];

        db.insert(docTemplates).values({
            name: def.name,
            filename,
            placeholders: JSON.stringify(placeholders),
            uploadedBy: null,
        }).run();
    }

    console.log(`Seeded ${templates.length} document templates`);
}
