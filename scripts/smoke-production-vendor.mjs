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
const userId = `smoke-vendor-${idSuffix}`;
const email = `${userId}@igorent.test`;
const title = `Smoke Vendor Listing ${idSuffix}`;
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
    userType: "vendor",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);

  return `auth-token=${token}`;
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

let listingId = null;

try {
  await withDbRetry(
    () => sql`
      INSERT INTO users (
        id, email, password_hash, full_name, name, role, status, kyc_status,
        first_name, last_name, phone_number, user_type, city, state, country,
        residential_area, is_verified, legal_use_accepted_at
      )
      VALUES (
        ${userId}, ${email}, 'smoke-only-auth-token', 'Smoke Vendor',
        'Smoke Vendor', 'vendor', 'active', 'verified', 'Smoke', 'Vendor',
        '08000000001', 'vendor', 'Lekki Phase 1', 'Lagos', 'Nigeria',
        'Lekki Phase 1', TRUE, NOW()
      )
    `,
    "Create smoke vendor",
  );

  await withDbRetry(
    () => sql`
      INSERT INTO identity_verification (
        user_id, nin, nin_verified, nin_verified_at, bvn, bvn_verified,
        bvn_verified_at, verification_status
      )
      VALUES (${userId}, '18888888888', TRUE, NOW(), '28888888888', TRUE, NOW(), 'verified')
    `,
    "Create smoke vendor identity",
  );

  await withDbRetry(
    () => sql`
      INSERT INTO vendor_profiles (
        user_id, business_name, pickup_area, pickup_address,
        verification_level, can_publish
      )
      VALUES (
        ${userId}, 'Smoke Vendor Rentals', 'Lekki Phase 1',
        'Smoke test pickup address', 'basic_verified', TRUE
      )
    `,
    "Create smoke vendor profile",
  );

  const cookie = await createCookie();
  const invalid = await readJson("/api/listings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
    },
    body: JSON.stringify({
      title: "",
      category: "Events",
      pricePerDay: -1,
    }),
  });

  if (invalid.response.status !== 400) {
    throw new Error(
      `/api/listings invalid create returned ${invalid.response.status}`,
    );
  }

  const created = await readJson("/api/listings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
    },
    body: JSON.stringify({
      title,
      category: "Events",
      description:
        "Smoke-tested event equipment listing with condition details and photo proof.",
      pricePerDay: 25000,
      securityDeposit: 50000,
      location: "Admiralty Way, Lekki Phase 1",
      condition: "Excellent",
      knownDefects: "No functional defects; light cosmetic wear disclosed.",
      accessories: "Speaker pair, mixer, microphone, stands, cables.",
      usageLimits: "Covered indoor use only. No rain exposure.",
      replacementValue: 450000,
      lateReturnFee: 12000,
      maxRentalDays: 4,
      imageUrls:
        "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80",
    }),
  });

  if (created.response.status !== 201 || !created.body?.listing?.id) {
    throw new Error(`/api/listings create returned ${created.response.status}`);
  }

  listingId = created.body.listing.id;

  const detail = await readJson(`/api/listings/${listingId}`);

  if (
    detail.response.status !== 200 ||
    detail.body?.listing?.id !== listingId ||
    detail.body?.listing?.vendorId !== userId
  ) {
    throw new Error("/api/listings/[id] did not return the smoke listing.");
  }

  console.log(
    JSON.stringify({
      ok: true,
      baseUrl,
      listing: listingId,
      invalidStatus: invalid.response.status,
      detailSource: detail.body.source,
      cleanup: "pending",
    }),
  );
} finally {
  if (listingId) {
    await withDbRetry(
      () => sql`DELETE FROM listings WHERE id = ${listingId}`,
      "Delete smoke listing",
    );
  }

  await withDbRetry(
    () => sql`DELETE FROM vendor_profiles WHERE user_id = ${userId}`,
    "Delete smoke vendor profile",
  );
  await withDbRetry(
    () => sql`DELETE FROM identity_verification WHERE user_id = ${userId}`,
    "Delete smoke vendor identity",
  );
  await withDbRetry(
    () => sql`DELETE FROM users WHERE id = ${userId}`,
    "Delete smoke vendor",
  );
}
