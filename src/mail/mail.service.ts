import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    const options: SMTPTransport.Options = {
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT),
      secure: false,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
      },
    };

    this.transporter = nodemailer.createTransport(options);

    this.logger.log('Mail transporter initialized');
  }

  async sendVerificationCode(email: string, code: string) {
    this.logger.log(`Sending verification code to ${email}`);

    try {
      const info = await this.transporter.sendMail({
        from: process.env.MAIL_FROM,
        to: email,
        subject: 'Email verification',
        text: `Your verification code is: ${code}`,
      });

      this.logger.log(
        `Verification email sent successfully (messageId=${info.messageId})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send verification email to ${email}`,
        error.stack,
      );
      throw error;
    }
  }
}
