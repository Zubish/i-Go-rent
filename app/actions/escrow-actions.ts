"use server"

import { sql } from "@/lib/db"
import { refundFlutterwavePayment } from "@/lib/flutterwave"

// Release escrow funds to host (after rental completed successfully)
export async function releaseEscrowToHost(escrowId: string, bookingId: string) {
  try {
    // Verify booking is completed
    const booking = await sql(`SELECT status FROM bookings WHERE id = $1`, [bookingId])

    if (booking.length === 0 || booking[0].status !== "completed") {
      return { success: false, error: "Booking must be completed before releasing funds" }
    }

    // Update escrow status
    await sql(
      `UPDATE escrow_transactions 
       SET status = 'released_to_host', release_reason = 'Rental completed successfully', released_at = NOW(), updated_at = NOW()
       WHERE id = $1`,
      [escrowId],
    )

    // In production, transfer funds to host's bank account
    // This would use Flutterwave's payout/transfer API

    return { success: true, message: "Funds released to host" }
  } catch (error) {
    console.error("Error releasing escrow:", error)
    return { success: false, error: "Failed to release funds" }
  }
}

// Refund escrow to renter (if cancellation, damage claim rejected, etc.)
export async function refundEscrowToRenter(escrowId: string, bookingId: string, reason: string) {
  try {
    // Get payment details
    const payment = await sql(
      `SELECT p.flutterwave_transaction_id, p.amount 
       FROM payments p 
       WHERE p.booking_id = $1`,
      [bookingId],
    )

    if (payment.length === 0) {
      return { success: false, error: "Payment not found" }
    }

    // Refund via Flutterwave if transaction exists
    if (payment[0].flutterwave_transaction_id) {
      const refund = await refundFlutterwavePayment(payment[0].flutterwave_transaction_id.toString())

      if (!refund.success) {
        return { success: false, error: "Refund processing failed" }
      }
    }

    // Update escrow status
    await sql(
      `UPDATE escrow_transactions 
       SET status = 'refunded_to_renter', release_reason = $1, released_at = NOW(), updated_at = NOW()
       WHERE id = $2`,
      [reason, escrowId],
    )

    return { success: true, message: "Refund processed" }
  } catch (error) {
    console.error("Error refunding escrow:", error)
    return { success: false, error: "Refund failed" }
  }
}

// Handle dispute resolution
export async function resolveDispute(
  escrowId: string,
  bookingId: string,
  resolution: "full_host" | "full_renter" | "split_50_50",
  customAmount?: { host: number; renter: number },
) {
  try {
    let hostAmount = 0
    let renterAmount = 0
    const payment = await sql(`SELECT amount FROM escrow_transactions WHERE id = $1`, [escrowId])

    if (payment.length === 0) {
      return { success: false, error: "Escrow not found" }
    }

    const totalAmount = payment[0].amount

    switch (resolution) {
      case "full_host":
        hostAmount = totalAmount
        renterAmount = 0
        break
      case "full_renter":
        hostAmount = 0
        renterAmount = totalAmount
        break
      case "split_50_50":
        hostAmount = totalAmount / 2
        renterAmount = totalAmount / 2
        break
      default:
        if (customAmount) {
          hostAmount = customAmount.host
          renterAmount = customAmount.renter
        }
    }

    // Update escrow with resolution
    await sql(
      `UPDATE escrow_transactions 
       SET status = 'disputed',
           dispute_resolution = $1,
           ${customAmount ? `dispute_custom_host_amount = $2, dispute_custom_renter_amount = $3,` : ""}
           updated_at = NOW()
       WHERE id = $4`,
      customAmount ? [resolution, customAmount.host, customAmount.renter, escrowId] : [resolution, escrowId],
    )

    // Mark dispute as resolved
    await sql(`UPDATE disputes SET status = 'resolved', resolved_at = NOW() WHERE escrow_transaction_id = $1`, [
      escrowId,
    ])

    return { success: true, message: "Dispute resolved", hostAmount, renterAmount }
  } catch (error) {
    console.error("Error resolving dispute:", error)
    return { success: false, error: "Dispute resolution failed" }
  }
}
