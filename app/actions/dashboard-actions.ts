"use server"

import { sql } from "@/lib/db"

// Get renter dashboard data
export async function getRenterDashboardData(userId: string) {
  try {
    // Active bookings
    const activeBookings = await sql(
      `SELECT b.*, l.title, l.image_urls, u.first_name, u.last_name
       FROM bookings b
       JOIN listings l ON b.listing_id = l.id
       JOIN users u ON b.host_id = u.id
       WHERE b.renter_id = $1 AND b.status IN ('confirmed', 'active')
       ORDER BY b.start_date ASC
       LIMIT 5`,
      [userId],
    )

    // Past bookings
    const pastBookings = await sql(
      `SELECT b.*, l.title, u.first_name, u.last_name
       FROM bookings b
       JOIN listings l ON b.listing_id = l.id
       JOIN users u ON b.host_id = u.id
       WHERE b.renter_id = $1 AND b.status = 'completed'
       ORDER BY b.end_date DESC
       LIMIT 5`,
      [userId],
    )

    // Total spent
    const totalSpent = await sql(
      `SELECT SUM(total_price) as total FROM bookings WHERE renter_id = $1 AND status = 'completed'`,
      [userId],
    )

    // Saved listings
    const savedListings = await sql(
      `SELECT l.*, u.first_name, u.last_name, u.rating
       FROM listings l
       JOIN users u ON l.host_id = u.id
       LIMIT 10`,
      [userId],
    )

    // User profile
    const profile = await sql(`SELECT * FROM users WHERE id = $1`, [userId])

    return {
      success: true,
      profile: profile[0],
      activeBookings,
      pastBookings,
      totalSpent: totalSpent[0]?.total || 0,
      savedListings,
    }
  } catch (error) {
    console.error("Error fetching renter dashboard:", error)
    return { success: false, error: "Failed to fetch dashboard data" }
  }
}

// Get host dashboard data
export async function getHostDashboardData(userId: string) {
  try {
    // Active bookings
    const activeBookings = await sql(
      `SELECT b.*, l.title, l.image_urls, u.first_name, u.last_name, u.rating
       FROM bookings b
       JOIN listings l ON b.listing_id = l.id
       JOIN users u ON b.renter_id = u.id
       WHERE b.host_id = $1 AND b.status IN ('confirmed', 'active')
       ORDER BY b.start_date ASC`,
      [userId],
    )

    // Host listings
    const listings = await sql(
      `SELECT l.*, 
              COUNT(DISTINCT b.id) as total_bookings,
              COUNT(DISTINCT CASE WHEN b.status = 'completed' THEN b.id END) as completed_bookings
       FROM listings l
       LEFT JOIN bookings b ON l.id = b.listing_id
       WHERE l.host_id = $1
       GROUP BY l.id
       ORDER BY l.created_at DESC`,
      [userId],
    )

    // Monthly earnings
    const monthlyEarnings = await sql(
      `SELECT 
              DATE_TRUNC('month', b.end_date) as month,
              SUM(b.total_price) as earnings
       FROM bookings b
       JOIN listings l ON b.listing_id = l.id
       WHERE l.host_id = $1 AND b.status = 'completed'
       GROUP BY DATE_TRUNC('month', b.end_date)
       ORDER BY month DESC
       LIMIT 12`,
      [userId],
    )

    // Total earnings
    const totalEarnings = await sql(
      `SELECT SUM(b.total_price) as total
       FROM bookings b
       JOIN listings l ON b.listing_id = l.id
       WHERE l.host_id = $1 AND b.status = 'completed'`,
      [userId],
    )

    // Pending payouts
    const pendingPayouts = await sql(
      `SELECT SUM(e.amount) as total
       FROM escrow_transactions e
       JOIN bookings b ON e.booking_id = b.id
       JOIN listings l ON b.listing_id = l.id
       WHERE l.host_id = $1 AND e.status = 'held'`,
      [userId],
    )

    // Host tier status
    const tierStatus = await sql(`SELECT * FROM host_tiers WHERE user_id = $1`, [userId])

    // User profile
    const profile = await sql(`SELECT * FROM users WHERE id = $1`, [userId])

    return {
      success: true,
      profile: profile[0],
      activeBookings,
      listings,
      monthlyEarnings,
      totalEarnings: totalEarnings[0]?.total || 0,
      pendingPayouts: pendingPayouts[0]?.total || 0,
      tierStatus: tierStatus[0],
    }
  } catch (error) {
    console.error("Error fetching host dashboard:", error)
    return { success: false, error: "Failed to fetch dashboard data" }
  }
}

// Update user profile
export async function updateUserProfile(userId: string, data: Partial<any>) {
  try {
    const updates: string[] = []
    const values: any[] = []
    let paramCount = 1

    if (data.firstName) {
      updates.push(`first_name = $${paramCount}`)
      values.push(data.firstName)
      paramCount++
    }
    if (data.lastName) {
      updates.push(`last_name = $${paramCount}`)
      values.push(data.lastName)
      paramCount++
    }
    if (data.phoneNumber) {
      updates.push(`phone_number = $${paramCount}`)
      values.push(data.phoneNumber)
      paramCount++
    }
    if (data.bio) {
      updates.push(`bio = $${paramCount}`)
      values.push(data.bio)
      paramCount++
    }
    if (data.location) {
      updates.push(`location = $${paramCount}`)
      values.push(data.location)
      paramCount++
    }

    if (updates.length === 0) {
      return { success: false, error: "No updates provided" }
    }

    updates.push(`updated_at = NOW()`)
    values.push(userId)

    const result = await sql(`UPDATE users SET ${updates.join(", ")} WHERE id = $${paramCount} RETURNING *`, values)

    return { success: true, user: result[0] }
  } catch (error) {
    console.error("Error updating profile:", error)
    return { success: false, error: "Failed to update profile" }
  }
}
