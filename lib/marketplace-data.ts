import { sql } from "@/lib/db"
import {
  calculateDays,
  logisticsFee,
  maxListingImages,
  type DeliveryType,
  type DemoBooking,
  type DemoConditionSnapshot,
  type DemoDispatch,
  type DemoListing,
  type DemoLogisticsProvider,
  type DemoUser,
} from "@/lib/demo-marketplace"

const fallbackImage = "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80"

function toNumber(value: unknown, fallback = 0) {
  const next = Number(value)
  return Number.isFinite(next) ? next : fallback
}

function normalizeCondition(value: unknown): DemoListing["condition"] {
  const condition = String(value || "Good").toLowerCase()
  if (condition === "new") return "New"
  if (condition === "excellent") return "Excellent"
  return "Good"
}

function normalizeCategory(value: unknown): DemoListing["category"] {
  if (value === "Transport") return "Transport"
  if (value === "Gear") return "Gear"
  return "Events"
}

function splitIncluded(value: unknown) {
  return String(value || "Vendor confirmed item, Pickup checklist, Escrow-backed deposit")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8)
}

function imageList(value: unknown) {
  const images = Array.isArray(value) ? value.filter(Boolean).map(String) : []
  return (images.length ? images : [fallbackImage]).slice(0, maxListingImages)
}

export function mapListing(row: any): DemoListing {
  const images = imageList(row.image_urls)
  const vendorName = row.business_name || [row.first_name, row.last_name].filter(Boolean).join(" ") || "i.Go-rent Vendor"
  const vendorArea = row.pickup_area || row.residential_area || row.city || "Lagos"

  return {
    id: String(row.id),
    vendorId: String(row.host_id),
    vendorName,
    vendorArea,
    vendorVerified: Boolean(row.can_publish ?? row.is_verified),
    category: normalizeCategory(row.category_name),
    title: String(row.title || "Rental item"),
    description: String(row.description || ""),
    pricePerDay: toNumber(row.price_per_day),
    securityDeposit: toNumber(row.security_deposit_amount),
    location: String(row.location || vendorArea),
    deliveryArea: String(row.delivery_area || vendorArea),
    condition: normalizeCondition(row.condition),
    knownDefects: String(row.known_defects || "No defects disclosed by vendor."),
    accessories: String(row.accessories || "Vendor confirmed item."),
    usageLimits: String(row.usage_limits || "Use only as agreed with vendor."),
    replacementValue: toNumber(row.replacement_value),
    lateReturnFee: toNumber(row.late_return_fee),
    maxRentalDays: toNumber(row.max_rental_days, 7),
    rating: toNumber(row.rating),
    reviews: toNumber(row.total_reviews),
    images,
    included: splitIncluded(row.accessories),
    available: Boolean(row.available),
  }
}

export function conditionSnapshotForListing(listing: DemoListing): DemoConditionSnapshot {
  return {
    condition: listing.condition,
    knownDefects: listing.knownDefects,
    accessories: listing.accessories,
    usageLimits: listing.usageLimits,
    replacementValue: listing.replacementValue,
    lateReturnFee: listing.lateReturnFee,
    maxRentalDays: listing.maxRentalDays,
    photoCount: listing.images.length,
    vendorVerified: listing.vendorVerified,
  }
}

export async function listMarketplaceListings(filters: { query?: string; category?: string; area?: string } = {}) {
  const params: any[] = []
  let paramIndex = 1
  let query = `
    SELECT
      l.*,
      c.name AS category_name,
      u.first_name,
      u.last_name,
      u.residential_area,
      u.is_verified,
      vp.business_name,
      vp.pickup_area,
      vp.can_publish,
      COALESCE(vp.pickup_area, u.residential_area, l.city) AS delivery_area
    FROM listings l
    JOIN categories c ON c.id = l.category_id
    JOIN users u ON u.id = l.host_id
    LEFT JOIN vendor_profiles vp ON vp.user_id = l.host_id
    WHERE l.available = TRUE
  `

  if (filters.query) {
    query += ` AND (l.title ILIKE $${paramIndex} OR l.description ILIKE $${paramIndex} OR COALESCE(vp.business_name, u.full_name, u.name) ILIKE $${paramIndex})`
    params.push(`%${filters.query}%`)
    paramIndex += 1
  }

  if (filters.category && filters.category !== "All") {
    query += ` AND c.name = $${paramIndex}`
    params.push(filters.category)
    paramIndex += 1
  }

  if (filters.area) {
    query += ` AND (l.location ILIKE $${paramIndex} OR l.city ILIKE $${paramIndex} OR COALESCE(vp.pickup_area, u.residential_area) ILIKE $${paramIndex})`
    params.push(`%${filters.area}%`)
    paramIndex += 1
  }

  query += " ORDER BY l.created_at DESC LIMIT 60"

  const rows = await sql(query, params)
  return rows.map(mapListing)
}

