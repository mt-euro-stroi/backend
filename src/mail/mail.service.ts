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

  async sendEmail(options: {
    to: string;
    subject: string;
    text?: string;
    html?: string;
  }) {
    const { to, subject, text, html } = options;

    this.logger.log(`Sending email to ${to}`);

    try {
      const info = await this.transporter.sendMail({
        from: process.env.MAIL_FROM,
        to,
        subject,
        text,
        html,
      });

      this.logger.log(
        `Email sent successfully to ${to} (messageId=${info.messageId})`,
      );

      return info;
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error.stack);
      throw error;
    }
  }

  async sendVerificationCode(email: string, code: string) {
    const currentYear = new Date().getFullYear();

    const text = `Ваш код подтверждения: ${code}`;
    const subject = 'Подтверждение электронной почты';
    const html = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f6f8;padding:40px 0;font-family:Arial,sans-serif">
      <tr>
        <td align="center">
          <table width="500" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:14px;padding:40px 30px">
            
            <tr>
              <td align="center" style="padding-bottom:20px">
                <h2 style="margin:0;font-size:22px;color:#2c3e50">
                  Подтверждение электронной почты
                </h2>
              </td>
            </tr>

            <tr>
              <td style="font-size:16px;color:#555555;line-height:1.6;text-align:center">
                Спасибо за регистрацию! <br>
                Введите код ниже, чтобы завершить создание аккаунта:
              </td>
            </tr>

            <tr>
              <td align="center" style="padding:35px 0">
                <div style="display:inline-block;padding:18px 35px;font-size:28px;font-weight:bold;letter-spacing:8px;color:#ffffff;background:linear-gradient(135deg,#b8860a,#daa520);border-radius:10px">
                  ${code}
                </div>
              </td>
            </tr>

            <tr>
              <td style="font-size:14px;color:#888888;text-align:center;padding-bottom:25px">
                Код действует в течение 10 минут.
              </td>
            </tr>

            <tr>
              <td>
                <hr style="border:none;border-top:1px solid #eeeeee">
              </td>
            </tr>

            <tr>
              <td style="font-size:12px;color:#999999;text-align:center;padding-top:20px;line-height:1.5">
                Если вы не запрашивали это письмо, просто проигнорируйте его.<br>
                © ${currentYear} MT Euro
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
    `;

    return this.sendEmail({
      to: email,
      subject,
      text,
      html,
    });
  }

  async sendBookingStatusEmail(options: {
    email: string;
    apartmentTitle: string;
    status: 'CREATED' | 'CONFIRMED' | 'CANCELLED' | 'REMOVED';
  }) {
    const { email, apartmentTitle, status } = options;

    const currentYear = new Date().getFullYear();

    const statusMap = {
      CREATED: {
        subject: 'Бронь создана',
        title: 'Ваша бронь создана',
        text: `Мы получили вашу заявку на бронирование. Если бронь не будет подтверждена администратором в течение  дней, она будет автоматически отменена.`,
      },
      CONFIRMED: {
        subject: 'Бронь подтверждена',
        title: 'Бронь подтверждена',
        text: 'Поздравляем! Ваша бронь была подтверждена.',
      },
      CANCELLED: {
        subject: 'Бронь отменена',
        title: 'Бронь отменена',
        text: 'К сожалению, ваша бронь была отменена.',
      },
      REMOVED: {
        subject: 'Бронь удалена',
        title: 'Бронь удалена',
        text: 'Ваша бронь была удалена.',
      },
    };

    const config = statusMap[status];

    const html = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f6f8;padding:40px 0;font-family:Arial,sans-serif">
      <tr>
        <td align="center">
          <table width="500" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:14px;padding:40px 30px">
            
            <tr>
              <td align="center" style="padding-bottom:20px">
                <h2 style="margin:0;font-size:22px;color:#2c3e50">
                  ${config.title}
                </h2>
              </td>
            </tr>

            <tr>
              <td style="font-size:16px;color:#555555;line-height:1.6;text-align:center">
                ${config.text}
              </td>
            </tr>

            <tr>
              <td align="center" style="padding:35px 0">
                <div style="display:inline-block;padding:16px 28px;font-size:18px;font-weight:bold;color:#ffffff;background:linear-gradient(135deg,#b8860a,#daa520);border-radius:10px">
                  ${apartmentTitle}
                </div>
              </td>
            </tr>

            <tr>
              <td style="font-size:14px;color:#888888;text-align:center;padding-bottom:25px">
                Если у вас есть вопросы, свяжитесь с нами.
              </td>
            </tr>

            <tr>
              <td>
                <hr style="border:none;border-top:1px solid #eeeeee">
              </td>
            </tr>

            <tr>
              <td style="font-size:12px;color:#999999;text-align:center;padding-top:20px;line-height:1.5">
                © ${currentYear} MT Euro
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
    `;

    const text = `${config.title}. Объект: ${apartmentTitle}`;

    return this.sendEmail({
      to: email,
      subject: config.subject,
      text,
      html,
    });
  }
}
