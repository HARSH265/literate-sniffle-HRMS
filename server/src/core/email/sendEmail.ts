import nodemailer from 'nodemailer';
import { env } from '../../config/env.js';

const transporter = nodemailer.createTransport({
  host: env.EMAIL_HOST,
  port: env.EMAIL_PORT,
  secure: env.EMAIL_PORT === 465,
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASSWORD,
  },
});

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!env.EMAIL_HOST || !env.EMAIL_USER) {
    console.warn('Email not configured — skipping send to:', to);
    return;
  }

  await transporter.sendMail({
    from: env.EMAIL_FROM || `HRMS <${env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
}
