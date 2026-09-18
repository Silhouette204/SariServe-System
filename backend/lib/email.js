import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(toEmail, code, expiryMinutes = 3) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'SariServe <onboarding@resend.dev>',
      to: toEmail,
      subject: 'Your SariServe verification code',
      html: `
        <h2>Thank you for using SariServe!</h2>
        <p>This is your 6-digit verification code:</p>
        <h1 style="letter-spacing: 4px; font-size: 32px;">${code}</h1>
        <p>It will expire under ${expiryMinutes} minutes.</p>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      throw new Error('Verification email, Does not send successfully');
    }

    return data;
  } catch (err) {
    console.error('sendVerificationEmail error:', err);
    throw err;
  }
}

export async function sendPasswordResetEmail(toEmail, code, expiryMinutes = 10) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'SariServe <onboarding@resend.dev>',
      to: toEmail,
      subject: 'Reset your SariServe account password',
      html: `
        <h2>You request to reset your password.</h2>
        <p>This is your reset code:</p>
        <h1 style="letter-spacing: 4px; font-size: 32px;">${code}</h1>
        <p>It will expire under ${expiryMinutes} minutes.</p>
        <p>If you're not requesting this process, you can ignore this message in your email.</p>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      throw new Error('Email Reset does not submit succesfully.');
    }

    return data;
  } catch (err) {
    console.error('sendPasswordResetEmail error:', err);
    throw err;
  }
}