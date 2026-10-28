import nodemailer from "nodemailer";

import {
  getEmailConfig,
} from "@/lib/email/email-config";

export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export type EmailSendResult = {
  messageId: string;
};

type EmailEnvironment =
  Record<
    string,
    string | undefined
  > & {
    SMTP_HOST?: string;
    SMTP_PORT?: string;
    SMTP_SECURE?: string;
    SMTP_USER?: string;
    SMTP_PASSWORD?: string;
    SMTP_FROM_EMAIL?: string;
    SMTP_FROM_NAME?: string;
  };

export async function sendEmail(
  message: EmailMessage,
  env: EmailEnvironment =
    process.env
): Promise<EmailSendResult> {
  const config =
    getEmailConfig(env);

  const transporter =
    nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.password,
      },
    });

  const result =
    await transporter.sendMail({
      from: {
        name:
          config.fromName,
        address:
          config.fromEmail,
      },
      to: message.to,
      subject:
        message.subject,
      text: message.text,
      html: message.html,
    });

  return {
    messageId:
      result.messageId,
  };
}