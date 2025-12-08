import { Injectable, Logger } from "@nestjs/common";
import * as nodemailer from "nodemailer";

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    // Hardcodeamos las credenciales directamente
    this.transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // TLS no obligatorio para 587
      auth: {
        user: "plataformauta2023@gmail.com", // tu correo
        pass: "grma tarb cdgf ukuf",          // tu contraseña / App Password
      },
      tls: {
        rejectUnauthorized: false, // ignora certificados para pruebas locales
      },
    });
  }

  async sendVerificationEmail(to: string, token: string, name?: string) {
    try {
      const verificationLink = `http://localhost:5173/verify-email?token=${token}`;
      const subject = "Verifica tu cuenta en Marketplace";

      const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Hola ${name || "usuario"} 👋</h2>
          <p>Gracias por registrarte en <b>Marketplace</b>.</p>
          <p>Para activar tu cuenta, haz clic en el siguiente botón:</p>
          <p>
            <a href="${verificationLink}" 
               style="display:inline-block;background:#1e293b;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;">
               Verificar mi cuenta
            </a>
          </p>
          <p style="font-size:12px;color:#666;">Este enlace expira en 24 horas.</p>
        </div>
      `;

      const info = await this.transporter.sendMail({
        from: '"Sistema de Ventas" <plataformauta2023@gmail.com>',
        to,
        subject,
        html,
      });

      this.logger.log(`Email de verificación enviado a ${to}: ${info.messageId}`);
    } catch (err) {
      this.logger.error(`Error enviando correo de verificación: ${err?.message || err}`);
    }
  }

  async sendPasswordResetEmail(to: string, token: string) {
    try {
      const resetLink = `http://localhost:5173/reset-password?token=${token}`;
      const subject = "Recuperación de contraseña";

      const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Recuperación de contraseña</h2>
          <p>Haz clic para restablecer tu contraseña:</p>
          <p>
            <a href="${resetLink}" 
               style="display:inline-block;background:#0ea5e9;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;">
               Restablecer contraseña
            </a>
          </p>
          <p style="font-size:12px;color:#666;">El enlace expira en 1 hora.</p>
        </div>
      `;

      const info = await this.transporter.sendMail({
        from: '"Sistema de Ventas" <plataformauta2023@gmail.com>',
        to,
        subject,
        html,
      });

      this.logger.log(`Email de recuperación enviado a ${to}: ${info.messageId}`);
    } catch (err) {
      this.logger.error(`Error enviando correo de recuperación: ${err?.message || err}`);
    }
  }
}
