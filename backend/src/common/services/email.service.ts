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
}