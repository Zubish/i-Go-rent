import { createHash, randomBytes } from "node:crypto";

import { sql } from "@/lib/db";

type AccountEmailType = "email_verification" | "password_reset";

function appUrl() {
  const rawUrl = (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");

  return /^https?:\/\//.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
}

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function createPlainToken() {
  return randomBytes(32).toString("base64url");
}

async function queueEmail(input: {
  userId: string;
  email: string;
  type: AccountEmailType;
  subject: string;
  body: string;
  actionUrl: string;
}) {
  await sql(
    `INSERT INTO email_outbox (
      user_id, recipient_email, email_type, subject, body, action_url, status
    )
    VALUES ($1, $2, $3, $4, $5, $6, 'queued')`,
    [
      input.userId,
      input.email,
      input.type,
      input.subject,
      input.body,
      input.actionUrl,
    ],
  );
}

export async function queueVerificationEmail(input: {
  userId: string;
  email: string;
  firstName?: string;
}) {
  const token = createPlainToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const actionUrl = `${appUrl()}/verify-email?token=${encodeURIComponent(token)}`;

  await sql(
    `UPDATE email_verification_tokens
     SET used_at = NOW()
     WHERE user_id = $1 AND used_at IS NULL`,
    [input.userId],
  );
  await sql(
    `INSERT INTO email_verification_tokens (
      user_id, email, token_hash, expires_at
    )
    VALUES ($1, $2, $3, $4)`,
    [input.userId, input.email, tokenHash(token), expiresAt.toISOString()],
  );
  await sql(
    `UPDATE users SET email_verification_sent_at = NOW() WHERE id = $1`,
    [input.userId],
  );

  await queueEmail({
    userId: input.userId,
    email: input.email,
    type: "email_verification",
    subject: "Confirm your i.Go-rent email",
    actionUrl,
    body: `Hi ${input.firstName || "there"}, confirm your email to secure your i.Go-rent account: ${actionUrl}`,
  });

  return { actionUrl };
}

export async function queuePasswordResetEmail(input: {
  userId: string;
  email: string;
  firstName?: string;
}) {
  const token = createPlainToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  const actionUrl = `${appUrl()}/reset-password?token=${encodeURIComponent(token)}`;

  await sql(
    `UPDATE password_reset_tokens
     SET used_at = NOW()
     WHERE user_id = $1 AND used_at IS NULL`,
    [input.userId],
  );
  await sql(
    `INSERT INTO password_reset_tokens (
      user_id, email, token_hash, expires_at
    )
    VALUES ($1, $2, $3, $4)`,
    [input.userId, input.email, tokenHash(token), expiresAt.toISOString()],
  );

  await queueEmail({
    userId: input.userId,
    email: input.email,
    type: "password_reset",
    subject: "Reset your i.Go-rent password",
    actionUrl,
    body: `Hi ${input.firstName || "there"}, reset your i.Go-rent password here: ${actionUrl}`,
  });

  return { actionUrl };
}

export async function verifyEmailToken(token: string) {
  const rows = await sql(
    `UPDATE email_verification_tokens evt
     SET used_at = NOW()
     FROM users u
     WHERE evt.user_id = u.id
       AND evt.token_hash = $1
       AND evt.used_at IS NULL
       AND evt.expires_at > NOW()
     RETURNING evt.user_id, evt.email`,
    [tokenHash(token)],
  );

  const row = rows[0];
  if (!row) return { success: false, error: "Invalid or expired link" };

  await sql(
    `UPDATE users
     SET email_verified_at = NOW(), updated_at = NOW()
     WHERE id = $1`,
    [row.user_id],
  );

  return { success: true, email: row.email };
}

export async function resetPasswordWithToken(token: string, passwordHash: string) {
  const rows = await sql(
    `UPDATE password_reset_tokens prt
     SET used_at = NOW()
     FROM users u
     WHERE prt.user_id = u.id
       AND prt.token_hash = $1
       AND prt.used_at IS NULL
       AND prt.expires_at > NOW()
     RETURNING prt.user_id, prt.email`,
    [tokenHash(token)],
  );

  const row = rows[0];
  if (!row) return { success: false, error: "Invalid or expired link" };

  await sql(
    `UPDATE users
     SET password_hash = $1, updated_at = NOW()
     WHERE id = $2`,
    [passwordHash, row.user_id],
  );

  return { success: true, email: row.email };
}
