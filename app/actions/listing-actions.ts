"use server"

import { sql } from "@/lib/db"

export interface Listing {
  id: string
  hostId: string
  categoryId: string
  title: string
  description: string
  pricePerDay: number
  securityDeposit: number
  location: string
  city: string
  state: string
  condition: string
  available: boolean
  totalQuantity: number
  availableQuantity: number
  imageUrls: string[]
  rating: number
  totalReviews: number
  createdAt: string
}

// Create new listing
export async function createListing(
  hostId: string,
  data: {
    categoryId: string
    title: string
    description: string
    pricePerDay: number
    securityDeposit: number
    location: string
    city: string
    state: string
    condition: "new" | "excellent" | "good" | "fair"
    totalQuantity: number
    imageUrls: string[]
  },
) {
  try {
    const result = await sql(
      `INSERT INTO listings (host_id, category_id, title, description, price_per_day, security_deposit_amount, location, city, state, condition, total_quantity, available_quantity, image_urls, available)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING id, host_id, category_id, title, description, price_per_day, security_deposit_amount, location, city, state, condition, total_quantity, available_quantity, image_urls, rating, total_reviews, created_at`,
      [
        hostId,
        data.categoryId,
        data.title,
        data.description,
        data.pricePerDay,
        data.securityDeposit,
        data.location,
        data.city,
        data.state,
        data.condition,
        data.totalQuantity,
        data.totalQuantity,
        data.imageUrls,
        true,
      ],
    )

    return { success: true, listing: result[0] }
  } catch (error) {
    console.error("Error creating listing:", error)
    return { success: false, error: "Failed to create listing" }
  }
}

// Get listing by ID
export async function getListing(listingId: string) {
  try {
    const result = await sql(
      `SELECT l.*, u.first_name, u.last_name, u.rating as host_rating, c.name as category_name
       FROM listings l
       JOIN users u ON l.host_id = u.id
       JOIN categories c ON l.category_id = c.id
       WHERE l.id = $1`,
      [listingId],
    )

    if (result.length === 0) {
      return { success: false, error: "Listing not found" }
    }

    return { success: true, listing: result[0] }
  } catch (error) {
    console.error("Error fetching listing:", error)
    return { success: false, error: "Failed to fetch listing" }
  }
}

