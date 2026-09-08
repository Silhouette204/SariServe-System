import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(toEmail, verificationLink) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'SariServe <onboarding@resend.dev>', // default test sender ng Resend
      to: toEmail,
      subject: 'I-verify ang iyong SariServe account',
      html: `
        <h2>Salamat sa pag-sign up sa SariServe!</h2>
        <p>I-click ang link sa ibaba para i-verify ang iyong email:</p>
        <a href="${verificationLink}">Verify Email</a>
        <p>Mag-e-expire ang link na ito sa loob ng 1 oras.</p>
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