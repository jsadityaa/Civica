const admin = require("firebase-admin");
const crypto = require("crypto");
const { HttpsError, onCall } = require("firebase-functions/v2/https");
const nodemailer = require("nodemailer");

admin.initializeApp();
const firestore = admin.firestore();

const SITE_URL = "https://polycivic.com";
const FIREBASE_WEB_API_KEY = process.env.FIREBASE_WEB_API_KEY || "AIzaSyCWFpJmfOZW5bMkx4vHCDtx-xfjhvwwE24";
const SMTP_HOST = process.env.SMTP_HOST || "mail.privateemail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
const SMTP_USER = process.env.SMTP_USER || "support@polycivic.com";
const SMTP_PASS = String(process.env.SMTP_PASS || "").replace(/^['"]|['"]$/g, "");
const PASSWORD_RESET_LIMITS = {
  email: {
    maxAttempts: 5,
    minIntervalMs: 60 * 1000,
    windowMs: 60 * 60 * 1000
  },
  ip: {
    maxAttempts: 20,
    minIntervalMs: 10 * 1000,
    windowMs: 60 * 60 * 1000
  }
};

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

const hashLimitKey = (value) => {
  return crypto.createHash("sha256").update(String(value || "unknown")).digest("hex");
};

const getClientIp = (request) => {
  const forwardedFor = request.rawRequest?.headers?.["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0].trim();
  }

  return request.rawRequest?.ip
    || request.rawRequest?.socket?.remoteAddress
    || "unknown";
};

const getRateLimitRef = (bucket, key) => {
  return firestore.collection("_rateLimits").doc(`passwordReset_${bucket}_${hashLimitKey(key)}`);
};

const getRecentAttempts = (data, cutoff) => {
  return Array.isArray(data.attempts)
    ? data.attempts.filter((attempt) => Number(attempt) >= cutoff)
    : [];
};

const assertRateLimit = async (bucket, key, limits) => {
  const now = Date.now();
  const cutoff = now - limits.windowMs;
  const limitRef = getRateLimitRef(bucket, key);
  const snapshot = await limitRef.get();
  const data = snapshot.exists ? snapshot.data() || {} : {};
  const attempts = getRecentAttempts(data, cutoff);
  const latestAttempt = attempts.length ? Math.max(...attempts) : 0;

  if (latestAttempt && now - latestAttempt < limits.minIntervalMs) {
    throw new HttpsError("resource-exhausted", "Please wait a moment before requesting another reset email.");
  }

  if (attempts.length >= limits.maxAttempts) {
    throw new HttpsError("resource-exhausted", "Too many reset requests. Please try again later.");
  }
};

const recordRateLimitAttempt = async (bucket, key, limits) => {
  const now = Date.now();
  const cutoff = now - limits.windowMs;
  const limitRef = getRateLimitRef(bucket, key);

  await firestore.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(limitRef);
    const data = snapshot.exists ? snapshot.data() || {} : {};
    const attempts = getRecentAttempts(data, cutoff);

    transaction.set(limitRef, {
      attempts: [...attempts, now],
      updatedAt: admin.firestore.Timestamp.fromMillis(now)
    }, { merge: true });
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

const sendFirebasePasswordResetEmail = async (email) => {
  if (!FIREBASE_WEB_API_KEY) {
    throw new Error("FIREBASE_WEB_API_KEY is not configured.");
  }

  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${FIREBASE_WEB_API_KEY}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      requestType: "PASSWORD_RESET",
      email,
      continueUrl: SITE_URL
    })
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = result?.error?.message || "Firebase password reset email failed.";
    const error = new Error(message);
    error.code = message;
    throw error;
  }
};

const sendPasswordResetEmail = async (email) => {
  const link = await admin.auth().generatePasswordResetLink(email, {
    url: SITE_URL,
    handleCodeInApp: false
  });
  const message = buildPasswordResetEmail({ email, link });
  const transporter = createTransporter();

  try {
    await transporter.sendMail({
      from: `"Polycivic" <${SMTP_USER}>`,
      to: email,
      replyTo: SMTP_USER,
      subject: message.subject,
      text: message.text,
      html: message.html
    });
  } catch (error) {
    console.error("Custom SMTP password reset email failed; falling back to Firebase Auth email:", {
      code: error.code || "",
      command: error.command || "",
      responseCode: error.responseCode || "",
      message: error.message || ""
    });
    await sendFirebasePasswordResetEmail(email);
  }
};

exports.requestPasswordReset = onCall({
  region: "us-central1"
}, async (request) => {
  const email = String(request.data?.email || "").trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpsError("invalid-argument", "Enter a valid email address.");
  }

  const clientIp = getClientIp(request);

  try {
    await assertRateLimit("email", email, PASSWORD_RESET_LIMITS.email);
    await assertRateLimit("ip", clientIp, PASSWORD_RESET_LIMITS.ip);

    await sendPasswordResetEmail(email);

    await recordRateLimitAttempt("email", email, PASSWORD_RESET_LIMITS.email);
    await recordRateLimitAttempt("ip", clientIp, PASSWORD_RESET_LIMITS.ip);
    return { ok: true };
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      await recordRateLimitAttempt("email", email, PASSWORD_RESET_LIMITS.email);
      await recordRateLimitAttempt("ip", clientIp, PASSWORD_RESET_LIMITS.ip);
      return { ok: true };
    }

    if (error instanceof HttpsError) {
      throw error;
    }

    console.error("Password reset email failed:", error);
    throw new HttpsError("internal", "Password reset email could not be sent.");
  }
});
