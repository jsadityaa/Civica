const admin = require("firebase-admin");
const { onRequest } = require("firebase-functions/v2/https");
const nodemailer = require("nodemailer");

admin.initializeApp();

const SITE_URL = "https://polycivic.com";
const SMTP_HOST = process.env.SMTP_HOST || "mail.privateemail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
const SMTP_USER = process.env.SMTP_USER || "support@polycivic.com";
const SMTP_PASS = String(process.env.SMTP_PASS || "").replace(/^['"]|['"]$/g, "");

const escapeHtml = (value) => {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const createTransporter = () => {
  if (!SMTP_PASS) {
    throw new Error("SMTP_PASS is not configured.");
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    requireTLS: SMTP_PORT === 587,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });
};

const buildPasswordResetEmail = ({ email, link }) => {
  const safeEmail = escapeHtml(email);
  const safeLink = escapeHtml(link);

  return {
    subject: "Reset your Polycivic password",
    text: [
      "Reset your Polycivic password",
      "",
      `We received a request to reset the password for ${email}.`,
      "",
      `Use this secure link to reset your password: ${link}`,
      "",
      "If you did not request this, you can ignore this email.",
      "",
      "Polycivic"
    ].join("\n"),
    html: `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4f6fb;font-family:Inter,Arial,sans-serif;color:#111827;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6fb;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #dce3ef;border-radius:18px;overflow:hidden;">
            <tr>
              <td style="padding:28px 32px 14px;">
                <div style="font-family:Georgia,serif;font-style:italic;font-size:32px;color:#e8564f;">Polycivic</div>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 32px;">
                <h1 style="margin:0 0 16px;font-size:26px;line-height:1.2;color:#111827;">Reset your password</h1>
                <p style="margin:0 0 18px;font-size:16px;line-height:1.6;color:#4b5563;">We received a request to reset the password for <strong>${safeEmail}</strong>.</p>
                <p style="margin:0 0 26px;font-size:16px;line-height:1.6;color:#4b5563;">Use the secure button below to choose a new password.</p>
                <a href="${safeLink}" style="display:inline-block;background:#2879b5;color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:13px 18px;border-radius:999px;">Reset password</a>
                <p style="margin:28px 0 0;font-size:14px;line-height:1.6;color:#6b7280;">If you did not request this, you can ignore this email.</p>
              </td>
            </tr>
          </table>
          <p style="max-width:560px;margin:16px 0 0;font-size:12px;line-height:1.5;color:#6b7280;">This message was sent by Polycivic for account security.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`
  };
};

exports.requestPasswordReset = onRequest({ region: "us-central1" }, async (request, response) => {
  if (request.method !== "POST") {
    response.set("Allow", "POST");
    response.status(405).json({ error: "Method not allowed." });
    return;
  }

  const email = String(request.body?.email || "").trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    response.status(400).json({ error: "Enter a valid email address." });
    return;
  }

  try {
    const link = await admin.auth().generatePasswordResetLink(email, {
      url: SITE_URL,
      handleCodeInApp: false
    });
    const message = buildPasswordResetEmail({ email, link });
    const transporter = createTransporter();

    await transporter.sendMail({
      from: `"Polycivic" <${SMTP_USER}>`,
      to: email,
      replyTo: SMTP_USER,
      subject: message.subject,
      text: message.text,
      html: message.html
    });

    response.status(200).json({ ok: true });
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      response.status(200).json({ ok: true });
      return;
    }

    console.error("Password reset email failed:", error);
    response.status(500).json({
      error: "Password reset email could not be sent.",
      code: error.code || "",
      response: error.response || error.message || ""
    });
  }
});
