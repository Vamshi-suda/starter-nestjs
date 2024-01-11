import {getTimeStringWithTimezoneAndOffset} from '@/utils/helpers';
import {Injectable} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import * as SendGrid from '@sendgrid/mail';

export type MailData = {
  otp_subject: string;
  otp_subject_message?: string;
  otp: string;
  otp_action_name: string;
  otp_magic_link: string;
  otp_expiry_minutes?: string;
  otp_expiry_timestamp?: string;
  platform_domain?: string;
  platform_legal_dba_name?: string;
};
export const MAIL_TEMPLATES = {
  CONFIRM_MY_EMAIL: {
    MAIL_SUBJECT_PREFIX: 'Confirm Email Address',
    OTP_SUBJECT: 'Confirm your Email Address',
    OTP_SUBJECT_MESSAGE: 'You can do so by typing your security code or by clicking the link on any device.',
    OTP_ACTION_NAME: 'Confirm My Email',
    OTP_EXPIRY_MINUTES: '5 Minutes',
  },
  SIGN_ME_IN: {
    MAIL_SUBJECT_PREFIX: 'Sign In',
    OTP_SUBJECT: 'Sign In to Your Account',
    OTP_ACTION_NAME: 'Sign Me In',
    OTP_EXPIRY_MINUTES: '5 Minutes',
  },
  RESET_PASSWORD: {
    MAIL_SUBJECT_PREFIX: 'Reset Password',
    OTP_SUBJECT: 'Reset Your Password',
    OTP_ACTION_NAME: 'Reset Password',
    OTP_EXPIRY_MINUTES: '5 Minutes',
  },
  GLID_REMINDER: {
    MAIL_SUBJECT_PREFIX: '',
    OTP_SUBJECT: 'Global Login ID Reminder',
    OTP_ACTION_NAME: 'Sign Me In',
    OTP_EXPIRY_MINUTES: '5 Minutes',
  },
};
@Injectable()
export class EmailService {
  constructor(private configService: ConfigService) {
    SendGrid.setApiKey(this.configService.get('SENDGRID_API_KEY'));
  }

  // Example: {
  //   "mail_subject":"Confirm Email Address | 5-Dec-2023 @ 10:25 AM",
  //   "mail_sender":"",
  //   "otp_subject":"Confirm your Email Address",
  //   "otp_subject_message":"You can do so by typing your security code or by clicking the link on any device.",
  //   "otp":"123456",
  //   "otp_action_name":"Confirm My Email",
  //   "otp_magic_link":"https://localhost:3000/magic-link",
  //   "otp_expiry_minutes":"5 Minutes",
  //   "otp_expiry_timestamp":"10:30 AM IST / UTC +5:30",
  //   "platform_domain":"https://app.agile-one.com",
  //   "platform_legal_dba_name":"Agile1 - AccelerationN"
  // }
  public async sendMail(recipient: string, subject: string, dynamicData: MailData) {
    const current = new Date();
    const dt = new Date();
    dt.setMinutes(dt.getMinutes() + 5);

    const payload = {
      to: recipient,
      from: {name: this.configService.get('SENDGRID_EMAIL_SENDER_NAME'), email: this.configService.get('SENDGRID_EMAIL_SENDER')},
      templateId: this.configService.get('SENDGRID_EMAIL_TEMPLATE_OTP_MAGICLINK'),
      subject: `${subject} | ${current
        .toLocaleDateString('en-gb', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
        .replace(/\s/g, '-')} @ ${current.toLocaleString('en', {
        hour: '2-digit',
        minute: '2-digit',
      })}`,
      dynamicTemplateData: {
        mail_subject: `${subject} | ${current
          .toLocaleDateString('en-gb', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
          .replace(/\s/g, '-')} @ ${current.toLocaleString('en', {
          hour: '2-digit',
          minute: '2-digit',
        })}`,
        platform_domain: this.configService.get('PLATFORM_DOMAIN') || 'https://app.agile-one.com',
        platform_legal_dba_name: this.configService.get('PLATFORM_LEGAL_DBA_NAME') || 'AgileOne - AccelerationN',
        otp_expiry_minutes: '5 Minutes',
        otp_expiry_timestamp: getTimeStringWithTimezoneAndOffset(dt, 'Asia/Calcutta', 'en', 'IN'), //TODO
        ...dynamicData,
      },
    };
    const response = await SendGrid.send(payload);
    return response;
  }

  public async sendOtpMailForConfirmEmail(recipient: string, otp: string, magicLink: string) {
    return this.sendMail(recipient, MAIL_TEMPLATES.CONFIRM_MY_EMAIL.MAIL_SUBJECT_PREFIX, {
      otp,
      otp_magic_link: magicLink,
      otp_subject: MAIL_TEMPLATES.CONFIRM_MY_EMAIL.OTP_SUBJECT,
      otp_subject_message: MAIL_TEMPLATES.CONFIRM_MY_EMAIL.OTP_SUBJECT_MESSAGE,
      otp_action_name: MAIL_TEMPLATES.CONFIRM_MY_EMAIL.OTP_ACTION_NAME,
      otp_expiry_minutes: MAIL_TEMPLATES.CONFIRM_MY_EMAIL.OTP_EXPIRY_MINUTES,
    });
  }

  public async sendOtpMailForAuth(recipient: string, otp: string, magicLink: string) {
    return this.sendMail(recipient, MAIL_TEMPLATES.SIGN_ME_IN.MAIL_SUBJECT_PREFIX, {
      otp,
      otp_magic_link: magicLink,
      otp_subject: MAIL_TEMPLATES.SIGN_ME_IN.OTP_SUBJECT,
      otp_action_name: MAIL_TEMPLATES.SIGN_ME_IN.OTP_ACTION_NAME,
      otp_expiry_minutes: MAIL_TEMPLATES.SIGN_ME_IN.OTP_EXPIRY_MINUTES,
    });
  }

  public async sendResetPassword(recipient: string, otp: string, magicLink: string) {
    return this.sendMail(recipient, MAIL_TEMPLATES.RESET_PASSWORD.MAIL_SUBJECT_PREFIX, {
      otp,
      otp_magic_link: magicLink,
      otp_subject: MAIL_TEMPLATES.RESET_PASSWORD.OTP_SUBJECT,
      otp_action_name: MAIL_TEMPLATES.RESET_PASSWORD.OTP_ACTION_NAME,
      otp_expiry_minutes: MAIL_TEMPLATES.RESET_PASSWORD.OTP_EXPIRY_MINUTES,
    });
  }

  public async sendGLIDReminder(recipient: string, otp: string, magicLink: string) {
    return this.sendMail(recipient, MAIL_TEMPLATES.GLID_REMINDER.MAIL_SUBJECT_PREFIX, {
      otp,
      otp_magic_link: magicLink,
      otp_subject: MAIL_TEMPLATES.GLID_REMINDER.OTP_SUBJECT,
      otp_action_name: MAIL_TEMPLATES.GLID_REMINDER.OTP_ACTION_NAME,
      otp_expiry_minutes: MAIL_TEMPLATES.GLID_REMINDER.OTP_EXPIRY_MINUTES,
    });
  }
}
