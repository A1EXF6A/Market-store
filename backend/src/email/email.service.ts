import { Injectable, Logger } from "@nestjs/common";
import * as nodemailer from "nodemailer";

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    // Valores por defecto para YAHOO
    const DEFAULTS = {
      host: "smtp.mail.yahoo.com",
      port: 465, 
      user: "commercehub_ad@yahoo.com",
      pass: "",
      from: 'Sistema de Ventas <commercehub_ad@yahoo.com>',
      frontendUrl: "http://localhost:5173",
    };

    const host = process.env.EMAIL_HOST || DEFAULTS.host;
    const port = process.env.EMAIL_PORT
      ? parseInt(process.env.EMAIL_PORT, 10)
      : DEFAULTS.port;

    const user = process.env.EMAIL_USER || DEFAULTS.user;
    const pass = process.env.EMAIL_PASS || DEFAULTS.pass;
    const from = process.env.EMAIL_FROM || DEFAULTS.from;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, 
      auth: {
        user,
        pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    this.transporter
      .verify()
      .then(() =>
        this.logger.log(
          `SMTP Yahoo listo → ${host}:${port} (user: ${user})`
        )
      )
      .catch((err) =>
        this.logger.warn(
          `Error verificando SMTP Yahoo (${host}:${port}): ${err.message}`
        )
      );
  }

  private getFrom() {
    return process.env.EMAIL_FROM || 'Sistema de Ventas <commercehub_ad@yahoo.com>';
  }

  private getFrontendUrl() {
    return process.env.FRONTEND_URL || "http://localhost:5173";
  }

  async sendVerificationEmail(to: string, token: string, name?: string) {
    const link = `${this.getFrontendUrl()}/verify-email?token=${token}`;
    const subject = "Verifica tu cuenta en Marketplace";

    const html = `
      <div style="font-family: Arial; padding: 20px;">
        <h2>Hola ${name || "usuario"} 👋</h2>
        <p>Gracias por registrarte en <b>Marketplace</b>.</p>
        <p>Haz clic en el botón para activar tu cuenta:</p>
        <a href="${link}" 
           style="display:inline-block;background:#1e293b;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;">
           Verificar mi cuenta
        </a>
        <p style="font-size:12px;color:#555;margin-top:10px;">Enlace válido por 24 horas.</p>
      </div>
    `;

    const info = await this.transporter.sendMail({
      from: this.getFrom(),
      to,
      subject,
      html,
    });

    this.logger.log(`Email de verificación enviado a ${to}`);
    return info;
  }

  async sendPasswordResetEmail(to: string, token: string) {
    const link = `${this.getFrontendUrl()}/reset-password?token=${token}`;
    const subject = "Recuperación de contraseña";

    const html = `
      <div style="font-family: Arial; padding: 20px;">
        <h2>Recuperación de contraseña</h2>
        <p>Haz clic para restablecer tu contraseña:</p>
        <a href="${link}" 
           style="display:inline-block;background:#0ea5e9;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;">
           Restablecer contraseña
        </a>
        <p style="font-size:12px;color:#555;margin-top:10px;">Este enlace expira en 1 hora.</p>
      </div>
    `;

    const info = await this.transporter.sendMail({
      from: this.getFrom(),
      to,
      subject,
      html,
    });

    this.logger.log(`Email de recuperación enviado a ${to}`);
    return info;
  }
}
