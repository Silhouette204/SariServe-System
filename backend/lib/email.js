import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(toEmail, code) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'SariServe <onboarding@resend.dev>',
      to: toEmail,
      subject: 'Ang iyong SariServe verification code',
      html: `
        <h2>Salamat sa pag-sign up sa SariServe!</h2>
        <p>Ito ang iyong 6-digit verification code:</p>
        <h1 style="letter-spacing: 4px; font-size: 32px;">${code}</h1>
        <p>Mag-e-expire ang code na ito sa loob ng 1 oras.</p>
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