export async function getMarketplaceListing(listingId: string) {
  const rows = await sql(
    `SELECT
      l.*,
      c.name AS category_name,
      u.first_name,
      u.last_name,
      u.residential_area,
      u.is_verified,
      vp.business_name,
      vp.pickup_area,
      vp.can_publish,
      COALESCE(vp.pickup_area, u.residential_area, l.city) AS delivery_area
    FROM listings l
    JOIN categories c ON c.id = l.category_id
    JOIN users u ON u.id = l.host_id
    LEFT JOIN vendor_profiles vp ON vp.user_id = l.host_id
    WHERE l.id = $1`,
    [listingId],
  )

  return rows[0] ? mapListing(rows[0]) : null
}

export async function getDbListingForBooking(listingId: string) {
  const rows = await sql(
    `SELECT
      l.*,
      c.name AS category_name,
      u.first_name,
      u.last_name,
      u.residential_area,
      u.is_verified,
      u.phone_number AS vendor_phone,
      vp.business_name,
      vp.pickup_area,
      vp.can_publish,
      COALESCE(vp.pickup_area, u.residential_area, l.city) AS delivery_area
    FROM listings l
    JOIN categories c ON c.id = l.category_id
    JOIN users u ON u.id = l.host_id
    LEFT JOIN vendor_profiles vp ON vp.user_id = l.host_id
    WHERE l.id = $1 AND l.available = TRUE`,
    [listingId],
  )

  if (!rows[0]) return null

  return {
    row: rows[0],
    listing: mapListing(rows[0]),
  }
}

export async function getUserForPolicy(userId: string): Promise<DemoUser | null> {
  const rows = await sql(
    `SELECT
      u.id, u.email, u.user_type, u.first_name, u.last_name, u.phone_number, u.residential_area, u.city, u.is_verified,
      iv.nin, iv.bvn, iv.cac_number,
      vp.business_name,
      lpp.provider_name, lpp.license_number, lpp.vehicle_type, lpp.plate_number, lpp.coverage_areas
    FROM users u
    LEFT JOIN identity_verification iv ON iv.user_id = u.id
    LEFT JOIN vendor_profiles vp ON vp.user_id = u.id
    LEFT JOIN logistics_provider_profiles lpp ON lpp.user_id = u.id
    WHERE u.id = $1`,
    [userId],
  )

  const row = rows[0]
  if (!row) return null

  return {
    id: String(row.id),
    role: row.user_type === "vendor" || row.user_type === "logistics" ? row.user_type : "renter",
    firstName: String(row.first_name || ""),
    lastName: String(row.last_name || ""),
    email: String(row.email || ""),
    phone: String(row.phone_number || ""),
    area: String(row.residential_area || row.city || "Lagos"),
    nin: row.nin || "",
    bvn: row.bvn || "",
    cac: row.cac_number || "",
    businessName: row.business_name || row.provider_name || "",
    licenseNumber: row.license_number || "",
    vehicleType: row.vehicle_type || "",
    plateNumber: row.plate_number || "",
    coverageArea: Array.isArray(row.coverage_areas) ? row.coverage_areas.join(", ") : "",
    verified: Boolean(row.is_verified),
  }
}

export async function ensureCategoryId(categoryName: string) {
  const rows = await sql(
    `INSERT INTO categories (name, description)
     VALUES ($1, $2)
     ON CONFLICT (name) DO UPDATE SET description = COALESCE(categories.description, EXCLUDED.description)
     RETURNING id`,
    [categoryName, `${categoryName} rentals`],
  )

  return rows[0].id
}

export async function pickLogisticsProvider(listing: DemoListing) {
  const providers = await sql(
    `SELECT
      u.id,
      u.first_name,
      u.last_name,
      u.email,
      u.phone_number,
      lpp.provider_name,
      lpp.vehicle_type,
      lpp.plate_number,
      lpp.coverage_areas,
      lpp.rating,
      lpp.completed_dispatches
    FROM logistics_provider_profiles lpp
    JOIN users u ON u.id = lpp.user_id
    WHERE lpp.can_receive_dispatch = TRUE
    ORDER BY
      CASE WHEN EXISTS (
        SELECT 1 FROM unnest(lpp.coverage_areas) area
        WHERE LOWER($1) LIKE '%' || LOWER(area) || '%'
      ) THEN 0 ELSE 1 END,
      lpp.completed_dispatches DESC
    LIMIT 1`,
    [`${listing.vendorArea} ${listing.location} ${listing.deliveryArea}`],
  )

  const row = providers[0]
  if (!row) return null

  const provider: DemoLogisticsProvider = {
    id: String(row.id),
    providerName: String(row.provider_name || `${row.first_name} ${row.last_name}`),
    contactName: [row.first_name, row.last_name].filter(Boolean).join(" ") || String(row.provider_name || "i.Go Logistics"),
    phone: String(row.phone_number || ""),
    email: String(row.email || ""),
    vehicleType: String(row.vehicle_type || "Dispatch vehicle"),
    plateNumber: String(row.plate_number || "Pending"),
    coverageAreas: Array.isArray(row.coverage_areas) ? row.coverage_areas : [],
    verified: true,
    rating: toNumber(row.rating),
    completedDispatches: toNumber(row.completed_dispatches),
  }

  return provider
}

