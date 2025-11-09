import nodemailer from "nodemailer";
import { envs } from './env.adapter';

export class NodemailerAdapter {
    private transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: envs.SMTP_HOST,
            port: Number(envs.SMTP_PORT),
            secure: false,
            auth: {
                user: envs.SMTP_USER,
                pass: envs.SMTP_PASS
            }
        });
    }

    async sendEmail(from: string, subject: string, html: string) {
        const to = envs.MAILER_TO;
        
        try {
            const info = await this.transporter.sendMail({
                from: `"${envs.SMTP_USER || 'Formulario de Contacto'}" <${envs.SMTP_USER}>`,
                to, 
                subject: `[Contacto Web] ${subject}`,
                html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px;">
                        <h2 style="color: #333;">Nuevo mensaje de contacto</h2>
                        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <p><strong>De:</strong> ${from}</p>
                            <p><strong>Asunto:</strong> ${subject}</p>
                        </div>
                        <div style="background-color: #fff; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
                            <h3 style="color: #555; margin-top: 0;">Mensaje:</h3>
                            ${html}
                        </div>
                    </div>
                `,
                replyTo: from
            });
            return true;
        } catch (error) {
            return false;
        }
    }
}
