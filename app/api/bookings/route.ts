import { type NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { getKycStatus } from "@/lib/demo-marketplace";
import { sql } from "@/lib/db";
import {
  buildDispatchSnapshot,
  conditionSnapshotForListing,
  getDbListingForBooking,
  getUserForPolicy,
  listBookingsForUser,
  mapBooking,
  pickLogisticsProvider,
  totalsForListing,
} from "@/lib/marketplace-data";

export async function GET(request: NextRequest) {
  const authUser = await getCurrentUser();

  if (!authUser) {
    return NextResponse.json({ bookings: [] });
  }

  try {
    const role = request.nextUrl.searchParams.get("role") || authUser.userType;
    const bookings = await listBookingsForUser(authUser.userId, role);
    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("Booking fetch failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const authUser = await getCurrentUser();

  if (!authUser) {
    return NextResponse.json(
      { error: "Sign in before booking a rental" },
      { status: 401 },
    );
  }

  try {
    const renter = await getUserForPolicy(authUser.userId);
    const renterKyc = getKycStatus(renter, "renter");

    if (!renterKyc.canBook) {
      return NextResponse.json(
        { error: `Renter KYC incomplete: ${renterKyc.missing.join(", ")}` },
        { status: 403 },
      );
    }

    const input = await request.json();

    if (!input.legalUseAccepted || !input.conditionAcknowledged) {
      return NextResponse.json(
        { error: "Required legal and condition confirmations are missing" },
        { status: 400 },
      );
    }

    const dbListing = await getDbListingForBooking(input.listingId);

    if (!dbListing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (!dbListing.listing.vendorVerified) {
      return NextResponse.json(
        { error: "Vendor KYC must be complete before checkout" },
        { status: 403 },
      );
    }

    const totals = totalsForListing(
      dbListing.listing,
      input.startDate,
      input.endDate,
      input.deliveryType,
    );

    if (totals.days <= 0) {
      return NextResponse.json(
        { error: "Choose a valid rental date range" },
        { status: 400 },
      );
    }

    if (totals.days > dbListing.listing.maxRentalDays) {
      return NextResponse.json(
        {
          error: "Selected duration exceeds this listing's maximum rental days",
        },
        { status: 400 },
      );
    }

    const conditionSnapshot = conditionSnapshotForListing(dbListing.listing);
    const deliveryType =
      input.deliveryType === "igo-logistics" ? "igo_logistics" : "self_pickup";
    const bookingRows = await sql(
      `INSERT INTO bookings (
        renter_id, listing_id, host_id, start_date, end_date, number_of_days,
        price_per_day, rental_fee, security_deposit_amount, delivery_type,
        delivery_fee, total_price, total_paid, status, renter_phone,
        legal_use_accepted, condition_acknowledged, condition_snapshot
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 0, 'pending', $13, TRUE, TRUE, $14)
      RETURNING *`,
      [
        authUser.userId,
        dbListing.row.id,
        dbListing.row.host_id,
        input.startDate,
        input.endDate,
        totals.days,
        dbListing.listing.pricePerDay,
        totals.rentalFee,
        totals.securityDeposit,
        deliveryType,
        totals.deliveryFee,
        totals.totalPaid,
        input.renterPhone || renter?.phone || "",
        JSON.stringify(conditionSnapshot),
      ],
    );

    if (deliveryType === "igo_logistics") {
      const provider = await pickLogisticsProvider(dbListing.listing);

      if (provider) {
        const snapshot = buildDispatchSnapshot({
          provider,
          listing: dbListing.listing,
          renterName:
            input.renterName ||
            `${renter?.firstName || ""} ${renter?.lastName || ""}`.trim(),
          renterPhone: input.renterPhone || renter?.phone || "",
          startDate: input.startDate,
        });

        await sql(
          `INSERT INTO dispatch_assignments (
            booking_id, listing_id, vendor_id, renter_id, logistics_provider_id,
            provider_contact_snapshot, pickup_area, delivery_area, pickup_window,
            delivery_window, dispatch_fee, dispatch_status, handover_code
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'assigned', $12)`,
          [
            bookingRows[0].id,
            dbListing.row.id,
            dbListing.row.host_id,
            authUser.userId,
            provider.id,
            JSON.stringify(snapshot),
            snapshot.pickupArea,
            snapshot.deliveryArea,
            snapshot.pickupWindow,
            snapshot.deliveryWindow,
            totals.deliveryFee,
            snapshot.handoverCode,
          ],
        );
      }
    }

    const rows = await sql(
      `SELECT
        b.*,
        l.title AS listing_title,
        l.condition,
        l.known_defects,
        l.accessories,
        l.usage_limits,
        l.replacement_value,
        l.late_return_fee,
        l.max_rental_days,
        l.image_urls,
        renter.first_name || ' ' || renter.last_name AS renter_name,
        vendor.first_name || ' ' || vendor.last_name AS vendor_name,
        COALESCE(vp.can_publish, vendor.is_verified) AS vendor_verified,
        e.status AS escrow_status,
        d.id AS dispatch_id,
        d.logistics_provider_id,
        d.provider_contact_snapshot,
        d.pickup_area,
        d.delivery_area,
        d.pickup_window,
        d.delivery_window,
        d.dispatch_fee,
        d.dispatch_status,
        d.handover_code,
        d.created_at AS dispatch_created_at
      FROM bookings b
      JOIN listings l ON l.id = b.listing_id
      JOIN users renter ON renter.id = b.renter_id
      JOIN users vendor ON vendor.id = b.host_id
      LEFT JOIN vendor_profiles vp ON vp.user_id = b.host_id
      LEFT JOIN escrow_transactions e ON e.booking_id = b.id
      LEFT JOIN dispatch_assignments d ON d.booking_id = b.id
      WHERE b.id = $1`,
      [bookingRows[0].id],
    );

    return NextResponse.json({ booking: mapBooking(rows[0]) }, { status: 201 });
  } catch (error) {
    console.error("Booking creation failed:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 },
    );
  }
}
