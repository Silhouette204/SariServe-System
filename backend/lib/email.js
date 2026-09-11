import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(toEmail, code, expiryMinutes = 3) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'SariServe <onboarding@resend.dev>',
      to: toEmail,
      subject: 'Ang iyong SariServe verification code',
      html: `
        <h2>Salamat sa paggamit ng SariServe!</h2>
        <p>Ito ang iyong 6-digit verification code:</p>
        <h1 style="letter-spacing: 4px; font-size: 32px;">${code}</h1>
        <p>Mag-e-expire ang code na ito sa loob ng ${expiryMinutes} minuto.</p>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      throw new Error('Hindi na-send ang verification email.');
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
      subject: 'I-reset ang iyong SariServe password',
      html: `
        <h2>Humiling ka ng password reset</h2>
        <p>Ito ang iyong reset code:</p>
        <h1 style="letter-spacing: 4px; font-size: 32px;">${code}</h1>
        <p>Mag-e-expire ang code na ito sa loob ng ${expiryMinutes} minuto.</p>
        <p>Kung hindi ikaw ang humiling nito, puwede mo na lang balewalain ang email na ito.</p>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      throw new Error('Hindi na-send ang reset email.');
    }

    return data;
  } catch (err) {
    console.error('sendPasswordResetEmail error:', err);
    throw err;
  }
}