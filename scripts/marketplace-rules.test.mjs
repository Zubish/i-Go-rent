import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (file) => readFileSync(join(root, file), "utf8");

const packageJson = JSON.parse(read("package.json"));
const nextConfig = read("next.config.mjs");
const proxy = read("proxy.ts");
const healthRoute = read("app/api/health/route.ts");
const health = read("lib/marketplace-health.ts");
const listingsRoute = read("app/api/listings/route.ts");
const listingDetailRoute = read("app/api/listings/[id]/route.ts");
const bookingsRoute = read("app/api/bookings/route.ts");
const paymentsCheckoutRoute = read("app/api/payments/checkout/route.ts");
const listingPhotoUploadRoute = read("app/api/uploads/listing-photo/route.ts");
const bookingPage = read("app/(marketplace)/bookings/[id]/page.tsx");
const paymentCallbackPage = read("app/(marketplace)/payments/callback/page.tsx");
const browsePage = read("app/(marketplace)/browse/page.tsx");
const dashboardPage = read("app/(dashboard)/dashboard/page.tsx");
const demoStore = read("lib/demo-client-store.ts");
const productionMigration = read("scripts/02-production-auth-and-marketplace.sql");

function assertAbsent(source, pattern, message) {
  assert.equal(pattern.test(source), false, message);
}

function assertPresent(source, pattern, message) {
  assert.equal(pattern.test(source), true, message);
}

assert.equal(
  packageJson.scripts.test,
  "node scripts/marketplace-rules.test.mjs",
  "Marketplace regression tests should be runnable with npm test.",
);
assert.equal(
  packageJson.scripts["db:seed"],
  "node scripts/seed-marketplace.mjs",
  "Database seed script should be available as npm run db:seed.",
);
assert.equal(
  packageJson.scripts["smoke:production"],
  "node scripts/smoke-production.mjs",
  "Production smoke checks should be available as npm run smoke:production.",
);
assert.equal(
  packageJson.scripts["smoke:production-booking"],
  "node scripts/smoke-production-booking.mjs",
  "Authenticated booking smoke checks should be available as npm run smoke:production-booking.",
);
assert.equal(
  packageJson.scripts["smoke:production-payment"],
  "node scripts/smoke-production-payment.mjs",
  "Payment checkout smoke checks should be available as npm run smoke:production-payment.",
);
assert.equal(
  packageJson.scripts["smoke:production-upload"],
  "node scripts/smoke-production-upload.mjs",
  "Listing photo upload smoke checks should be available as npm run smoke:production-upload.",
);
assert.equal(
  packageJson.scripts["smoke:production-vendor"],
  "node scripts/smoke-production-vendor.mjs",
  "Verified vendor listing smoke checks should be available as npm run smoke:production-vendor.",
);

assertAbsent(
  nextConfig,
  /ignoreBuildErrors:\s*true/,
  "Next.js builds must not ignore TypeScript errors.",
);
assertPresent(
  proxy,
  /matcher:\s*\["\/dashboard\/:path\*", "\/bookings\/:path\*", "\/payments\/:path\*"\]/,
  "Protected app routes should be guarded before rendering signed-out screens.",
);
assertPresent(
  proxy,
  /request\.cookies\.get\("auth-token"\)/,
  "Route guard should check for the production auth cookie.",
);

assertPresent(
  healthRoute,
  /getMarketplaceHealth/,
  "Health API should expose marketplace health.",
);
assertPresent(
  health,
  /requiredTables[\s\S]*escrow_transactions[\s\S]*payments[\s\S]*dispatch_assignments/,
  "Marketplace health must check trust-critical tables.",
);
assertPresent(
  health,
  /paymentProviderConfigured/,
  "Marketplace health should disclose payment-provider readiness.",
);
assertPresent(
  health,
  /imageStorageConfigured/,
  "Marketplace health should disclose listing image storage readiness.",
);
assertPresent(
  health,
  /source:\s*"seeded_fallback"/,
  "Marketplace health should disclose seeded fallback mode.",
);

assertPresent(
  listingsRoute,
  /source:\s*"database"/,
  "Listings API should disclose database-backed responses.",
);
assertPresent(
  listingsRoute,
  /degraded:\s*true[\s\S]*source:\s*"seeded_fallback"/,
  "Listings API should disclose degraded seed fallback responses.",
);
assertPresent(
  listingsRoute,
  /Sign in before creating a listing/,
  "Listing creation should require a signed-in account.",
);
assertAbsent(
  listingsRoute,
  /Vendor KYC incomplete/,
  "Regular signed-in users should be able to post unverified listings.",
);
assertPresent(
  listingsRoute,
  /numberInRange[\s\S]*pricePerDay[\s\S]*maxRentalDays/,
  "Listing creation should validate pricing and rental limits.",
);
assertPresent(
  listingsRoute,
  /data:image\//,
  "Listing creation should accept uploaded image data for tests and previews.",
);
assertPresent(
  listingsRoute,
  /Array\.isArray\(value\)/,
  "Uploaded image data should be accepted as an array so data URLs are not split on commas.",
);
assertPresent(
  listingsRoute,
  /Add at least one item photo/,
  "Listing creation should require item photos without exposing URL-based implementation copy.",
);
assertPresent(
  listingDetailRoute,
  /source:\s*listing \? "database" : "seeded_fallback"/,
  "Listing detail API should disclose seed fallback responses.",
);

