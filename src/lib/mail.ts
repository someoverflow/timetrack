import nodemailer from "nodemailer";
import type Mail from "nodemailer/lib/mailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SSL ?? process.env.NODE_ENV != "development",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
} as SMTPTransport.Options);

type SendMail = {
  receipents: (Mail.Address | string)[];
  subject: string;
  text: string;
  html: string;
  priority?: "high" | "normal" | "low" | undefined;
};

export const sendMail = async ({
  receipents,
  subject,
  text,
  html,
  priority,
}: SendMail) => {
  return await transport.sendMail({
    from: process.env.SMTP_SENDER,
    to: receipents,
    subject,
    priority,
    html,
    text,
  });
};
