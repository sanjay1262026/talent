import nodemailer from "nodemailer";

export function isEmailConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    process.env.SMTP_FROM
  );
}

export async function sendPasswordResetEmail(to: string, name: string, resetUrl: string): Promise<void> {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;

  if (!host || !user || !pass || !from) {
    throw new Error("SMTP environment variables are not configured");
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  const firstName = name.split(" ")[0] || "there";

  await transporter.sendMail({
    from,
    to,
    subject: "Reset your TalentOS password",
    text: [
      `Hi ${firstName},`,
      "",
      "We received a request to reset the password for your TalentOS account.",
      "Click the link below to choose a new password. The link expires in 60 minutes and can only be used once.",
      "",
      resetUrl,
      "",
      "If you didn't request this, you can safely ignore this email — your password will stay unchanged.",
      "",
      "— The TalentOS team",
    ].join("\n"),
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:Inter,'Segoe UI',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#ffffff;border-radius:14px;border:1px solid #e4e6eb;overflow:hidden;">
        <tr>
          <td style="background:#111318;padding:22px 32px;">
            <span style="display:inline-block;width:28px;height:28px;line-height:28px;text-align:center;background:#375dfb;border-radius:8px;color:#fff;font-weight:700;font-size:13px;">T</span>
            <span style="color:#ffffff;font-size:15px;font-weight:600;margin-left:10px;vertical-align:middle;">TalentOS</span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h1 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#111318;letter-spacing:-0.02em;">Reset your password</h1>
            <p style="margin:0 0 20px;font-size:13px;line-height:1.7;color:#555963;">
              Hi ${escapeHtml(firstName)}, we received a request to reset the password for your
              <strong>TalentOS</strong> account. Choose a new password using the button below.
            </p>
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
              <tr><td align="center" style="border-radius:10px;background:#375dfb;">
                <a href="${resetUrl}" target="_blank" rel="noopener"
                   style="display:inline-block;padding:13px 28px;font-size:13px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">
                  Choose a new password
                </a>
              </td></tr>
            </table>
            <p style="margin:0 0 8px;font-size:11px;line-height:1.7;color:#858a93;">
              This link expires in <strong>60 minutes</strong> and can only be used once.
            </p>
            <p style="margin:0;font-size:11px;line-height:1.7;color:#858a93;">
              If you didn't request a reset, you can safely ignore this email — your password will remain unchanged.
            </p>
            <p style="margin:18px 0 0;padding-top:16px;border-top:1px solid #eceef1;font-size:10px;line-height:1.6;color:#a2a6ad;word-break:break-all;">
              Trouble with the button? Paste this into your browser:<br>
              <a href="${resetUrl}" style="color:#3152d5;">${resetUrl}</a>
            </p>
          </td>
        </tr>
      </table>
      <p style="margin:16px 0 0;font-size:10px;color:#9a9ea8;">TalentOS · Resume intelligence</p>
    </td></tr>
  </table>
</body>
</html>`,
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
