"use server"

import { sql } from "@/lib/db"
import { initializeFlutterwavePayment, verifyFlutterwavePayment } from "@/lib/flutterwave"

export interface BookingData {
  renterId: string
  listingId: string
  hostId: string
  startDate: string
  endDate: string
  numberOfDays: number
  totalPrice: number
}

// Create booking
export async function createBooking(data: BookingData) {
  try {
    const result = await sql(
      `INSERT INTO bookings (renter_id, listing_id, host_id, start_date, end_date, number_of_days, price_per_day, total_price, status)
       SELECT $1, $2, $3, $4, $5, $6, price_per_day, $7, 'pending'
       FROM listings WHERE id = $2
       RETURNING *`,
      [data.renterId, data.listingId, data.hostId, data.startDate, data.endDate, data.numberOfDays, data.totalPrice],
    )

    if (result.length === 0) {
      return { success: false, error: "Failed to create booking" }
    }

    const booking = result[0]

    // Create escrow transaction
    const escrowResult = await sql(
      `INSERT INTO escrow_transactions (booking_id, renter_id, host_id, amount, currency, status)
       VALUES ($1, $2, $3, $4, 'NGN', 'held')
       RETURNING *`,
      [booking.id, data.renterId, data.hostId, data.totalPrice],
    )

    return { success: true, booking, escrow: escrowResult[0] }
  } catch (error) {
    console.error("Error creating booking:", error)
    return { success: false, error: "Failed to create booking" }
  }
}

// Initialize payment with Flutterwave
export async function initiatePayment(
  bookingId: string,
  userId: string,
  userEmail: string,
  userName: string,
  userPhone: string,
  amount: number,
) {
  try {
    const txRef = `igorent_${bookingId}_${Date.now()}`

    const result = await initializeFlutterwavePayment({
      tx_ref: txRef,
      amount,
      currency: "NGN",
      payment_options: "card,mobilemoney,ussd",
      customer: {
        email: userEmail,
        phonenumber: userPhone,
        name: userName,
      },
      customizations: {
        title: "i.Go-rent Booking Payment",
        description: "Secure escrow payment for rental booking",
        logo: "https://igorent.ng/logo.png",
      },
      redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/payments/callback?bookingId=${bookingId}`,
    })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    // Store payment record
    await sql(
      `INSERT INTO payments (booking_id, escrow_transaction_id, user_id, amount, currency, payment_method, status)
       SELECT $1, e.id, $2, $3, 'NGN', 'flutterwave', 'initiated'
       FROM escrow_transactions e WHERE e.booking_id = $1`,
      [bookingId, userId, amount],
    )

    return { success: true, paymentLink: result.link }
  } catch (error) {
    console.error("Error initiating payment:", error)
    return { success: false, error: "Payment initialization failed" }
  }
}

// Verify payment and confirm escrow
export async function verifyAndConfirmPayment(bookingId: string, transactionId: string) {
  try {
    // Verify with Flutterwave
    const verification = await verifyFlutterwavePayment(transactionId)

    if (!verification.success || verification.status !== "successful") {
      return { success: false, error: "Payment verification failed" }
    }

    // Update payment record
    await sql(`UPDATE payments SET status = 'completed' WHERE booking_id = $1`, [bookingId])

    // Confirm booking
    await sql(`UPDATE bookings SET status = 'confirmed' WHERE id = $1`, [bookingId])

    // Update escrow to 'held' (funds are now held safely)
    await sql(`UPDATE escrow_transactions SET status = 'held' WHERE booking_id = $1`, [bookingId])

    return { success: true, message: "Payment confirmed and escrow activated" }
  } catch (error) {
    console.error("Error verifying payment:", error)
    return { success: false, error: "Payment verification failed" }
  }
}

// Get booking details
export async function getBooking(bookingId: string) {
  try {
    const result = await sql(
      `SELECT b.*, l.title as listing_title, l.image_urls,
              u1.first_name as renter_first_name, u1.last_name as renter_last_name, u1.email as renter_email,
              u2.first_name as host_first_name, u2.last_name as host_last_name, u2.email as host_email
       FROM bookings b
       JOIN listings l ON b.listing_id = l.id
       JOIN users u1 ON b.renter_id = u1.id
       JOIN users u2 ON b.host_id = u2.id
       WHERE b.id = $1`,
      [bookingId],
    )

    if (result.length === 0) {
      return { success: false, error: "Booking not found" }
    }

    return { success: true, booking: result[0] }
  } catch (error) {
    console.error("Error fetching booking:", error)
    return { success: false, error: "Failed to fetch booking" }
  }
}

// Get escrow transaction details
export async function getEscrowTransaction(escrowId: string) {
  try {
    const result = await sql(`SELECT * FROM escrow_transactions WHERE id = $1`, [escrowId])

    if (result.length === 0) {
      return { success: false, error: "Escrow transaction not found" }
    }

    return { success: true, escrow: result[0] }
  } catch (error) {
    console.error("Error fetching escrow:", error)
    return { success: false, error: "Failed to fetch escrow" }
  }
}
