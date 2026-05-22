"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getBooking } from "@/app/actions/booking-actions"
import { getEscrowTransaction } from "@/app/actions/booking-actions"
import Link from "next/link"

export default function BookingDetailPage() {
  const params = useParams()
  const [booking, setBooking] = useState<any>(null)
  const [escrow, setEscrow] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const bookingResult = await getBooking(params.id as string)
      if (bookingResult.success) {
        setBooking(bookingResult.booking)

        const escrowResult = await getEscrowTransaction(bookingResult.booking.escrow_transaction_id)
        if (escrowResult.success) {
          setEscrow(escrowResult.escrow)
        }
      }
      setLoading(false)
    }

    fetchData()
  }, [params.id])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!booking) {
    return <div className="min-h-screen flex items-center justify-center">Booking not found</div>
  }

  const isCompleted = booking.status === "completed"
  const isActive = booking.status === "active"

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Link href="/dashboard" className="text-blue-600 hover:underline mb-6">
          ← Back to Dashboard
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Booking Details */}
            <Card className="p-6 mb-8">
              <h1 className="text-3xl font-bold mb-4">{booking.listing_title}</h1>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between border-b pb-3">
                  <span className="text-gray-600">Booking ID</span>
                  <span className="font-semibold">{booking.id}</span>
                </div>
                <div className="flex justify-between border-b pb-3">
                  <span className="text-gray-600">Check-in</span>
                  <span className="font-semibold">{new Date(booking.start_date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between border-b pb-3">
                  <span className="text-gray-600">Check-out</span>
                  <span className="font-semibold">{new Date(booking.end_date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between border-b pb-3">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-semibold">{booking.number_of_days} days</span>
                </div>
              </div>

              {/* Status Badge */}
              <div className="mb-6">
                <span
                  className={`px-4 py-2 rounded-full text-white font-semibold ${
                    booking.status === "completed"
                      ? "bg-green-600"
                      : booking.status === "active"
                        ? "bg-blue-600"
                        : booking.status === "confirmed"
                          ? "bg-yellow-600"
                          : "bg-gray-600"
                  }`}
                >
                  {booking.status.toUpperCase()}
                </span>
              </div>

              {/* Action Buttons */}
              {isActive && <Button className="w-full bg-green-600 hover:bg-green-700 mb-3">Mark as Completed</Button>}

              {isCompleted && (
                <Link href={`/bookings/${booking.id}/review`}>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">Leave Review</Button>
                </Link>
              )}
            </Card>

            {/* Contact Information */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Parties</h2>

              <div className="space-y-6">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Renter</p>
                  <p className="font-bold">
                    {booking.renter_first_name} {booking.renter_last_name}
                  </p>
                  <p className="text-sm text-gray-600">{booking.renter_email}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Host</p>
                  <p className="font-bold">
                    {booking.host_first_name} {booking.host_last_name}
                  </p>
                  <p className="text-sm text-gray-600">{booking.host_email}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Payment & Escrow */}
          <div>
            <Card className="p-6 mb-6">
              <h2 className="text-2xl font-bold mb-4">Payment Details</h2>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount</span>
                  <span className="font-bold">₦{booking.total_price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className="font-semibold text-green-600">Paid</span>
                </div>
              </div>
            </Card>

            {escrow && (
              <Card className="p-6 bg-blue-50">
                <h3 className="font-bold mb-3">Escrow Status</h3>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount Held</span>
                    <span className="font-semibold">₦{escrow.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status</span>
                    <span className="font-semibold capitalize">{escrow.status}</span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-blue-100 rounded text-xs text-blue-900">
                  {escrow.status === "held" && "Funds are securely held until rental completion."}
                  {escrow.status === "released_to_host" && "Funds have been released to the host."}
                  {escrow.status === "refunded_to_renter" && "Funds have been refunded to the renter."}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
