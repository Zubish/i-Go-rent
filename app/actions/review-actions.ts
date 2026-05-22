"use server"

import { sql } from "@/lib/db"

// Submit review
export async function submitReview(data: {
  bookingId: string
  reviewerId: string
  reviewedUserId: string
  listingId: string
  rating: number
  title: string
  comment: string
  reviewType: "renter" | "host"
}) {
  try {
    const result = await sql(
      `INSERT INTO reviews (booking_id, listing_id, reviewer_id, reviewed_user_id, rating, title, comment, review_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        data.bookingId,
        data.listingId,
        data.reviewerId,
        data.reviewedUserId,
        data.rating,
        data.title,
        data.comment,
        data.reviewType,
      ],
    )

    // Update user rating
    await sql(
      `UPDATE users 
       SET rating = (SELECT AVG(rating) FROM reviews WHERE reviewed_user_id = $1),
           total_reviews = (SELECT COUNT(*) FROM reviews WHERE reviewed_user_id = $1),
           updated_at = NOW()
       WHERE id = $1`,
      [data.reviewedUserId],
    )

    // Update listing rating
    await sql(
      `UPDATE listings 
       SET rating = (SELECT AVG(rating) FROM reviews WHERE listing_id = $1),
           total_reviews = (SELECT COUNT(*) FROM reviews WHERE listing_id = $1),
           updated_at = NOW()
       WHERE id = $1`,
      [data.listingId],
    )

    return { success: true, review: result[0] }
  } catch (error) {
    console.error("Error submitting review:", error)
    return { success: false, error: "Failed to submit review" }
  }
}

// Get reviews for user
export async function getUserReviews(userId: string) {
  try {
    const result = await sql(
      `SELECT r.*, u.first_name, u.last_name, l.title as listing_title
       FROM reviews r
       JOIN users u ON r.reviewer_id = u.id
       LEFT JOIN listings l ON r.listing_id = l.id
       WHERE r.reviewed_user_id = $1
       ORDER BY r.created_at DESC`,
      [userId],
    )

    return { success: true, reviews: result }
  } catch (error) {
    console.error("Error fetching reviews:", error)
    return { success: false, error: "Failed to fetch reviews" }
  }
}

// Get reviews for listing
export async function getListingReviews(listingId: string) {
  try {
    const result = await sql(
      `SELECT r.*, u.first_name, u.last_name
       FROM reviews r
       JOIN users u ON r.reviewer_id = u.id
       WHERE r.listing_id = $1
       ORDER BY r.created_at DESC`,
      [listingId],
    )

    return { success: true, reviews: result }
  } catch (error) {
    console.error("Error fetching reviews:", error)
    return { success: false, error: "Failed to fetch reviews" }
  }
}

// Get reviews for user (alias for getUserReviews)
export async function getReviewsForUser(userId: string) {
  try {
    const result = await getUserReviews(userId)
    if (!result.success) {
      return { reviews: [], averageRating: 0, totalReviews: 0 }
    }

    const reviews = result.reviews || []
    const averageRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0

    return {
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.created_at,
        reviewer: {
          name: `${r.first_name} ${r.last_name}`,
          tier: r.host_tier,
        },
      })),
      averageRating,
      totalReviews: reviews.length,
    }
  } catch (error) {
    console.error("Error in getReviewsForUser:", error)
    return { reviews: [], averageRating: 0, totalReviews: 0 }
  }
}