assertPresent(
  bookingsRoute,
  /total_paid, status[\s\S]*0, 'pending'/,
  "Bookings should start payment pending instead of pretending funds are held.",
);
assertPresent(
  bookingsRoute,
  /status IN \('pending', 'confirmed', 'active', 'disputed'\)[\s\S]*start_date <= \$3::date[\s\S]*end_date >= \$2::date/,
  "Bookings should block overlapping active reservations before checkout.",
);
assertPresent(
  bookingsRoute,
  /status:\s*409/,
  "Overlapping booking attempts should return an HTTP 409 conflict.",
);
assertPresent(
  productionMigration,
  /CREATE EXTENSION IF NOT EXISTS btree_gist[\s\S]*bookings_no_active_overlap[\s\S]*EXCLUDE USING gist/,
  "Database migration should enforce active booking date overlap prevention.",
);
assertAbsent(
  bookingsRoute,
  /INSERT INTO escrow_transactions/,
  "Booking creation should not create held escrow before payment verification.",
);
assertPresent(
  paymentsCheckoutRoute,
  /FLUTTERWAVE_SECRET_KEY/,
  "Payment checkout should fail clearly when Flutterwave is not configured.",
);
assertPresent(
  paymentsCheckoutRoute,
  /Only the renter can pay for this booking/,
  "Payment checkout should only allow the booking renter to pay.",
);
assertPresent(
  paymentsCheckoutRoute,
  /booking\.status !== "pending"/,
  "Payment checkout should only initialize for pending bookings.",
);
assertPresent(
  paymentsCheckoutRoute,
  /initializeFlutterwavePayment[\s\S]*INSERT INTO payments/,
  "Payment checkout should initialize the provider and record initiated payments.",
);
assertPresent(
  bookingPage,
  /payment_pending[\s\S]*Escrow will be marked as held only after payment is verified/,
  "Booking detail page should explain payment-pending escrow state.",
);
assertPresent(
  bookingPage,
  /Pay and hold escrow/,
  "Booking detail page should let renters start payment for pending bookings.",
);
assertPresent(
  bookingPage,
  /booking\.escrowStatus === "payment_pending"[\s\S]*booking\.escrowStatus === "deposit_refunded"/,
  "Return inspection should be disabled while payment is pending.",
);
assertPresent(
  paymentCallbackPage,
  /Payment is being verified/,
  "Payment callback should give renters a clear verification state.",
);

for (const source of [browsePage, dashboardPage]) {
  assertPresent(
    source,
    /role="status"[\s\S]*aria-live="polite"/,
    "Degraded marketplace notices should be accessible live status messages.",
  );
}

assertPresent(
  dashboardPage,
  /listingError[\s\S]*role="alert"/,
  "Vendor listing errors should be announced as accessible alerts.",
);
assertAbsent(
  dashboardPage,
  /dashboardRoles|setRole\(|role=\$\{role\}/,
  "Dashboard should not expose renter/vendor/logistics account switching.",
);
assertPresent(
  dashboardPage,
  /type="file"[\s\S]*accept="image\/\*"/,
  "Dashboard listing creation should use photo upload instead of pasted URLs.",
);
assertPresent(
  dashboardPage,
  /api\/uploads\/listing-photo/,
  "Dashboard should upload selected listing photos before creating listings.",
);
assertAbsent(
  dashboardPage,
  /imageUrls:\s*photoDataUrls/,
  "Dashboard should not save browser preview data URLs as listing images.",
);
assertPresent(
  listingPhotoUploadRoute,
  /BLOB_READ_WRITE_TOKEN/,
  "Listing photo uploads should require configured Blob storage.",
);
assertPresent(
  listingPhotoUploadRoute,
  /Sign in before uploading listing photos/,
  "Listing photo uploads should require authentication.",
);
assertPresent(
  listingPhotoUploadRoute,
  /image\/jpeg[\s\S]*image\/png[\s\S]*image\/webp/,
  "Listing photo uploads should validate supported image types.",
);

assertPresent(
  demoStore,
  /escrowStatus:\s*"payment_pending"/,
  "Demo bookings should follow payment-pending semantics.",
);
assertPresent(
  demoStore,
  /crypto\.getRandomValues/,
  "Demo handover code generation should prefer Web Crypto.",
);

console.log("Marketplace rule regression tests passed.");
