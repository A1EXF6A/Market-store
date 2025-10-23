import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import env from '../../config/env';

@Injectable()
export class EmailService {
  constructor(private mailerService: MailerService) {}

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    // URL del frontend donde el usuario ingresará la nueva contraseña
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    await this.mailerService.sendMail({
      to: email,
      from: env.email.from,
      subject: '🔐 Restablecer tu contraseña',
      template: './reset-password',
      context: {
        resetUrl,
      },
    });
  }

  async sendVerificationEmail(email: string, verificationToken: string, firstName: string): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verificationUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;

    await this.mailerService.sendMail({
      to: email,
      from: env.email.from,
      subject: '✅ Verifica tu cuenta',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>¡Hola ${firstName}!</h2>
          <p>Gracias por registrarte en nuestro Sistema de Ventas Multiempresa.</p>
          <p>Para completar tu registro, por favor verifica tu correo electrónico haciendo clic en el siguiente enlace:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Verificar mi cuenta
            </a>
          </div>
          <p>Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:</p>
          <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
          <p><strong>Este enlace expira en 24 horas.</strong></p>
          <p>Si no creaste esta cuenta, puedes ignorar este email.</p>
        </div>
      `,
    });
  }
}