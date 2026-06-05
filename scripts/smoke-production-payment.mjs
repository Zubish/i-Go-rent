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
const userId = `smoke-payment-${idSuffix}`;
const email = `${userId}@igorent.test`;
const secret = new TextEncoder().encode(env.AUTH_SECRET);
const startDate = new Date(Date.now() + 75 * 24 * 60 * 60 * 1000);
const endDate = new Date(Date.now() + 76 * 24 * 60 * 60 * 1000);
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
    throw new Error("No verified available listing found for payment smoke.");
  }

  await withDbRetry(
    () => sql`
      INSERT INTO users (
        id, email, password_hash, full_name, name, role, status, kyc_status,
        first_name, last_name, phone_number, user_type, city, state, country,
        residential_area, is_verified, legal_use_accepted_at
      )
      VALUES (
        ${userId}, ${email}, 'smoke-only-auth-token', 'Smoke Payment',
        'Smoke Payment', 'renter', 'active', 'verified', 'Smoke', 'Payment',
        '08000000002', 'renter', 'Lekki Phase 1', 'Lagos', 'Nigeria',
        'Lekki Phase 1', TRUE, NOW()
      )
    `,
    "Create smoke payment renter",
  );

  await withDbRetry(
    () => sql`
      INSERT INTO identity_verification (
        user_id, nin, nin_verified, nin_verified_at, verification_status
      )
      VALUES (${userId}, '17777777777', TRUE, NOW(), 'verified')
    `,
    "Create smoke payment identity",
  );

  const cookie = await createCookie();
  const created = await readJson("/api/bookings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
    },
    body: JSON.stringify({
      listingId: listing.id,
      renterName: "Smoke Payment",
      renterPhone: "08000000002",
      startDate: toDateInput(startDate),
      endDate: toDateInput(endDate),
      deliveryType: "self-pickup",
      legalUseAccepted: true,
      conditionAcknowledged: true,
    }),
  });

  if (created.response.status !== 201 || !created.body?.booking?.id) {
    throw new Error(`/api/bookings create returned ${created.response.status}`);
  }

  bookingId = created.body.booking.id;

  const checkout = await readJson("/api/payments/checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
    },
    body: JSON.stringify({ bookingId }),
  });

  if (![200, 503].includes(checkout.response.status)) {
    throw new Error(
      `/api/payments/checkout returned ${checkout.response.status}`,
    );
  }

  if (checkout.response.status === 200 && !checkout.body?.paymentLink) {
    throw new Error("/api/payments/checkout did not return a payment link.");
  }

  if (
    checkout.response.status === 503 &&
    checkout.body?.error !== "Payment provider is not configured"
  ) {
    throw new Error("/api/payments/checkout returned an unclear 503.");
  }

  console.log(
    JSON.stringify({
      ok: true,
      baseUrl,
      booking: bookingId,
      checkoutStatus: checkout.response.status,
      providerConfigured: checkout.response.status === 200,
      cleanup: "pending",
    }),
  );
} finally {
  if (bookingId) {
    await withDbRetry(
      () => sql`DELETE FROM payments WHERE booking_id = ${bookingId}`,
      "Delete smoke payment rows",
    );
    await withDbRetry(
      () => sql`DELETE FROM dispatch_assignments WHERE booking_id = ${bookingId}`,
      "Delete smoke payment dispatch assignments",
    );
    await withDbRetry(
      () => sql`DELETE FROM bookings WHERE id = ${bookingId}`,
      "Delete smoke payment booking",
    );
  }

  await withDbRetry(
    () => sql`DELETE FROM identity_verification WHERE user_id = ${userId}`,
    "Delete smoke payment identity",
  );
  await withDbRetry(
    () => sql`DELETE FROM users WHERE id = ${userId}`,
    "Delete smoke payment renter",
  );
}
