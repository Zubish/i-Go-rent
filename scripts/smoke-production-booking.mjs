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
const userId = `smoke-renter-${idSuffix}`;
const email = `${userId}@igorent.test`;
const secret = new TextEncoder().encode(env.AUTH_SECRET);

const startDate = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000);
const endDate = new Date(Date.now() + 46 * 24 * 60 * 60 * 1000);
const toDateInput = (date) => date.toISOString().slice(0, 10);
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

let bookingId = null;

try {
  const listings = await readJson("/api/listings");
  const listing = listings.body?.listings?.find(
    (item) => item.vendorVerified && item.available,
  );

  if (!listing) {
    throw new Error("No verified available listing found for booking smoke.");
  }

  await withDbRetry(
    () => sql`
      INSERT INTO users (
        id, email, password_hash, full_name, name, role, status, kyc_status,
        first_name, last_name, phone_number, user_type, city, state, country,
        residential_area, is_verified, legal_use_accepted_at
      )
      VALUES (
        ${userId}, ${email}, 'smoke-only-auth-token', 'Smoke Renter',
        'Smoke Renter', 'renter', 'active', 'verified', 'Smoke', 'Renter',
        '08000000000', 'renter', 'Lekki Phase 1', 'Lagos', 'Nigeria',
        'Lekki Phase 1', TRUE, NOW()
      )
    `,
    "Create smoke renter",
  );

  await withDbRetry(
    () => sql`
      INSERT INTO identity_verification (
        user_id, nin, nin_verified, nin_verified_at, verification_status
      )
      VALUES (${userId}, '19999999999', TRUE, NOW(), 'verified')
    `,
    "Create smoke renter identity",
  );

  const cookie = await createCookie();
  const body = {
    listingId: listing.id,
    renterName: "Smoke Renter",
    renterPhone: "08000000000",
    startDate: toDateInput(startDate),
    endDate: toDateInput(endDate),
    deliveryType: "self-pickup",
    legalUseAccepted: true,
    conditionAcknowledged: true,
  };

  const created = await readJson("/api/bookings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
    },
    body: JSON.stringify(body),
  });

  if (created.response.status !== 201 || !created.body?.booking?.id) {
    throw new Error(`/api/bookings create returned ${created.response.status}`);
  }

  bookingId = created.body.booking.id;

  const duplicate = await readJson("/api/bookings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
    },
    body: JSON.stringify(body),
  });

  if (duplicate.response.status !== 409) {
    throw new Error(
      `/api/bookings overlap check returned ${duplicate.response.status}`,
    );
  }

  const dashboard = await readJson("/api/bookings?role=renter", {
    headers: { Cookie: cookie },
  });

  if (
    dashboard.response.status !== 200 ||
    !dashboard.body?.bookings?.some((booking) => booking.id === bookingId)
  ) {
    throw new Error("/api/bookings did not return the smoke renter booking.");
  }

  console.log(
    JSON.stringify({
      ok: true,
      baseUrl,
      listing: listing.id,
      booking: bookingId,
      overlapStatus: duplicate.response.status,
      cleanup: "pending",
    }),
  );
} finally {
  if (bookingId) {
    await withDbRetry(
      () => sql`DELETE FROM dispatch_assignments WHERE booking_id = ${bookingId}`,
      "Delete smoke dispatch assignments",
    );
    await withDbRetry(
      () => sql`DELETE FROM bookings WHERE id = ${bookingId}`,
      "Delete smoke booking",
    );
  }

  await withDbRetry(
    () => sql`DELETE FROM identity_verification WHERE user_id = ${userId}`,
    "Delete smoke identity",
  );
  await withDbRetry(
    () => sql`DELETE FROM users WHERE id = ${userId}`,
    "Delete smoke renter",
  );
}
