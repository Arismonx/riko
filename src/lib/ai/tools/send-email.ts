import { tool } from '@openai/agents';
import nodemailer from 'nodemailer';
import { z } from 'zod';

import { env } from '../config';

type EmailPayload = {
    emailTo: string | string[];
    subject: string;
    htmlContent: string;
};

const EMAIL_ENABLED = Boolean(env.SMTP_HOST && env.EMAILS_FROM_EMAIL);

export const _sendEmail = async ({
    emailTo,
    subject,
    htmlContent: html,
}: EmailPayload) => {
    if (!EMAIL_ENABLED) {
        console.log('Email is disabled');
        return;
    }
    const transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        auth: {
            user: env.SMTP_USER,
            pass: env.SMTP_PASSWORD,
        },
        // debug: true,
    });

    const mailOptions = {
        from: `${env.EMAILS_FROM_NAME} <${env.EMAILS_FROM_EMAIL}>`,
        to: emailTo,
        subject: subject,
        html: html,
        secure: env.SMTP_SSL,
        ...(env.SMTP_TLS && {
            tls: {
                rejectUnauthorized: false,
                minVersion: 'TLSv1.2',
            },
        }),
    };

    const response = await transporter.sendMail(mailOptions);
    console.log('send email result:', response);
};

export const sendEmail = tool({
    name: 'send_email',
    description: 'Send an email to a recipient.',
    parameters: z.object({
        emailTo: z
            .union([z.string(), z.array(z.string())])
            .describe('Recipient email address(es)'),
        subject: z.string().describe('Email subject'),
        htmlContent: z.string().describe('HTML content of the email'),
    }),
    async execute(input) {
        console.log(`[debug] sending email to ${input.emailTo}`);
        return _sendEmail({
            emailTo: input.emailTo,
            subject: input.subject,
            htmlContent: input.htmlContent,
        });
    },
});
