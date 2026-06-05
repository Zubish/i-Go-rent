import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (file) => readFileSync(join(root, file), "utf8");

const packageJson = JSON.parse(read("package.json"));
const nextConfig = read("next.config.mjs");
const healthRoute = read("app/api/health/route.ts");
const health = read("lib/marketplace-health.ts");
const listingsRoute = read("app/api/listings/route.ts");
const listingDetailRoute = read("app/api/listings/[id]/route.ts");
const bookingsRoute = read("app/api/bookings/route.ts");
const bookingPage = read("app/(marketplace)/bookings/[id]/page.tsx");
const browsePage = read("app/(marketplace)/browse/page.tsx");
const dashboardPage = read("app/(dashboard)/dashboard/page.tsx");
const demoStore = read("lib/demo-client-store.ts");

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

assertAbsent(
  nextConfig,
  /ignoreBuildErrors:\s*true/,
  "Next.js builds must not ignore TypeScript errors.",
);

assertPresent(
  healthRoute,
  /getMarketplaceHealth/,
  "Health API should expose marketplace health.",
);
assertPresent(
  health,
  /requiredTables[\s\S]*escrow_transactions[\s\S]*dispatch_assignments/,
  "Marketplace health must check trust-critical tables.",
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
  listingDetailRoute,
  /source:\s*listing \? "database" : "seeded_fallback"/,
  "Listing detail API should disclose seed fallback responses.",
);

assertPresent(
  bookingsRoute,
  /total_paid, status[\s\S]*0, 'pending'/,
  "Bookings should start payment pending instead of pretending funds are held.",
);
assertAbsent(
  bookingsRoute,
  /INSERT INTO escrow_transactions/,
  "Booking creation should not create held escrow before payment verification.",
);
assertPresent(
  bookingPage,
  /payment_pending[\s\S]*Escrow will be marked as held only after payment is verified/,
  "Booking detail page should explain payment-pending escrow state.",
);

for (const source of [browsePage, dashboardPage]) {
  assertPresent(
    source,
    /role="status"[\s\S]*aria-live="polite"/,
    "Degraded marketplace notices should be accessible live status messages.",
  );
}

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