// Search listings with filters
export async function searchListings(filters: {
  query?: string
  city?: string
  state?: string
  minPrice?: number
  maxPrice?: number
  category?: string
  condition?: string
  page?: number
  limit?: number
}) {
  try {
    let queryStr = `
      SELECT l.*, u.first_name, u.last_name, u.rating as host_rating, c.name as category_name
      FROM listings l
      JOIN users u ON l.host_id = u.id
      JOIN categories c ON l.category_id = c.id
      WHERE l.available = true
    `
    const params: any[] = []
    let paramCount = 1

    // Search by title or description
    if (filters.query) {
      queryStr += ` AND (l.title ILIKE $${paramCount} OR l.description ILIKE $${paramCount})`
      params.push(`%${filters.query}%`)
      paramCount++
    }

    // Filter by city
    if (filters.city) {
      queryStr += ` AND LOWER(l.city) = LOWER($${paramCount})`
      params.push(filters.city)
      paramCount++
    }

    // Filter by state
    if (filters.state) {
      queryStr += ` AND LOWER(l.state) = LOWER($${paramCount})`
      params.push(filters.state)
      paramCount++
    }

    // Price range
    if (filters.minPrice !== undefined) {
      queryStr += ` AND l.price_per_day >= $${paramCount}`
      params.push(filters.minPrice)
      paramCount++
    }

    if (filters.maxPrice !== undefined) {
      queryStr += ` AND l.price_per_day <= $${paramCount}`
      params.push(filters.maxPrice)
      paramCount++
    }

    // Category filter
    if (filters.category) {
      queryStr += ` AND LOWER(c.name) = LOWER($${paramCount})`
      params.push(filters.category)
      paramCount++
    }

    // Condition filter
    if (filters.condition) {
      queryStr += ` AND l.condition = $${paramCount}`
      params.push(filters.condition)
      paramCount++
    }

    // Sorting and pagination
    queryStr += ` ORDER BY l.created_at DESC`

    const page = filters.page || 1
    const limit = filters.limit || 12
    const offset = (page - 1) * limit

    queryStr += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`
    params.push(limit, offset)

    const results = await sql(queryStr, params)

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM listings l WHERE l.available = true`
    const countParams: any[] = []
    let countParamCount = 1

    if (filters.query) {
      countQuery += ` AND (l.title ILIKE $${countParamCount} OR l.description ILIKE $${countParamCount})`
      countParams.push(`%${filters.query}%`)
      countParamCount++
    }
    if (filters.city) {
      countQuery += ` AND LOWER(l.city) = LOWER($${countParamCount})`
      countParams.push(filters.city)
      countParamCount++
    }
    if (filters.state) {
      countQuery += ` AND LOWER(l.state) = LOWER($${countParamCount})`
      countParams.push(filters.state)
      countParamCount++
    }

    const countResult = await sql(countQuery, countParams)
    const total = countResult[0].total

    return {
      success: true,
      listings: results,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  } catch (error) {
    console.error("Error searching listings:", error)
    return { success: false, error: "Search failed" }
  }
}

// Get host's listings
export async function getHostListings(hostId: string) {
  try {
    const result = await sql(`SELECT * FROM listings WHERE host_id = $1 ORDER BY created_at DESC`, [hostId])

    return { success: true, listings: result }
  } catch (error) {
    console.error("Error fetching host listings:", error)
    return { success: false, error: "Failed to fetch listings" }
  }
}

// Update listing
export async function updateListing(listingId: string, hostId: string, data: Partial<Listing>) {
  try {
    // Verify ownership
    const ownership = await sql("SELECT host_id FROM listings WHERE id = $1", [listingId])

    if (ownership.length === 0 || ownership[0].host_id !== hostId) {
      return { success: false, error: "Unauthorized" }
    }

    const updates: string[] = []
    const values: any[] = []
    let paramCount = 1

    if (data.title) {
      updates.push(`title = $${paramCount}`)
      values.push(data.title)
      paramCount++
    }
    if (data.description) {
      updates.push(`description = $${paramCount}`)
      values.push(data.description)
      paramCount++
    }
    if (data.pricePerDay) {
      updates.push(`price_per_day = $${paramCount}`)
      values.push(data.pricePerDay)
      paramCount++
    }
    if (data.securityDeposit) {
      updates.push(`security_deposit_amount = $${paramCount}`)
      values.push(data.securityDeposit)
      paramCount++
    }
    if (data.available !== undefined) {
      updates.push(`available = $${paramCount}`)
      values.push(data.available)
      paramCount++
    }
    if (data.availableQuantity) {
      updates.push(`available_quantity = $${paramCount}`)
      values.push(data.availableQuantity)
      paramCount++
    }

    if (updates.length === 0) {
      return { success: false, error: "No updates provided" }
    }

    updates.push(`updated_at = NOW()`)
    values.push(listingId)

    const result = await sql(`UPDATE listings SET ${updates.join(", ")} WHERE id = $${paramCount} RETURNING *`, values)

    return { success: true, listing: result[0] }
  } catch (error) {
    console.error("Error updating listing:", error)
    return { success: false, error: "Failed to update listing" }
  }
}

// Delete listing
export async function deleteListing(listingId: string, hostId: string) {
  try {
    const ownership = await sql("SELECT host_id FROM listings WHERE id = $1", [listingId])

    if (ownership.length === 0 || ownership[0].host_id !== hostId) {
      return { success: false, error: "Unauthorized" }
    }

    await sql("DELETE FROM listings WHERE id = $1", [listingId])

    return { success: true, message: "Listing deleted" }
  } catch (error) {
    console.error("Error deleting listing:", error)
    return { success: false, error: "Failed to delete listing" }
  }
}

// Get categories
export async function getCategories() {
  try {
    const result = await sql("SELECT * FROM categories ORDER BY name ASC")
    return { success: true, categories: result }
  } catch (error) {
    console.error("Error fetching categories:", error)
    return { success: false, error: "Failed to fetch categories" }
  }
}

// Create category (admin only)
export async function createCategory(name: string, description?: string) {
  try {
    const result = await sql(`INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *`, [
      name,
      description,
    ])

    return { success: true, category: result[0] }
  } catch (error) {
    console.error("Error creating category:", error)
    return { success: false, error: "Failed to create category" }
  }
}
