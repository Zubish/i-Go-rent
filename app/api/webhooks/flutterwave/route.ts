import { sql } from "@/lib/db";
import { type NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";

function isExpectedHash(actual: string, expected: string) {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

function getBookingId(txRef: unknown) {
  const parts = String(txRef || "").split("_");
  return parts[0] === "igorent" && parts[1] ? parts[1] : "";
}

async function ensureHeldEscrow(bookingId: string) {
  const rows = await sql(
    `WITH booking AS (
       SELECT id, renter_id, host_id, total_price
       FROM bookings
       WHERE id = $1
     ),
     existing AS (
       SELECT *
       FROM escrow_transactions
       WHERE booking_id = $1
       LIMIT 1
     ),
     inserted AS (
       INSERT INTO escrow_transactions (booking_id, renter_id, host_id, amount, currency, status)
       SELECT id, renter_id, host_id, total_price, 'NGN', 'held'
       FROM booking
       WHERE NOT EXISTS (SELECT 1 FROM existing)
       RETURNING *
     )
     SELECT * FROM inserted
     UNION ALL
     SELECT * FROM existing
     LIMIT 1`,
    [bookingId],
  );

  if (!rows[0]) throw new Error("Booking not found");

  await sql(
    `UPDATE escrow_transactions
     SET status = 'held', updated_at = NOW()
     WHERE id = $1`,
    [rows[0].id],
  );

  return rows[0];
}

export async function POST(request: NextRequest) {
  try {
    const secretHash = process.env.FLUTTERWAVE_SECRET_HASH;

    if (!secretHash) {
      return NextResponse.json(
        { success: false, error: "Webhook secret is not configured" },
        { status: 500 },
      );
    }

    const signature =
      request.headers.get("verif-hash") ||
      request.headers.get("verificationhash") ||
      "";

    if (!signature || !isExpectedHash(signature, secretHash)) {
      return NextResponse.json(
        { success: false, error: "Invalid signature" },
        { status: 401 },
      );
    }

    const rawBody = await request.text();
    const payload = JSON.parse(rawBody);
    const { event, data } = payload;

    if (event === "charge.completed") {
      const bookingId = getBookingId(data?.tx_ref);

      if (!bookingId) {
        return NextResponse.json(
          { success: false, error: "Invalid transaction reference" },
          { status: 400 },
        );
      }

      const escrow = await ensureHeldEscrow(bookingId);

      await sql(
        `INSERT INTO payments (
           booking_id, escrow_transaction_id, user_id, amount, currency,
           payment_method, status, flutterwave_transaction_id, flutterwave_reference
         )
         SELECT $1, $2, renter_id, total_price, 'NGN', 'flutterwave', 'completed', $3, $4
         FROM bookings
         WHERE id = $1
         ON CONFLICT (flutterwave_reference) DO UPDATE
         SET status = 'completed',
             flutterwave_transaction_id = EXCLUDED.flutterwave_transaction_id,
             updated_at = NOW()`,
        [bookingId, escrow.id, data?.id, data?.flw_ref || String(data?.id)],
      );

      await sql(
        `UPDATE bookings SET status = 'confirmed', updated_at = NOW() WHERE id = $1`,
        [bookingId],
      );
    }

    if (event === "charge.failed") {
      const bookingId = getBookingId(data?.tx_ref);

      await sql(
        `UPDATE payments 
         SET status = 'failed', failure_reason = $1, updated_at = NOW()
         WHERE booking_id = $2`,
        [data?.processor_response || "Payment failed", bookingId],
      );

      await sql(
        `UPDATE bookings SET status = 'cancelled', cancellation_reason = 'Payment failed', updated_at = NOW() WHERE id = $1`,
        [bookingId],
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { success: false, error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}
