import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { getBookingRecord } from "@/lib/marketplace-data";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authUser = await getCurrentUser();

  if (!authUser) {
    return NextResponse.json(
      { error: "Sign in to view this booking" },
      { status: 401 },
    );
  }

  try {
    const { id } = await params;
    const booking = await getBookingRecord(id);

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    return NextResponse.json({ booking });
  } catch (error) {
    console.error("Booking lookup failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch booking" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authUser = await getCurrentUser();

  if (!authUser) {
    return NextResponse.json(
      { error: "Sign in to update this booking" },
      { status: 401 },
    );
  }

  try {
    const { id } = await params;
    await sql(
      `UPDATE bookings SET status = 'completed', updated_at = NOW() WHERE id = $1`,
      [id],
    );
    await sql(
      `UPDATE escrow_transactions
       SET status = 'deposit_refunded', release_reason = 'Returned and inspected', released_at = NOW(), updated_at = NOW()
       WHERE booking_id = $1`,
      [id],
    );

    const booking = await getBookingRecord(id);
    return NextResponse.json({ booking });
  } catch (error) {
    console.error("Booking update failed:", error);
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 },
    );
  }
}
