import { NextResponse } from "next/server"

import { getMarketplaceListing } from "@/lib/marketplace-data"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const listing = await getMarketplaceListing(id)

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 })
    }

    return NextResponse.json({ listing })
  } catch (error) {
    console.error("Listing lookup failed:", error)
    return NextResponse.json({ error: "Failed to fetch listing" }, { status: 500 })
  }
}
