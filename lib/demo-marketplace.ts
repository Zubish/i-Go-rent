export type UserRole = "renter" | "vendor" | "logistics"

export type DemoUser = {
  id: string
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
  verified: boolean
}

export type DemoLogisticsProvider = {
  id: string
  providerName: string
  contactName: string
  phone: string
  email: string
  vehicleType: string
  plateNumber: string
  coverageAreas: string[]
  verified: boolean
  rating: number
  completedDispatches: number
}

export type DemoListing = {
  id: string
  vendorId: string
  vendorName: string
  vendorArea: string
  vendorVerified: boolean
  category: "Events" | "Transport" | "Gear"
  title: string
  description: string
  pricePerDay: number
  securityDeposit: number
  location: string
  deliveryArea: string
  condition: "New" | "Excellent" | "Good"
  rating: number
  reviews: number
  images: string[]
  included: string[]
  available: boolean
}

export type DeliveryType = "self-pickup" | "igo-logistics"

export type DispatchStatus =
  | "not_required"
  | "pending_assignment"
  | "assigned"
  | "accepted_by_provider"
  | "pickup_in_progress"
  | "collected_from_vendor"
  | "delivered_to_renter"
  | "dispatch_completed"
  | "dispatch_issue"

export type DemoDispatch = {
  id: string
  provider: DemoLogisticsProvider
  status: DispatchStatus
  dispatchReference: string
  pickupArea: string
  deliveryArea: string
  pickupWindow: string
  deliveryWindow: string
  dispatchFee: number
  vendorContact: {
    name: string
    phone: string
  }
  renterContact: {
    name: string
    phone: string
  }
  handoverCode: string
  instructions: string
  assignedAt: string
}

export type DemoBooking = {
  id: string
  listingId: string
  renterName: string
  vendorName: string
  title: string
  startDate: string
  endDate: string
  days: number
  rentalFee: number
  securityDeposit: number
  deliveryType: DeliveryType
  deliveryFee: number
  totalPaid: number
  escrowStatus: "held" | "returned_inspection_pending" | "released_to_vendor" | "deposit_refunded"
  dispatch?: DemoDispatch | null
  legalUseAccepted: boolean
  conditionAcknowledged: boolean
  createdAt: string
}

export const logisticsFee = 6500
export const maxListingImages = 10
export const maxListingImageSizeMb = 5

export const legalUseWarning =
  "i.Go-rent is only for lawful rental transactions. Do not list, book, fund, or dispatch illegal, stolen, restricted, counterfeit, dangerous, or illicit items, and do not use the app for fraud, money laundering, or transactions that violate applicable law."

export const lagosAreas = [
  "Lekki Phase 1",
  "Victoria Island",
  "Ikeja",
  "Yaba",
  "Surulere",
  "Ajah",
  "Ikoyi",
  "Maryland",
]

export const categories = [
  {
    name: "Events",
    description: "Sound, lighting, canopies, furniture, and crowd-control essentials.",
  },
  {
    name: "Transport",
    description: "Cars, vans, bikes, boats, and chauffeur-ready rentals.",
  },
  {
    name: "Gear",
    description: "Cameras, production kits, tools, and creator equipment.",
  },
] as const

export const seedLogisticsProviders: DemoLogisticsProvider[] = [
  {
    id: "logistics-island-runner",
    providerName: "Island Runner Dispatch",
    contactName: "Chidi Okafor",
    phone: "0803 555 0198",
    email: "dispatch@islandrunner.ng",
    vehicleType: "Van",
    plateNumber: "LSR-482-KJ",
    coverageAreas: ["Lekki Phase 1", "Victoria Island", "Ikoyi", "Ajah"],
    verified: true,
    rating: 4.9,
    completedDispatches: 214,
  },
  {
    id: "logistics-mainland-link",
    providerName: "Mainland Link Logistics",
    contactName: "Aminat Bello",
    phone: "0812 404 7788",
    email: "ops@mainlandlink.ng",
    vehicleType: "Cargo Bike",
    plateNumber: "KJA-771-QP",
    coverageAreas: ["Yaba", "Surulere", "Ikeja", "Maryland"],
    verified: true,
    rating: 4.8,
    completedDispatches: 167,
  },
]

