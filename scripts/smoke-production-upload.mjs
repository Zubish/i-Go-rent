import { neon } from "@neondatabase/serverless";
import { del } from "@vercel/blob";
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
const userId = `smoke-upload-${idSuffix}`;
const email = `${userId}@igorent.test`;
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

async function upload(cookie) {
  const formData = new FormData();
  const file = new File(
    [
      new Uint8Array([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00,
        0x0d, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00,
        0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89,
        0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63,
        0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4,
        0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60,
        0x82,
      ]),
    ],
    "smoke.png",
    { type: "image/png" },
  );
  formData.append("file", file);

  const response = await fetch(`${baseUrl}/api/uploads/listing-photo`, {
    method: "POST",
    headers: cookie ? { Cookie: cookie } : undefined,
    body: formData,
  });
  const body = await response.json().catch(() => null);
  return { response, body };
}

let uploadedUrl = "";

try {
  const unauthenticated = await upload("");

  if (unauthenticated.response.status !== 401) {
    throw new Error(
      `/api/uploads/listing-photo unauth returned ${unauthenticated.response.status}`,
    );
  }

  await withDbRetry(
    () => sql`
      INSERT INTO users (
        id, email, password_hash, full_name, name, role, status, kyc_status,
        first_name, last_name, phone_number, user_type, city, state, country,
        residential_area, is_verified, legal_use_accepted_at
      )
      VALUES (
        ${userId}, ${email}, 'smoke-only-auth-token', 'Smoke Upload',
        'Smoke Upload', 'renter', 'active', 'verified', 'Smoke', 'Upload',
        '08000000003', 'renter', 'Lekki Phase 1', 'Lagos', 'Nigeria',
        'Lekki Phase 1', TRUE, NOW()
      )
    `,
    "Create smoke upload user",
  );

  const authenticated = await upload(await createCookie());

  if (![200, 503].includes(authenticated.response.status)) {
    throw new Error(
      `/api/uploads/listing-photo auth returned ${authenticated.response.status}`,
    );
  }

  if (authenticated.response.status === 200 && !authenticated.body?.url) {
    throw new Error("/api/uploads/listing-photo did not return a stored URL.");
  }

  if (
    authenticated.response.status === 503 &&
    authenticated.body?.error !== "Image storage is not configured"
  ) {
    throw new Error("/api/uploads/listing-photo returned an unclear 503.");
  }

  uploadedUrl = authenticated.body?.url || "";

  console.log(
    JSON.stringify({
      ok: true,
      baseUrl,
      unauthenticatedStatus: unauthenticated.response.status,
      uploadStatus: authenticated.response.status,
      imageStorageConfigured: authenticated.response.status === 200,
      cleanup: "pending",
    }),
  );
} finally {
  if (uploadedUrl && env.BLOB_READ_WRITE_TOKEN) {
    await del(uploadedUrl, { token: env.BLOB_READ_WRITE_TOKEN });
  }

  await withDbRetry(
    () => sql`DELETE FROM users WHERE id = ${userId}`,
    "Delete smoke upload user",
  );
}
