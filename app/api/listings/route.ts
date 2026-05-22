import { type NextRequest, NextResponse } from "next/server"

import { getCurrentUser } from "@/lib/auth"
import { getKycStatus, maxListingImages } from "@/lib/demo-marketplace"
import { sql } from "@/lib/db"
import { ensureCategoryId, getUserForPolicy, listMarketplaceListings, mapListing } from "@/lib/marketplace-data"

function splitImageUrls(value: unknown) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, maxListingImages)
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const listings = await listMarketplaceListings({
      query: searchParams.get("query") || undefined,
      category: searchParams.get("category") || undefined,
      area: searchParams.get("area") || undefined,
    })

    return NextResponse.json({ listings })
  } catch (error) {
    console.error("Listing fetch failed:", error)
    return NextResponse.json({ error: "Failed to fetch listings" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authUser = await getCurrentUser()

  if (!authUser) {
    return NextResponse.json({ error: "Sign in before creating a listing" }, { status: 401 })
  }

  try {
    const vendor = await getUserForPolicy(authUser.userId)
    const vendorKyc = getKycStatus(vendor, "vendor")

    if (!vendorKyc.canList) {
      return NextResponse.json({ error: `Vendor KYC incomplete: ${vendorKyc.missing.join(", ")}` }, { status: 403 })
    }

    const input = await request.json()
    const images = splitImageUrls(input.imageUrls)
    const categoryId = await ensureCategoryId(input.category || "Events")
    const result = await sql(
      `INSERT INTO listings (
        host_id, category_id, title, description, price_per_day, security_deposit_amount,
        location, city, state, condition, total_quantity, available_quantity, image_urls,
        available, known_defects, accessories, usage_limits, replacement_value,
        late_return_fee, max_rental_days, photo_count
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, 'Lagos', $9, 1, 1, $10,
        TRUE, $11, $12, $13, $14, $15, $16, $17
      )
      RETURNING *`,
      [
        authUser.userId,
        categoryId,
        input.title,
        input.description,
        Number(input.pricePerDay),
        Number(input.securityDeposit),
        input.location,
        vendor?.area || "Lagos",
        input.condition,
        images,
        input.knownDefects,
        input.accessories,
        input.usageLimits,
        Number(input.replacementValue),
        Number(input.lateReturnFee),
        Number(input.maxRentalDays || 7),
        images.length,
      ],
    )

    const rows = await sql(
      `SELECT
        l.*,
        c.name AS category_name,
        u.first_name,
        u.last_name,
        u.residential_area,
        u.is_verified,
        vp.business_name,
        vp.pickup_area,
        vp.can_publish,
        COALESCE(vp.pickup_area, u.residential_area, l.city) AS delivery_area
      FROM listings l
      JOIN categories c ON c.id = l.category_id
      JOIN users u ON u.id = l.host_id
      LEFT JOIN vendor_profiles vp ON vp.user_id = l.host_id
      WHERE l.id = $1`,
      [result[0].id],
    )

    return NextResponse.json({ listing: mapListing(rows[0]) }, { status: 201 })
  } catch (error) {
    console.error("Listing creation failed:", error)
    return NextResponse.json({ error: "Failed to create listing" }, { status: 500 })
  }
}
