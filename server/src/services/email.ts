import nodemailer from "nodemailer";
import { config } from "../config";

const transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
    },
});

export async function sendEmail(to: string, subject: string, html: string) {
    if (!config.smtp.user || !config.smtp.pass) {
        console.warn("[Email] SMTP не настроен, пропускаю отправку");
        return null;
    }

    const info = await transporter.sendMail({
        from: `"${config.smtpFromName}" <${config.smtpFrom}>`,
        to,
        subject,
        text: html.replace(/<[^>]*>/g, ""),
        html: `<meta charset="utf-8">${html}`,
    });

    console.log(`[Email] Отправлено: ${info.messageId}`);
    return info;
}

function textToHtml(text: string): string {
    return text
        .split("\n")
        .map((line) => {
            if (line.trim() === "") return "<br><br>";
            return `<p style="margin: 0 0 16px 0; color: #222; font-size: 16px; line-height: 1.6;">${line}</p>`;
        })
        .join("\n");
}

export async function sendNotificationEmail(
    to: string,
    title: string,
    body: string
) {
    const html = `
    <meta charset="utf-8">
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h1 style="margin: 0 0 24px 0; color: #111; font-size: 22px; font-weight: bold;">${title}</h1>
      <div>${textToHtml(body)}</div>
      <hr style="border: none; border-top: 1px solid #ddd; margin: 32px 0 16px 0;">
      <p style="margin: 0; color: #999; font-size: 12px;">kontora — Corporate Portal</p>
    </div>`;

    return sendEmail(to, title, html);
}
