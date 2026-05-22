"use client"

import {
  calculateBookingTotal,
  seedLogisticsProviders,
  seedListings,
  type DeliveryType,
  type DemoBooking,
  type DemoDispatch,
  type DemoListing,
  type DemoLogisticsProvider,
  type DemoUser,
  type UserRole,
} from "@/lib/demo-marketplace"

const sessionKey = "igorent_demo_session"
const listingsKey = "igorent_demo_listings"
const bookingsKey = "igorent_demo_bookings"
const logisticsProvidersKey = "igorent_demo_logistics_providers"

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
  cac?: string
  businessName?: string
  licenseNumber?: string
  vehicleType?: string
  plateNumber?: string
  coverageArea?: string
}) {
  const verified =
    input.role === "vendor"
      ? Boolean(input.nin && input.bvn)
      : input.role === "logistics"
        ? Boolean(input.nin && input.bvn && input.licenseNumber && input.vehicleType && input.plateNumber)
        : Boolean(input.nin)

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
    cac: input.cac,
    businessName: input.businessName,
    licenseNumber: input.licenseNumber,
    vehicleType: input.vehicleType,
    plateNumber: input.plateNumber,
    coverageArea: input.coverageArea,
    verified,
  }

  saveDemoSession(user)
  if (input.role === "logistics") saveLogisticsProviderFromUser(user)
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

export function getStoredLogisticsProviders() {
  return readJson<DemoLogisticsProvider[]>(logisticsProvidersKey, [])
}

export function getAllLogisticsProviders() {
  const custom = getStoredLogisticsProviders()
  const customIds = new Set(custom.map((provider) => provider.id))
  return [...custom, ...seedLogisticsProviders.filter((provider) => !customIds.has(provider.id))]
}

export function getLogisticsProviderForUser(userId?: string) {
  if (!userId) return null
  return getAllLogisticsProviders().find((provider) => provider.id === userId) || null
}

function saveLogisticsProviderFromUser(user: DemoUser) {
  const provider: DemoLogisticsProvider = {
    id: user.id,
    providerName: user.businessName || `${user.firstName} ${user.lastName} Logistics`,
    contactName: `${user.firstName} ${user.lastName}`,
    phone: user.phone,
    email: user.email,
    vehicleType: user.vehicleType || "Dispatch vehicle",
    plateNumber: user.plateNumber || "Pending",
    coverageAreas: splitCoverageAreas(user.coverageArea || user.area),
    verified: user.verified,
    rating: 0,
    completedDispatches: 0,
  }

  const providers = getStoredLogisticsProviders()
  writeJson(logisticsProvidersKey, [provider, ...providers.filter((item) => item.id !== provider.id)])
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
  imageUrls: string
}) {
  const session = getDemoSession()
  const vendorName = session ? `${session.firstName} ${session.lastName}` : "New Lagos Vendor"
  const images = splitCoverageAreas(input.imageUrls).slice(0, 10)
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
    images: images.length
      ? images
      : ["https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80"],
    included: ["Vendor confirmed item", "Pickup checklist", "Escrow-backed deposit"],
    available: true,
  }

  saveListing(listing)
  return listing
}

function splitCoverageAreas(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

function providerMatchesListing(provider: DemoLogisticsProvider, listing: DemoListing) {
  const pickupText = `${listing.vendorArea} ${listing.location} ${listing.deliveryArea}`.toLowerCase()
  return provider.coverageAreas.some((area) => pickupText.includes(area.toLowerCase()))
}

export function getSuggestedLogisticsProvider(listing: DemoListing) {
  const providers = getAllLogisticsProviders().filter((provider) => provider.verified)
  return providers.find((provider) => providerMatchesListing(provider, listing)) || providers[0] || null
}

function buildDispatch(input: {
  listing: DemoListing
  renterName: string
  renterPhone: string
  startDate: string
  provider: DemoLogisticsProvider
}): DemoDispatch {
  const reference = `DSP-${Date.now().toString().slice(-6)}`

  return {
    id: `dispatch-${Date.now()}`,
    provider: input.provider,
    status: "assigned",
    dispatchReference: reference,
    pickupArea: input.listing.vendorArea,
    deliveryArea: input.listing.deliveryArea,
    pickupWindow: `${input.startDate} · 9:00 AM - 12:00 PM`,
    deliveryWindow: `${input.startDate} · 12:00 PM - 4:00 PM`,
    dispatchFee: 6500,
    vendorContact: {
      name: input.listing.vendorName,
      phone: "0800 VENDOR",
    },
    renterContact: {
      name: input.renterName,
      phone: input.renterPhone || "0800 RENTER",
    },
    handoverCode: `IG-${Math.floor(1000 + Math.random() * 9000)}`,
    instructions:
      "Provider details are shared with both parties after escrow funding. Vendor should only release the item after recording condition proof and confirming the handover code.",
    assignedAt: new Date().toISOString(),
  }
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
  renterPhone?: string
  startDate: string
  endDate: string
  deliveryType: DeliveryType
  legalUseAccepted: boolean
  conditionAcknowledged: boolean
}) {
  const totals = calculateBookingTotal(input.listing, input.startDate, input.endDate, input.deliveryType)
  const provider = input.deliveryType === "igo-logistics" ? getSuggestedLogisticsProvider(input.listing) : null
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
    dispatch:
      provider && input.deliveryType === "igo-logistics"
        ? buildDispatch({
            listing: input.listing,
            renterName: input.renterName,
            renterPhone: input.renterPhone || "",
            startDate: input.startDate,
            provider,
          })
        : null,
    legalUseAccepted: input.legalUseAccepted,
    conditionAcknowledged: input.conditionAcknowledged,
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

export function getBookingsForLogisticsProvider(providerId?: string) {
  if (!providerId) return []
  return getBookings().filter((booking) => booking.dispatch?.provider.id === providerId)
}
