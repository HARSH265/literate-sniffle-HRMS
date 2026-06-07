import nodemailer from 'nodemailer';
import { env } from '../../config/env.js';
import { logger } from '../logger/logger.js';

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;

  private static getTransporter(): nodemailer.Transporter {
    if (!this.transporter && env.EMAIL_HOST) {
      this.transporter = nodemailer.createTransport({
        host: env.EMAIL_HOST,
        port: env.EMAIL_PORT,
        secure: env.EMAIL_PORT === 465,
        auth: {
          user: env.EMAIL_USER,
          pass: env.EMAIL_PASSWORD,
        },
      });
    }
    return this.transporter as nodemailer.Transporter;
  }

  static async send(
    to: string,
    subject: string,
    html: string,
  ): Promise<void> {
    try {
      const transport = this.getTransporter();
      if (!transport) {
        logger.warn('Email transport not configured, skipping email');
        return;
      }

      await transport.sendMail({
        from: env.EMAIL_FROM,
        to,
        subject,
        html,
      });

      logger.info(`Email sent to ${to}: ${subject}`);
    } catch (error) {
      logger.error('Email send failed:', error);
    }
  }

  static async sendWithConfig(
    to: string,
    subject: string,
    html: string,
    config: {
      host: string;
      port?: number;
      secure?: boolean;
      user?: string;
      pass?: string;
      from?: string;
    },
  ): Promise<void> {
    try {
      const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port ?? 587,
        secure: config.secure ?? false,
        auth: config.user ? { user: config.user, pass: config.pass } : undefined,
      });

      await transporter.sendMail({
        from: config.from ?? env.EMAIL_FROM,
        to,
        subject,
        html,
      });

      logger.info(`Email sent via custom config to ${to}: ${subject}`);
    } catch (error) {
      logger.error('Custom email send failed:', error);
    }
  }

  static getWelcomeTemplate(name: string): string {
    return `
      <h2>Welcome to HRMS</h2>
      <p>Hello ${name},</p>
      <p>Your HRMS account has been created.</p>
      <p>Please log in and change your password.</p>
    `;
  }

  static getPasswordResetTemplate(resetUrl: string): string {
    return `
      <h2>Password Reset</h2>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>This link expires in 10 minutes.</p>
    `;
  }

  static getSalarySlipTemplate(employeeName: string, month: string): string {
    return `
      <h2>Salary Slip</h2>
      <p>Hello ${employeeName},</p>
      <p>Your salary slip for ${month} is ready.</p>
      <p>Please log in to the HRMS to download it.</p>
    `;
  }
}