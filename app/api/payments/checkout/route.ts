import { type NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { initializeFlutterwavePayment } from "@/lib/flutterwave";

export async function POST(request: NextRequest) {
  const authUser = await getCurrentUser();

  if (!authUser) {
    return NextResponse.json(
      { error: "Sign in before paying for a booking" },
      { status: 401 },
    );
  }

  if (!process.env.FLUTTERWAVE_SECRET_KEY) {
    return NextResponse.json(
      { error: "Payment provider is not configured" },
      { status: 503 },
    );
  }

  try {
    const { bookingId } = await request.json();

    if (!bookingId) {
      return NextResponse.json(
        { error: "Booking reference is required" },
        { status: 400 },
      );
    }

    const rows = await sql(
      `SELECT
        b.id,
        b.renter_id,
        b.status,
        b.total_price,
        b.total_paid,
        l.title AS listing_title,
        u.email,
        u.first_name,
        u.last_name,
        u.phone_number
       FROM bookings b
       JOIN listings l ON l.id = b.listing_id
       JOIN users u ON u.id = b.renter_id
       WHERE b.id = $1`,
      [bookingId],
    );

    const booking = rows[0];

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.renter_id !== authUser.userId) {
      return NextResponse.json(
        { error: "Only the renter can pay for this booking" },
        { status: 403 },
      );
    }

    if (booking.status !== "pending") {
      return NextResponse.json(
        { error: "Only pending bookings can be paid" },
        { status: 409 },
      );
    }

    const amount = Number(booking.total_price);

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Booking total is invalid" },
        { status: 400 },
      );
    }

    const txRef = `igorent_${booking.id}_${Date.now()}`;
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    const customerName =
      [booking.first_name, booking.last_name].filter(Boolean).join(" ") ||
      "i.Go-rent renter";
    const result = await initializeFlutterwavePayment({
      tx_ref: txRef,
      amount,
      currency: "NGN",
      payment_options: "card,mobilemoney,ussd",
      customer: {
        email: booking.email,
        phonenumber: booking.phone_number || "",
        name: customerName,
      },
      customizations: {
        title: "i.Go-rent Booking Payment",
        description: `Secure payment for ${booking.listing_title}`,
        logo: `${appUrl}/favicon.ico`,
      },
      redirect_url: `${appUrl}/payments/callback?bookingId=${booking.id}`,
    });

    if (!result.success || !result.link) {
      return NextResponse.json(
        { error: result.error || "Payment initialization failed" },
        { status: 502 },
      );
    }

    await sql(
      `INSERT INTO payments (
        booking_id, user_id, amount, currency, payment_method, status,
        flutterwave_reference
      )
      VALUES ($1, $2, $3, 'NGN', 'flutterwave', 'initiated', $4)
      ON CONFLICT (flutterwave_reference) DO UPDATE SET
        status = 'initiated',
        updated_at = NOW()`,
      [booking.id, authUser.userId, amount, txRef],
    );

    return NextResponse.json({
      paymentLink: result.link,
      txRef,
      status: "initiated",
    });
  } catch (error) {
    console.error("Payment checkout failed:", error);
    return NextResponse.json(
      { error: "Payment checkout failed" },
      { status: 500 },
    );
  }
}
