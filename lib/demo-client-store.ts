"use client"

import {
  calculateBookingTotal,
  seedListings,
  type DeliveryType,
  type DemoBooking,
  type DemoListing,
  type DemoUser,
  type UserRole,
} from "@/lib/demo-marketplace"

const sessionKey = "igorent_demo_session"
const listingsKey = "igorent_demo_listings"
const bookingsKey = "igorent_demo_bookings"

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback

  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(key, JSON.stringify(value))
}

export function getDemoSession() {
  return readJson<DemoUser | null>(sessionKey, null)
}

export function saveDemoSession(user: DemoUser) {
  writeJson(sessionKey, user)
}

export function createDemoSession(input: {
  role: UserRole
  firstName: string
  lastName: string
  email: string
  phone: string
  area: string
  nin?: string
  bvn?: string
}) {
  const user: DemoUser = {
    id: `user-${Date.now()}`,
    role: input.role,
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    phone: input.phone,
    area: input.area,
    nin: input.nin,
    bvn: input.bvn,
    verified: input.role === "vendor" && Boolean(input.nin && input.bvn),
  }

  saveDemoSession(user)
  return user
}

export function signOutDemo() {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(sessionKey)
}

export function getStoredListings() {
  return readJson<DemoListing[]>(listingsKey, [])
}

export function getAllListings() {
  const custom = getStoredListings()
  const customIds = new Set(custom.map((listing) => listing.id))
  return [...custom, ...seedListings.filter((listing) => !customIds.has(listing.id))]
}

export function getListingById(id: string) {
  return getAllListings().find((listing) => listing.id === id)
}

export function saveListing(listing: DemoListing) {
  const listings = getStoredListings()
  writeJson(listingsKey, [listing, ...listings.filter((item) => item.id !== listing.id)])
}

export function createVendorListing(input: {
  title: string
  category: DemoListing["category"]
  description: string
  pricePerDay: number
  securityDeposit: number
  location: string
  deliveryArea: string
  condition: DemoListing["condition"]
  imageUrl: string
}) {
  const session = getDemoSession()
  const vendorName = session ? `${session.firstName} ${session.lastName}` : "New Lagos Vendor"
  const listing: DemoListing = {
    id: input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `listing-${Date.now()}`,
    vendorId: session?.id || "demo-vendor",
    vendorName,
    vendorArea: session?.area || "Lagos",
    vendorVerified: Boolean(session?.verified),
    category: input.category,
    title: input.title,
    description: input.description,
    pricePerDay: input.pricePerDay,
    securityDeposit: input.securityDeposit,
    location: input.location,
    deliveryArea: input.deliveryArea,
    condition: input.condition,
    rating: 0,
    reviews: 0,
    images: [input.imageUrl || "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80"],
    included: ["Vendor confirmed item", "Pickup checklist", "Escrow-backed deposit"],
    available: true,
  }

  saveListing(listing)
  return listing
}

export function getBookings() {
  return readJson<DemoBooking[]>(bookingsKey, [])
}

export function getBookingById(id: string) {
  return getBookings().find((booking) => booking.id === id)
}

export function createDemoBooking(input: {
  listing: DemoListing
  renterName: string
  startDate: string
  endDate: string
  deliveryType: DeliveryType
}) {
  const totals = calculateBookingTotal(input.listing, input.startDate, input.endDate, input.deliveryType)
  const booking: DemoBooking = {
    id: `IGR-${Date.now().toString().slice(-7)}`,
    listingId: input.listing.id,
    renterName: input.renterName,
    vendorName: input.listing.vendorName,
    title: input.listing.title,
    startDate: input.startDate,
    endDate: input.endDate,
    days: totals.days,
    rentalFee: totals.rentalFee,
    securityDeposit: totals.securityDeposit,
    deliveryType: input.deliveryType,
    deliveryFee: totals.deliveryFee,
    totalPaid: totals.totalPaid,
    escrowStatus: "held",
    createdAt: new Date().toISOString(),
  }

  writeJson(bookingsKey, [booking, ...getBookings()])
  return booking
}

export function markReturnedAndInspected(id: string) {
  const updated = getBookings().map((booking) =>
    booking.id === id ? { ...booking, escrowStatus: "deposit_refunded" as const } : booking,
  )
  writeJson(bookingsKey, updated)
  return updated.find((booking) => booking.id === id)
}
