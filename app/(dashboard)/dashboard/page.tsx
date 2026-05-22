"use client"

import type React from "react"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { BadgeCheck, CalendarCheck, CircleDollarSign, PackagePlus, ShieldCheck } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  categories,
  formatNaira,
  seedListings,
  type DemoBooking,
  type DemoListing,
  type DemoUser,
  type UserRole,
} from "@/lib/demo-marketplace"
import {
  createVendorListing,
  getAllListings,
  getBookings,
  getDemoSession,
  signOutDemo,
} from "@/lib/demo-client-store"

const defaultListingForm = {
  title: "Professional Sound System",
  category: "Events" as DemoListing["category"],
  description:
    "Complete party and corporate-event audio setup with two speakers, mixer, wireless microphones, stands, and setup support.",
  pricePerDay: "45000",
  securityDeposit: "80000",
  location: "Admiralty Way, Lekki Phase 1",
  deliveryArea: "Lekki, VI, Ikoyi, Ajah",
  condition: "Excellent" as DemoListing["condition"],
  imageUrl: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80",
}

export default function DashboardPage() {
  const [session, setSession] = useState<DemoUser | null>(null)
  const [role, setRole] = useState<UserRole>("renter")
  const [listings, setListings] = useState<DemoListing[]>([])
  const [bookings, setBookings] = useState<DemoBooking[]>([])
  const [form, setForm] = useState(defaultListingForm)
  const [createdListingId, setCreatedListingId] = useState("")

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const queryRole = params.get("role")
    const user = getDemoSession()
    const activeRole = queryRole === "vendor" || user?.role === "vendor" ? "vendor" : "renter"
    setSession(user)
    setRole(activeRole)
    setListings(getAllListings())
    setBookings(getBookings())
  }, [])

  const vendorListings = useMemo(() => {
    if (!session) return listings.filter((listing) => !seedListings.includes(listing))
    return listings.filter((listing) => listing.vendorId === session.id || listing.vendorName === `${session.firstName} ${session.lastName}`)
  }, [listings, session])

  const activeBookings = bookings.filter((booking) => booking.escrowStatus === "held")
  const totalEscrow = bookings.reduce((sum, booking) => sum + booking.totalPaid, 0)

  const handleListingChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleCreateListing = (event: React.FormEvent) => {
    event.preventDefault()
    const listing = createVendorListing({
      title: form.title,
      category: form.category,
      description: form.description,
      pricePerDay: Number(form.pricePerDay),
      securityDeposit: Number(form.securityDeposit),
      location: form.location,
      deliveryArea: form.deliveryArea,
      condition: form.condition,
      imageUrl: form.imageUrl,
    })
    setCreatedListingId(listing.id)
    setListings(getAllListings())
  }

  const handleSignOut = () => {
    signOutDemo()
    setSession(null)
  }

  return (
    <main className="min-h-screen bg-[#f7fbfb]">
      <header className="border-b bg-[#071b2f] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="font-semibold">
            i.Go-rent
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
              <Link href="/browse">Browse</Link>
            </Button>
            <Button onClick={handleSignOut} variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
              Reset demo
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <Badge className="bg-teal-50 text-teal-700">{role === "vendor" ? "Vendor workspace" : "Renter workspace"}</Badge>
            <h1 className="mt-3 text-4xl font-semibold tracking-normal text-slate-950">
              {session ? `Welcome, ${session.firstName}` : "Demo dashboard"}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Manage listings, simulated bookings, and escrow states for the Lagos rental flow.
            </p>
          </div>
          <div className="grid grid-cols-2 rounded-lg bg-white p-1 shadow-sm">
            {[
              ["renter", "Renter"],
              ["vendor", "Vendor"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setRole(value as UserRole)}
                className={`rounded-md px-5 py-2 text-sm font-medium ${
                  role === value ? "bg-[#071b2f] text-white" : "text-slate-600"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Metric icon={CalendarCheck} label="Bookings" value={bookings.length.toString()} />
          <Metric icon={ShieldCheck} label="Active escrow" value={activeBookings.length.toString()} />
          <Metric icon={CircleDollarSign} label="Total simulated value" value={formatNaira(totalEscrow)} />
        </div>

        {role === "vendor" ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <Card className="rounded-lg border-slate-200 bg-white p-6">
              <h2 className="flex items-center gap-2 text-xl font-semibold">
                <PackagePlus className="size-5 text-teal-600" /> Add rental listing
              </h2>
              <form onSubmit={handleCreateListing} className="mt-5 space-y-4">
                <Input name="title" value={form.title} onChange={handleListingChange} placeholder="Listing title" required />
                <div className="grid gap-4 sm:grid-cols-2">
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleListingChange}
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {categories.map((category) => (
                      <option key={category.name}>{category.name}</option>
                    ))}
                  </select>
                  <select
                    name="condition"
                    value={form.condition}
                    onChange={handleListingChange}
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option>New</option>
                    <option>Excellent</option>
                    <option>Good</option>
                  </select>
                </div>
                <Textarea name="description" value={form.description} onChange={handleListingChange} rows={4} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input name="pricePerDay" type="number" value={form.pricePerDay} onChange={handleListingChange} placeholder="Daily price" required />
                  <Input
                    name="securityDeposit"
                    type="number"
                    value={form.securityDeposit}
                    onChange={handleListingChange}
                    placeholder="Security deposit"
                    required
                  />
                </div>
                <Input name="location" value={form.location} onChange={handleListingChange} placeholder="Pickup location" required />
                <Input name="deliveryArea" value={form.deliveryArea} onChange={handleListingChange} placeholder="Delivery coverage" required />
                <Input name="imageUrl" value={form.imageUrl} onChange={handleListingChange} placeholder="Photo URL" />
                <Button className="w-full bg-teal-500 text-white hover:bg-teal-600">Save listing</Button>
              </form>
              {createdListingId && (
                <div className="mt-4 rounded-md bg-teal-50 p-4 text-sm text-teal-900">
                  Listing created.{" "}
                  <Link className="font-semibold underline" href={`/listings/${createdListingId}`}>
                    View it
                  </Link>
                  .
                </div>
              )}
            </Card>

            <Card className="rounded-lg border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Vendor listings</h2>
                {session?.verified && <Badge className="bg-teal-50 text-teal-700"><BadgeCheck /> Verified</Badge>}
              </div>
              <div className="mt-5 space-y-4">
                {(vendorListings.length ? vendorListings : listings.slice(0, 2)).map((listing) => (
                  <ListingRow key={listing.id} listing={listing} />
                ))}
              </div>
            </Card>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.85fr]">
            <Card className="rounded-lg border-slate-200 bg-white p-6">
              <h2 className="text-xl font-semibold">My bookings</h2>
              <div className="mt-5 space-y-4">
                {bookings.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center">
                    <p className="font-semibold">No bookings yet</p>
                    <p className="mt-2 text-sm text-slate-600">Search for Professional Sound System to complete the success path.</p>
                    <Button asChild className="mt-5 bg-[#071b2f] text-white hover:bg-[#0b2b49]">
                      <Link href="/browse">Browse rentals</Link>
                    </Button>
                  </div>
                ) : (
                  bookings.map((booking) => (
                    <Link key={booking.id} href={`/bookings/${booking.id}`}>
                      <div className="rounded-lg border border-slate-200 p-4 transition hover:border-teal-300">
                        <div className="flex items-center justify-between gap-4">
                          <p className="font-semibold">{booking.title}</p>
                          <Badge className="bg-teal-50 text-teal-700">{booking.escrowStatus.replaceAll("_", " ")}</Badge>
                        </div>
                        <p className="mt-2 text-sm text-slate-600">{formatNaira(booking.totalPaid)} · {booking.days} days</p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </Card>

            <Card className="rounded-lg border-slate-200 bg-white p-6">
              <h2 className="text-xl font-semibold">Recommended rentals</h2>
              <div className="mt-5 space-y-4">
                {listings.slice(0, 3).map((listing) => (
                  <ListingRow key={listing.id} listing={listing} compact />
                ))}
              </div>
            </Card>
          </div>
        )}
      </section>
    </main>
  )
}

function Metric({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <Card className="rounded-lg border-slate-200 bg-white p-5">
      <Icon className="size-5 text-teal-600" />
      <p className="mt-3 text-sm text-slate-600">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </Card>
  )
}

function ListingRow({ listing, compact }: { listing: DemoListing; compact?: boolean }) {
  return (
    <Link href={`/listings/${listing.id}`} className="block">
      <div className="grid grid-cols-[86px_1fr] gap-4 rounded-lg border border-slate-200 p-3 transition hover:border-teal-300">
        <img src={listing.images[0]} alt="" className="h-20 w-full rounded-md object-cover" />
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{listing.title}</p>
            {listing.vendorVerified && <Badge className="bg-teal-50 text-teal-700">Verified</Badge>}
          </div>
          <p className="mt-1 text-sm text-slate-600">{formatNaira(listing.pricePerDay)} / day</p>
          {!compact && <p className="mt-1 text-xs text-slate-500">Deposit {formatNaira(listing.securityDeposit)}</p>}
        </div>
      </div>
    </Link>
  )
}