export const seedListings: DemoListing[] = [
  {
    id: "professional-sound-system",
    vendorId: "vendor-soundpro",
    vendorName: "SoundPro Lagos",
    vendorArea: "Lekki Phase 1",
    vendorVerified: true,
    category: "Events",
    title: "Professional Sound System",
    description:
      "A full event-ready audio setup for weddings, birthdays, panels, and outdoor brand activations. Includes two powered speakers, mixer, two wireless microphones, stands, and cables.",
    pricePerDay: 45000,
    securityDeposit: 80000,
    location: "Admiralty Way, Lekki Phase 1",
    deliveryArea: "Lekki, VI, Ikoyi, Ajah",
    condition: "Excellent",
    rating: 4.9,
    reviews: 41,
    images: [
      "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1505236858219-8359eb29e329?auto=format&fit=crop&w=1200&q=80",
    ],
    included: ["2 powered speakers", "Mixer", "2 wireless microphones", "Speaker stands", "Setup support"],
    available: true,
  },
  {
    id: "cinema-content-bundle",
    vendorId: "vendor-lenshub",
    vendorName: "LensHub VI",
    vendorArea: "Victoria Island",
    vendorVerified: true,
    category: "Gear",
    title: "Cinema Bundle for Shoots",
    description:
      "Sony cinema camera bundle with tripod, monitor, gimbal, LED panel, and two lenses. Ideal for music videos, interviews, podcasts, and commercial shoots.",
    pricePerDay: 65000,
    securityDeposit: 150000,
    location: "Adeola Odeku, Victoria Island",
    deliveryArea: "Island and mainland by dispatch",
    condition: "Excellent",
    rating: 4.8,
    reviews: 29,
    images: ["https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80"],
    included: ["Camera body", "2 lenses", "Tripod", "Gimbal", "LED light"],
    available: true,
  },
  {
    id: "executive-sienna-with-driver",
    vendorId: "vendor-mobility",
    vendorName: "Island Mobility Co.",
    vendorArea: "Ikoyi",
    vendorVerified: true,
    category: "Transport",
    title: "Executive Sienna with Driver",
    description:
      "Clean, air-conditioned Toyota Sienna for airport pickup, production movement, family events, and executive city runs.",
    pricePerDay: 70000,
    securityDeposit: 50000,
    location: "Bourdillon Road, Ikoyi",
    deliveryArea: "All Lagos routes",
    condition: "Good",
    rating: 4.7,
    reviews: 63,
    images: ["https://images.unsplash.com/photo-1549924231-f129b911e442?auto=format&fit=crop&w=1200&q=80"],
    included: ["Professional driver", "Fuel policy agreed at checkout", "Phone support"],
    available: true,
  },
  {
    id: "premium-event-canopy-set",
    vendorId: "vendor-events",
    vendorName: "Mainland Event Rentals",
    vendorArea: "Yaba",
    vendorVerified: false,
    category: "Events",
    title: "Premium Canopy and Chair Set",
    description:
      "Outdoor event setup with two large canopies, 100 banquet chairs, ten tables, and basic installation for birthdays and neighborhood ceremonies.",
    pricePerDay: 55000,
    securityDeposit: 60000,
    location: "Sabo, Yaba",
    deliveryArea: "Yaba, Surulere, Ikeja",
    condition: "Good",
    rating: 4.6,
    reviews: 18,
    images: ["https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80"],
    included: ["2 canopies", "100 chairs", "10 tables", "Install crew"],
    available: true,
  },
]

export function formatNaira(amount: number) {
  return `NGN ${Math.round(amount).toLocaleString()}`
}

export function calculateDays(startDate: string, endDate: string) {
  if (!startDate || !endDate) return 0
  const start = new Date(startDate)
  const end = new Date(endDate)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0
  return Math.max(0, Math.ceil((end.getTime() - start.getTime()) / 86400000))
}

export function calculateBookingTotal(listing: DemoListing, startDate: string, endDate: string, deliveryType: DeliveryType) {
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

export function getRoleLabel(role: UserRole) {
  if (role === "vendor") return "Vendor"
  if (role === "logistics") return "Logistics Provider"
  return "Renter"
}
