import { neon } from "@neondatabase/serverless";
import { SignJWT } from "jose";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const baseUrl = (
  process.argv[2] ||
  process.env.I_GO_RENT_PRODUCTION_URL ||
  "https://i-go-rent-72cn.vercel.app"
).replace(/\/$/, "");

function readEnvFile(path) {
  if (!existsSync(path)) return {};

  return Object.fromEntries(
    readFileSync(path, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const [name, ...rest] = line.split("=");
        const value = rest
          .join("=")
          .trim()
          .replace(/^['"]|['"]$/g, "");
        return [name.trim(), value];
      }),
  );
}

const env = {
  ...readEnvFile(join(root, ".env.local")),
  ...process.env,
};

if (!env.DATABASE_URL) {
  console.error("DATABASE_URL is not configured.");
  process.exit(1);
}

if (!env.AUTH_SECRET) {
  console.error("AUTH_SECRET is not configured.");
  process.exit(1);
}

const sql = neon(env.DATABASE_URL);
const idSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const email = `smoke-account-${idSuffix}@igorent.test`;
const nextPassword = `SmokeNext-${idSuffix}!`;
const userId = `smoke-account-${idSuffix}`;
const secret = new TextEncoder().encode(env.AUTH_SECRET);
const wait = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

async function withDbRetry(operation, label) {
  let lastError = null;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt < 3) await wait(attempt * 1000);
    }
  }

  throw new Error(`${label} failed: ${lastError?.message || "unknown error"}`);
}

async function readJson(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    cache: "no-store",
    ...options,
    headers: {
      ...(options.headers || {}),
    },
  });
  const body = await response.json().catch(() => null);
  return { response, body };
}

function tokenFromActionUrl(actionUrl) {
  return new URL(actionUrl).searchParams.get("token");
}

async function createCookie() {
  const token = await new SignJWT({
    id: userId,
    userId,
    email,
    userType: "renter",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);

  return `auth-token=${token}`;
}

try {
  await readJson("/api/auth/password-reset/request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "nonexistent-account@igorent.test" }),
  });

  const createRows = await sql`
    INSERT INTO users (
      id, email, password_hash, full_name, name, role, status, kyc_status,
      first_name, last_name, phone_number, user_type, city, state, country,
      residential_area, legal_use_accepted_at
    )
    VALUES (
      ${userId}, ${email}, '$2b$10$empty-placeholder',
      'Smoke Account', 'Smoke Account', 'renter', 'active', 'pending',
      'Smoke', 'Account', '08000000004', 'renter', 'Lekki Phase 1',
      'Lagos', 'Nigeria', 'Lekki Phase 1', NOW()
    )
    RETURNING id
  `;
  if (createRows[0].id !== userId) {
    throw new Error("Smoke account user id was not returned.");
  }

  await sql`
    INSERT INTO identity_verification (
      user_id, verification_status
    )
    VALUES (${userId}, 'pending')
  `;

  const cookie = await createCookie();
  const resend = await readJson("/api/auth/resend-verification", {
    method: "POST",
    headers: { Cookie: cookie },
  });

  if (resend.response.status !== 200) {
    throw new Error(
      `/api/auth/resend-verification returned ${resend.response.status}`,
    );
  }

  const outbox = await readJson(
    `/api/dev/email-outbox?email=${encodeURIComponent(email)}`,
  );
  const verificationEmail = outbox.body?.emails?.find(
    (item) => item.email_type === "email_verification",
  );

  if (!verificationEmail?.action_url) {
    throw new Error("Verification email was not queued.");
  }

  const verify = await readJson("/api/auth/verify-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: tokenFromActionUrl(verificationEmail.action_url) }),
  });

  if (verify.response.status !== 200) {
    throw new Error(`/api/auth/verify-email returned ${verify.response.status}`);
  }

  const verifiedRows = await sql`
    SELECT email_verified_at
    FROM users
    WHERE id = ${userId}
  `;

  if (!verifiedRows[0]?.email_verified_at) {
    throw new Error("Smoke account email was not marked verified.");
  }

  const resetRequest = await readJson("/api/auth/password-reset/request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (resetRequest.response.status !== 200) {
    throw new Error(
      `/api/auth/password-reset/request returned ${resetRequest.response.status}`,
    );
  }

  const resetOutbox = await readJson(
    `/api/dev/email-outbox?email=${encodeURIComponent(email)}`,
  );
  const resetEmail = resetOutbox.body?.emails?.find(
    (item) => item.email_type === "password_reset",
  );

  if (!resetEmail?.action_url) {
    throw new Error("Password reset email was not queued.");
  }

  const reset = await readJson("/api/auth/password-reset/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token: tokenFromActionUrl(resetEmail.action_url),
      password: nextPassword,
    }),
  });

  if (reset.response.status !== 200) {
    throw new Error(
      `/api/auth/password-reset/confirm returned ${reset.response.status}`,
    );
  }

  const updatedRows = await sql`
    SELECT password_hash
    FROM users
    WHERE id = ${userId}
  `;

  if (updatedRows[0]?.password_hash === "$2b$10$empty-placeholder") {
    throw new Error("Smoke account password hash was not updated.");
  }

  console.log(
    JSON.stringify({
      ok: true,
      baseUrl,
      email,
      verificationQueued: true,
      resetQueued: true,
      cleanup: "pending",
    }),
  );
} finally {
  if (userId) {
    await withDbRetry(
      () => sql`DELETE FROM email_outbox WHERE user_id = ${userId}`,
      "Delete smoke account outbox",
    );
    await withDbRetry(
      () => sql`DELETE FROM password_reset_tokens WHERE user_id = ${userId}`,
      "Delete smoke account reset tokens",
    );
    await withDbRetry(
      () => sql`DELETE FROM email_verification_tokens WHERE user_id = ${userId}`,
      "Delete smoke account verification tokens",
    );
    await withDbRetry(
      () => sql`DELETE FROM identity_verification WHERE user_id = ${userId}`,
      "Delete smoke account identity",
    );
    await withDbRetry(
      () => sql`DELETE FROM users WHERE id = ${userId}`,
      "Delete smoke account user",
    );
  }
}
