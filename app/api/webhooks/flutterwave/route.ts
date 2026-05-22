import { sql } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()

    // Verify webhook signature
    const hash = crypto
      .createHmac("sha256", process.env.FLUTTERWAVE_SECRET_HASH || "")
      .update(JSON.stringify(payload))
      .digest("base64")

    const signature = request.headers.get("verificationhash")

    if (hash !== signature) {
      return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 401 })
    }

    const { event, data } = payload

    if (event === "charge.completed") {
      // Payment successful
      const bookingId = data.tx_ref.split("_")[1]

      // Update payment status
      await sql(
        `UPDATE payments 
         SET status = 'completed', flutterwave_transaction_id = $1, flutterwave_reference = $2, updated_at = NOW()
         WHERE booking_id = $3`,
        [data.id, data.flw_ref, bookingId],
      )

      // Confirm booking
      await sql(`UPDATE bookings SET status = 'confirmed', updated_at = NOW() WHERE id = $1`, [bookingId])

      // Update escrow status to held (funds secured)
      await sql(`UPDATE escrow_transactions SET status = 'held', updated_at = NOW() WHERE booking_id = $1`, [bookingId])
    }

    if (event === "charge.failed") {
      // Payment failed
      const bookingId = data.tx_ref.split("_")[1]

      await sql(
        `UPDATE payments 
         SET status = 'failed', failure_reason = $1, updated_at = NOW()
         WHERE booking_id = $2`,
        [data.processor_response, bookingId],
      )

      // Cancel booking
      await sql(
        `UPDATE bookings SET status = 'cancelled', cancellation_reason = 'Payment failed', updated_at = NOW() WHERE id = $1`,
        [bookingId],
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ success: false, error: "Webhook processing failed" }, { status: 500 })
  }
}
