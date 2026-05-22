"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, CheckCircle2, ShieldCheck, Truck } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { formatNaira, type DemoBooking } from "@/lib/demo-marketplace"
import { getBookingById, markReturnedAndInspected } from "@/lib/demo-client-store"

export default function BookingDetailPage() {
  const params = useParams()
  const [booking, setBooking] = useState<DemoBooking | null>(null)

  useEffect(() => {
    setBooking(getBookingById(params.id as string) || null)
  }, [params.id])

  if (!booking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7fbfb] p-6">
        <Card className="max-w-md rounded-lg p-8 text-center">
          <p className="font-semibold">Booking not found</p>
          <Button asChild className="mt-5 bg-[#071b2f] text-white hover:bg-[#0b2b49]">
            <Link href="/browse">Browse rentals</Link>
          </Button>
        </Card>
      </main>
    )
  }

  const escrowCopy =
    booking.escrowStatus === "deposit_refunded"
      ? "Returned and inspected. Deposit refund and vendor release are recorded."
      : "Funds are currently held in virtual escrow pending return inspection."

  return (
    <main className="min-h-screen bg-[#f7fbfb]">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
          <ArrowLeft className="size-4" /> Dashboard
        </Link>

        <Card className="mt-6 overflow-hidden rounded-lg border-slate-200 bg-white shadow-sm">
          <div className="bg-[#071b2f] p-6 text-white">
            <Badge className="bg-teal-400 text-[#071b2f]">Booking confirmed</Badge>
            <h1 className="mt-4 text-3xl font-semibold tracking-normal">{booking.title}</h1>
            <p className="mt-2 text-sm text-slate-300">Reference {booking.id}</p>
          </div>

          <div className="grid gap-6 p-6 lg:grid-cols-[1fr_340px]">
            <div className="space-y-5">
              <section>
                <h2 className="font-semibold">Rental details</h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Info label="Renter" value={booking.renterName} />
                  <Info label="Vendor" value={booking.vendorName} />
                  <Info label="Dates" value={`${booking.startDate} to ${booking.endDate}`} />
                  <Info label="Duration" value={`${booking.days} days`} />
                </div>
              </section>

              <section className="rounded-lg border border-slate-200 p-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-1 size-5 text-teal-600" />
                  <div>
                    <h2 className="font-semibold">Virtual escrow status</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{escrowCopy}</p>
                    <Badge className="mt-3 bg-teal-50 text-teal-700">{booking.escrowStatus.replaceAll("_", " ")}</Badge>
                  </div>
                </div>
              </section>

              <section className="rounded-lg border border-slate-200 p-5">
                <div className="flex items-start gap-3">
                  <Truck className="mt-1 size-5 text-teal-600" />
                  <div>
                    <h2 className="font-semibold">Delivery</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {booking.deliveryType === "igo-logistics"
                        ? "i.Go-Logistics flat-fee dispatch selected."
                        : "Self-pickup selected. Coordinate pickup with the vendor."}
                    </p>
                  </div>
                </div>
              </section>
            </div>

            <aside>
              <Card className="rounded-lg border-slate-200 bg-slate-50 p-5">
                <h2 className="font-semibold">Payment breakdown</h2>
                <div className="mt-4 space-y-3 text-sm">
                  <Row label="Rental fee" value={formatNaira(booking.rentalFee)} />
                  <Row label="Security deposit" value={formatNaira(booking.securityDeposit)} />
                  <Row label="Delivery" value={formatNaira(booking.deliveryFee)} />
                  <div className="border-t pt-3">
                    <Row label="Total paid" value={formatNaira(booking.totalPaid)} strong />
                  </div>
                </div>
              </Card>

              <Button
                type="button"
                onClick={() => setBooking(markReturnedAndInspected(booking.id) || booking)}
                disabled={booking.escrowStatus === "deposit_refunded"}
                className="mt-4 w-full bg-teal-500 text-white hover:bg-teal-600"
              >
                <CheckCircle2 />
                Mark returned and inspected
              </Button>
            </aside>
          </div>
        </Card>
      </div>
    </main>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 ${strong ? "text-base font-semibold" : ""}`}>
      <span className="text-slate-600">{label}</span>
      <span className="font-semibold text-slate-950">{value}</span>
    </div>
  )
}
