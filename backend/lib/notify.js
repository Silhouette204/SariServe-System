// backend/lib/notify.js
import { sendSms } from './sms.js';
import { sendVerificationEmail, sendPasswordResetEmail } from './email.js';

export async function sendOtp(user, code, minutes, type = 'verification') {

  console.log('sendOtp pref:', user.notificationPreferences, '| phone:', user.phoneNumber);

  if (user.notificationPreferences === 'PHONE') {
    if (!user.phoneNumber) throw new Error('SMS selected but no phone number on file');
    const label = type === 'reset' ? 'password reset' : 'verification';
    return sendSms(user.phoneNumber, `SariServe: your ${label} code is ${code}. It expires in ${minutes} minute(s).`);
  }

  return type === 'reset'
    ? sendPasswordResetEmail(user.email, code, minutes)
    : sendVerificationEmail(user.email, code, minutes);
}