export function buildDispatchSnapshot(input: {
  provider: DemoLogisticsProvider
  listing: DemoListing
  renterName: string
  renterPhone: string
  startDate: string
}) {
  return {
    provider: input.provider,
    pickupArea: input.listing.vendorArea,
    deliveryArea: input.listing.deliveryArea,
    pickupWindow: `${input.startDate} - 9:00 AM - 12:00 PM`,
    deliveryWindow: `${input.startDate} - 12:00 PM - 4:00 PM`,
    handoverCode: `IG-${Math.floor(1000 + Math.random() * 9000)}`,
    instructions:
      "Provider details are shared with both parties after escrow funding. Vendor should only release the item after recording condition proof and confirming the handover code.",
    vendorContact: {
      name: input.listing.vendorName,
      phone: "0800 VENDOR",
    },
    renterContact: {
      name: input.renterName,
      phone: input.renterPhone,
    },
  }
}

function mapDispatch(row: any): DemoDispatch | null {
  if (!row.dispatch_id) return null

  const snapshot = row.provider_contact_snapshot || {}
  const provider = snapshot.provider || {
    id: row.logistics_provider_id || "pending",
    providerName: "i.Go-Logistics",
    contactName: "Dispatch desk",
    phone: "",
    email: "",
    vehicleType: "Pending",
    plateNumber: "Pending",
    coverageAreas: [],
    verified: true,
    rating: 0,
    completedDispatches: 0,
  }

  return {
    id: String(row.dispatch_id),
    provider,
    status: row.dispatch_status || "pending_assignment",
    dispatchReference: `DSP-${String(row.dispatch_id).slice(0, 8).toUpperCase()}`,
    pickupArea: row.pickup_area || snapshot.pickupArea || "",
    deliveryArea: row.delivery_area || snapshot.deliveryArea || "",
    pickupWindow: row.pickup_window || snapshot.pickupWindow || "",
    deliveryWindow: row.delivery_window || snapshot.deliveryWindow || "",
    dispatchFee: toNumber(row.dispatch_fee, logisticsFee),
    vendorContact: snapshot.vendorContact || { name: row.vendor_name || "", phone: "" },
    renterContact: snapshot.renterContact || { name: row.renter_name || "", phone: row.renter_phone || "" },
    handoverCode: row.handover_code || snapshot.handoverCode || "",
    instructions: snapshot.instructions || "",
    assignedAt: row.dispatch_created_at || row.created_at,
  }
}

export function mapBooking(row: any): DemoBooking {
  const deliveryType: DeliveryType = row.delivery_type === "igo_logistics" ? "igo-logistics" : "self-pickup"
  const conditionSnapshot = row.condition_snapshot as DemoConditionSnapshot | null

  return {
    id: String(row.id),
    listingId: String(row.listing_id),
    renterName: row.renter_name || "Renter",
    vendorName: row.vendor_name || "Vendor",
    title: row.listing_title || "Rental booking",
    startDate: String(row.start_date).slice(0, 10),
    endDate: String(row.end_date).slice(0, 10),
    days: toNumber(row.number_of_days),
    rentalFee: toNumber(row.rental_fee),
    securityDeposit: toNumber(row.security_deposit_amount),
    deliveryType,
    deliveryFee: toNumber(row.delivery_fee),
    totalPaid: toNumber(row.total_paid || row.total_price),
    escrowStatus: row.escrow_status || "held",
    dispatch: mapDispatch(row),
    legalUseAccepted: Boolean(row.legal_use_accepted),
    conditionAcknowledged: Boolean(row.condition_acknowledged),
    conditionSnapshot:
      conditionSnapshot || {
        condition: normalizeCondition(row.condition),
        knownDefects: row.known_defects || "",
        accessories: row.accessories || "",
        usageLimits: row.usage_limits || "",
        replacementValue: toNumber(row.replacement_value),
        lateReturnFee: toNumber(row.late_return_fee),
        maxRentalDays: toNumber(row.max_rental_days, 7),
        photoCount: Array.isArray(row.image_urls) ? row.image_urls.length : 0,
        vendorVerified: Boolean(row.vendor_verified),
      },
    createdAt: row.created_at,
  }
}

export async function getBookingRecord(bookingId: string) {
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
    [bookingId],
  )

  return rows[0] ? mapBooking(rows[0]) : null
}

export async function listBookingsForUser(userId: string, role: string) {
  const column = role === "vendor" ? "b.host_id" : role === "logistics" ? "d.logistics_provider_id" : "b.renter_id"
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
    WHERE ${column} = $1
    ORDER BY b.created_at DESC
    LIMIT 60`,
    [userId],
  )

  return rows.map(mapBooking)
}

export function totalsForListing(listing: DemoListing, startDate: string, endDate: string, deliveryType: DeliveryType) {
  const days = calculateDays(startDate, endDate)
  const rentalFee = days * listing.pricePerDay
  const deliveryFee = deliveryType === "igo-logistics" ? logisticsFee : 0

  return {
    days,
    rentalFee,
    securityDeposit: listing.securityDeposit,
    deliveryFee,
    totalPaid: rentalFee + listing.securityDeposit + deliveryFee,
  }
}
