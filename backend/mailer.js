async function sendEmail({ to, subject, text, html }) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.MAIL_FROM;

  if (!apiKey) {
    throw new Error('BREVO_API_KEY is missing in environment variables');
  }
  if (!senderEmail) {
    throw new Error('MAIL_FROM is missing in environment variables');
  }

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'PawCare', email: senderEmail },
      to: [{ email: to }],
      subject,
      textContent: text,
      htmlContent: html,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Brevo API error (${response.status}): ${errorText}`);
  }
}

export async function sendVerificationEmail(to, code) {
  await sendEmail({
    to,
    subject: 'Your PawCare verification code',
    text: `Your PawCare verification code is ${code}. It expires in 10 minutes. If you didn't request this, you can ignore this email.`,
    html: `
      <div style="font-family: sans-serif; color: #24332d; max-width: 480px; line-height: 1.6;">
        <h2 style="color: #245c49; margin-bottom: 8px;">Verify your PawCare email</h2>
        <p>Enter this 6-digit code to finish setting up your account. It expires in <strong>10 minutes</strong>.</p>
        <p style="font-size: 28px; font-weight: 700; letter-spacing: 6px; color: #173f32; background: #e6efe8; padding: 12px 16px; border-radius: 8px; display: inline-block; margin: 12px 0;">
          ${code}
        </p>
        <p style="font-size: 13px; color: #718078;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(to, link) {
  await sendEmail({
    to,
    subject: 'Reset your PawCare password',
    text: `Use this link to reset your PawCare password:\n\n${link}\n\nThe link expires in 30 minutes. If you didn't ask for this, you can ignore this email.`,
    html: `
      <div style="font-family: sans-serif; color: #24332d; max-width: 480px; line-height: 1.6;">
        <h2 style="color: #245c49; margin-bottom: 8px;">Reset your PawCare password</h2>
        <p>We received a request to reset your password. Click the button below to choose a new one. This link expires in <strong>30 minutes</strong>.</p>
        <p style="margin: 20px 0;">
          <a href="${link}" style="background: #245c49; color: #ffffff; text-decoration: none; font-weight: 700; padding: 12px 20px; border-radius: 8px; display: inline-block;">
            Reset password
          </a>
        </p>
        <p style="font-size: 12px; color: #718078; word-break: break-all;">
          Or paste this link into your browser:<br />
          <a href="${link}" style="color: #245c49;">${link}</a>
        </p>
        <p style="font-size: 13px; color: #718078;">If you didn't ask for a password reset, you can safely ignore this email.</p>
      </div>
    `,
  });
}