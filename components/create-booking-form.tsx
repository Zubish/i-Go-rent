"use client"

import type React from "react"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CalendarDays, ShieldCheck, Truck } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  calculateBookingTotal,
  formatNaira,
  logisticsFee,
  type DeliveryType,
  type DemoListing,
} from "@/lib/demo-marketplace"
import { createDemoBooking, getDemoSession, getListingById } from "@/lib/demo-client-store"

export default function CreateBookingForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const listingId = searchParams.get("listing")

  const [listing, setListing] = useState<DemoListing | null>(null)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("self-pickup")
  const [renterName, setRenterName] = useState("")
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (listingId) setListing(getListingById(listingId) || null)
    const session = getDemoSession()
    if (session) setRenterName(`${session.firstName} ${session.lastName}`)
  }, [listingId])

  const totals = useMemo(() => {
    if (!listing) return null
    return calculateBookingTotal(listing, startDate, endDate, deliveryType)
  }, [deliveryType, endDate, listing, startDate])

  const canBook = Boolean(listing && renterName && totals && totals.days > 0)

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!listing || !canBook) return

    setProcessing(true)
    const booking = createDemoBooking({
      listing,
      renterName,
      startDate,
      endDate,
      deliveryType,
    })

    window.setTimeout(() => {
      router.push(`/bookings/${booking.id}`)
    }, 500)
  }

  const handleStartDate = (event: React.ChangeEvent<HTMLInputElement>) => setStartDate(event.currentTarget.value)
  const handleEndDate = (event: React.ChangeEvent<HTMLInputElement>) => setEndDate(event.currentTarget.value)

  if (!listing) {
    return (
      <Card className="rounded-lg p-8 text-center">
        <p className="font-semibold">Listing not found</p>
        <p className="mt-2 text-sm text-slate-600">Go back to browse and choose an available rental.</p>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="space-y-5">
        <Card className="rounded-lg border-slate-200 bg-white p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Badge className="bg-teal-50 text-teal-700">{listing.category}</Badge>
              <h2 className="mt-3 text-2xl font-semibold tracking-normal">{listing.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{listing.vendorName} · {listing.location}</p>
            </div>
            <img src={listing.images[0]} alt="" className="h-24 w-32 rounded-md object-cover" />
          </div>
        </Card>

        <Card className="rounded-lg border-slate-200 bg-white p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <CalendarDays className="size-5 text-teal-600" /> Rental dates
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label>
              <span className="mb-2 block text-sm font-medium text-slate-700">Start date</span>
              <Input type="date" value={startDate} onChange={handleStartDate} onInput={handleStartDate} required />
            </label>
            <label>
              <span className="mb-2 block text-sm font-medium text-slate-700">End date</span>
              <Input type="date" value={endDate} onChange={handleEndDate} onInput={handleEndDate} required />
            </label>
          </div>
        </Card>

        <Card className="rounded-lg border-slate-200 bg-white p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <Truck className="size-5 text-teal-600" /> Delivery type
          </h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              ["self-pickup", "Self-Pickup", "Meet vendor at the listed pickup location.", 0],
              ["igo-logistics", "i.Go-Logistics", "Flat-fee dispatch coordination inside Lagos.", logisticsFee],
            ].map(([value, title, body, fee]) => (
              <label
                key={value as string}
                className={`cursor-pointer rounded-lg border p-4 ${
                  deliveryType === value ? "border-teal-500 bg-teal-50" : "border-slate-200 bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="deliveryType"
                  value={value as string}
                  checked={deliveryType === value}
                  onChange={() => setDeliveryType(value as DeliveryType)}
                  className="sr-only"
                />
                <span className="font-semibold">{title as string}</span>
                <span className="mt-1 block text-sm leading-6 text-slate-600">{body as string}</span>
                <span className="mt-3 block text-sm font-semibold">{formatNaira(fee as number)}</span>
              </label>
            ))}
          </div>
        </Card>

        <Card className="rounded-lg border-slate-200 bg-white p-6">
          <h3 className="text-lg font-semibold">Renter details</h3>
          <label className="mt-4 block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Name for booking</span>
            <Input value={renterName} onChange={(event) => setRenterName(event.target.value)} placeholder="Your full name" required />
          </label>
        </Card>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <Card className="rounded-lg border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/70">
          <h3 className="text-lg font-semibold">Checkout summary</h3>
          <div className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Rental duration</span>
              <span className="font-semibold">{totals?.days || 0} days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Rental fee</span>
              <span className="font-semibold">{formatNaira(totals?.rentalFee || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Security deposit</span>
              <span className="font-semibold">{formatNaira(totals?.securityDeposit || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Delivery</span>
              <span className="font-semibold">{formatNaira(totals?.deliveryFee || 0)}</span>
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between text-base">
                <span className="font-semibold">Simulated payment</span>
                <span className="font-semibold">{formatNaira(totals?.totalPaid || 0)}</span>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-md bg-[#071b2f] p-4 text-sm text-white">
            <div className="flex items-center gap-2 font-semibold text-teal-200">
              <ShieldCheck className="size-4" /> Virtual escrow
            </div>
            <p className="mt-2 text-slate-300">
              This demo marks funds as held until the vendor confirms returned and inspected.
            </p>
          </div>

          <Button disabled={!canBook || processing} size="lg" className="mt-5 w-full bg-teal-500 text-white hover:bg-teal-600">
            {processing ? "Creating booking..." : "Complete simulated booking"}
          </Button>
        </Card>
      </aside>
    </form>
  )
}
