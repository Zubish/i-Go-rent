import { type NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import {
  categories,
  maxListingImages,
  seedListings,
} from "@/lib/demo-marketplace";
import { sql } from "@/lib/db";
import {
  ensureCategoryId,
  getUserForPolicy,
  listMarketplaceListings,
  mapListing,
} from "@/lib/marketplace-data";

function splitImageUrls(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean).slice(0, maxListingImages);
  }

  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, maxListingImages);
}

function cleanText(value: unknown, maxLength = 800) {
  return String(value || "")
    .trim()
    .slice(0, maxLength);
}

function isValidImageSource(value: string) {
  if (value.startsWith("data:image/")) return true;

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function numberInRange(value: unknown, min: number, max: number) {
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max
    ? number
    : null;
}

function fallbackListings(filters: {
  query?: string | null;
  category?: string | null;
  area?: string | null;
}) {
  const query = filters.query?.trim().toLowerCase();
  const area = filters.area?.trim().toLowerCase();
  const category = filters.category?.trim();

  return seedListings.filter((listing) => {
    const searchText =
      `${listing.title} ${listing.description} ${listing.vendorName} ${listing.location}`.toLowerCase();
    const matchesQuery = !query || searchText.includes(query);
    const matchesCategory =
      !category || category === "All" || listing.category === category;
    const matchesArea =
      !area ||
      listing.location.toLowerCase().includes(area) ||
      listing.vendorArea.toLowerCase().includes(area) ||
      listing.deliveryArea.toLowerCase().includes(area);
    return listing.available && matchesQuery && matchesCategory && matchesArea;
  });
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filters = {
      query: searchParams.get("query"),
      category: searchParams.get("category"),
      area: searchParams.get("area"),
    };
    const listings = await listMarketplaceListings({
      query: filters.query || undefined,
      category: filters.category || undefined,
      area: filters.area || undefined,
    });

    return NextResponse.json({ listings, source: "database" });
  } catch (error) {
    console.error("Listing fetch failed:", error);
    const searchParams = request.nextUrl.searchParams;
    return NextResponse.json({
      listings: fallbackListings({
        query: searchParams.get("query"),
        category: searchParams.get("category"),
        area: searchParams.get("area"),
      }),
      degraded: true,
      source: "seeded_fallback",
      issue:
        "Database listings are unavailable; showing curated seed listings.",
    });
  }
}

export async function POST(request: NextRequest) {
  const authUser = await getCurrentUser();

  if (!authUser) {
    return NextResponse.json(
      { error: "Sign in before creating a listing" },
      { status: 401 },
    );
  }

  try {
    const vendor = await getUserForPolicy(authUser.userId);

    const input = await request.json();
    const title = cleanText(input.title, 120);
    const description = cleanText(input.description, 1200);
    const location = cleanText(input.location, 180);
    const knownDefects = cleanText(input.knownDefects, 800);
    const accessories = cleanText(input.accessories, 800);
    const usageLimits = cleanText(input.usageLimits, 800);
    const category = cleanText(input.category, 40);
    const condition = cleanText(input.condition, 40);
    const images = splitImageUrls(input.imageUrls).filter(isValidImageSource);
    const allowedCategories = new Set<string>(
      categories.map((item) => item.name),
    );
    const allowedConditions = new Set(["New", "Excellent", "Good"]);
    const pricePerDay = numberInRange(input.pricePerDay, 1, 20_000_000);
    const securityDeposit = numberInRange(
      input.securityDeposit,
      0,
      100_000_000,
    );
    const replacementValue = numberInRange(
      input.replacementValue,
      1,
      500_000_000,
    );
    const lateReturnFee = numberInRange(input.lateReturnFee, 0, 20_000_000);
    const maxRentalDays = numberInRange(input.maxRentalDays || 7, 1, 30);

    if (
      !title ||
      !description ||
      !location ||
      !knownDefects ||
      !accessories ||
      !usageLimits
    ) {
      return NextResponse.json(
        {
          error:
            "Listing title, description, pickup location, and condition contract are required",
        },
        { status: 400 },
      );
    }

    if (!allowedCategories.has(category) || !allowedConditions.has(condition)) {
      return NextResponse.json(
        { error: "Choose a supported category and condition" },
        { status: 400 },
      );
    }

    if (
      pricePerDay === null ||
      securityDeposit === null ||
      replacementValue === null ||
      lateReturnFee === null ||
      maxRentalDays === null
    ) {
      return NextResponse.json(
        { error: "Listing pricing and rental limits must be valid numbers" },
        { status: 400 },
      );
    }

    if (!images.length) {
      return NextResponse.json(
        { error: "Add at least one item photo" },
        { status: 400 },
      );
    }

    const categoryId = await ensureCategoryId(category);
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
        title,
        description,
        pricePerDay,
        securityDeposit,
        location,
        vendor?.area || "Lagos",
        condition,
        images,
        knownDefects,
        accessories,
        usageLimits,
        replacementValue,
        lateReturnFee,
        maxRentalDays,
        images.length,
      ],
    );

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
    );

    return NextResponse.json({ listing: mapListing(rows[0]) }, { status: 201 });
  } catch (error) {
    console.error("Listing creation failed:", error);
    return NextResponse.json(
      { error: "Failed to create listing" },
      { status: 500 },
    );
  }
}
