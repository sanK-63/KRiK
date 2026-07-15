const nodemailer = require('nodemailer');

async function test() {
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: 'tunevaleksandr5@gmail.com',
            pass: 'fgylneajihxxanby',
        },
    });

    try {
        const info = await transporter.sendMail({
            from: '"Corporate Portal" <tunevaleksandr5@gmail.com>',
            to: 'tunevaleksandr5@gmail.com',
            subject: 'Test Gmail SMTP',
            text: 'Тест',
            html: '<meta charset="utf-8"><h2>Привет!</h2><p>Тест через Gmail.</p>',
        });
        console.log('SENT:', info.messageId);
    } catch (e) {
        console.error('ERROR:', e.message);
    }
}

test();
