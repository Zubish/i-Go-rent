const baseUrl = (
  process.argv[2] ||
  process.env.I_GO_RENT_PRODUCTION_URL ||
  "https://i-go-rent-72cn.vercel.app"
).replace(/\/$/, "");

async function readJson(path, expectedStatuses = [200]) {
  const response = await fetch(`${baseUrl}${path}`, { cache: "no-store" });
  const body = await response.json().catch(() => null);

  if (!expectedStatuses.includes(response.status)) {
    throw new Error(`${path} returned ${response.status}`);
  }

  return { response, body };
}

const health = await readJson("/api/health", [200, 207]);
const listings = await readJson("/api/listings");

if (!health.body?.marketplace) {
  throw new Error("/api/health did not return marketplace status");
}

if (!Array.isArray(listings.body?.listings) || !listings.body.listings.length) {
  throw new Error("/api/listings did not return usable listings");
}

const firstListing = listings.body.listings[0];
const detail = await readJson(`/api/listings/${firstListing.id}`);

if (!detail.body?.listing?.id) {
  throw new Error("/api/listings/[id] did not return listing detail");
}

console.log(
  JSON.stringify({
    ok: true,
    baseUrl,
    healthStatus: health.body.marketplace.status,
    healthSource: health.body.marketplace.source,
    listings: listings.body.listings.length,
    firstListing: firstListing.id,
    detailSource: detail.body.source,
  }),
);
