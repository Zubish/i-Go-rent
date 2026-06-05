import { NextResponse } from "next/server";

import { seedListings } from "@/lib/demo-marketplace";
import { getMarketplaceListing } from "@/lib/marketplace-data";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const listing = await getMarketplaceListing(id);
    const fallbackListing =
      listing || seedListings.find((item) => item.id === id) || null;

    if (!fallbackListing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    return NextResponse.json({ listing: fallbackListing });
  } catch (error) {
    console.error("Listing lookup failed:", error);
    const { id } = await params;
    const listing = seedListings.find((item) => item.id === id);

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    return NextResponse.json({ listing, degraded: true });
  }
}
