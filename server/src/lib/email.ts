import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { config } from '../config.js';
import { logger } from '../logger.js';
import type { EmailTemplate } from './email-templates.js';

let _transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (_transporter) return _transporter;

  if (!config.SMTP_HOST) {
    // Return a no-op transporter that just logs (dev/test mode)
    _transporter = nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
    });
    logger.warn('SMTP_HOST not configured — emails will not be delivered');
    return _transporter;
  }

  _transporter = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure: config.SMTP_PORT === 465,
    auth: config.SMTP_USER && config.SMTP_PASS
      ? { user: config.SMTP_USER, pass: config.SMTP_PASS }
      : undefined,
  });

  return _transporter;
}

export interface SendEmailOptions {
  to: string | string[];
  template: EmailTemplate;
  replyTo?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const transporter = getTransporter();
  const recipients = Array.isArray(options.to) ? options.to.join(', ') : options.to;

  try {
    const info = await transporter.sendMail({
      from: config.SMTP_FROM,
      to: recipients,
      replyTo: options.replyTo,
      subject: options.template.subject,
      html: options.template.html,
      text: options.template.text,
    });

    logger.debug(
      { messageId: info.messageId, to: recipients, subject: options.template.subject },
      'Email sent',
    );
  } catch (err) {
    logger.error(
      { err, to: recipients, subject: options.template.subject },
      'Failed to send email',
    );
    // Don't throw — email failures are non-fatal
  }
}

export async function verifySmtpConnection(): Promise<boolean> {
  if (!config.SMTP_HOST) return false;

  try {
    await getTransporter().verify();
    logger.info({ host: config.SMTP_HOST, port: config.SMTP_PORT }, 'SMTP connection verified');
    return true;
  } catch (err) {
    logger.warn({ err }, 'SMTP connection verification failed');
    return false;
  }
}
