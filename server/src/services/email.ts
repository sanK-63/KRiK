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

export async function sendNotificationEmail(
    to: string,
    title: string,
    body: string
) {
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">${title}</h2>
      <p style="color: #555; font-size: 16px;">${body}</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="color: #999; font-size: 12px;">Corporate Portal</p>
    </div>`;

    return sendEmail(to, title, html);
}
