import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { envs } from './env.adapter';
import { escapeHtml } from './contact';

let transporter: Transporter | undefined;

function getTransporter(): Transporter {
    if (!transporter) {
        const port = Number(envs.SMTP_PORT);

        transporter = nodemailer.createTransport({
            host: envs.SMTP_HOST,
            port,
            secure: port === 465,
            pool: true,
            maxConnections: 3,
            auth: {
                user: envs.SMTP_USER,
                pass: envs.SMTP_PASS
            }
        });
    }

    return transporter;
}

export class NodemailerAdapter {
    async sendEmail(from: string, subject: string, html: string) {
        const to = envs.MAILER_TO;
        const senderName = envs.SMTP_USER || 'Formulario de Contacto';

        return getTransporter().sendMail({
            from: `"${senderName}" <${envs.SMTP_USER}>`,
            to,
            subject: `[Contacto Web] ${subject}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2 style="color: #333;">Nuevo mensaje de contacto</h2>
                    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>De:</strong> ${escapeHtml(from)}</p>
                        <p><strong>Asunto:</strong> ${escapeHtml(subject)}</p>
                    </div>
                    <div style="background-color: #fff; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
                        <h3 style="color: #555; margin-top: 0;">Mensaje:</h3>
                        ${html}
                    </div>
                </div>
            `,
            replyTo: from
        });
    }
}
