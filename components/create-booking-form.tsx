"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getListing } from "@/app/actions/listing-actions"
import { createBooking, initiatePayment } from "@/app/actions/booking-actions"

export default function CreateBookingForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const listingId = searchParams.get("listing")

  const [listing, setListing] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [bookingData, setBookingData] = useState({
    startDate: "",
    endDate: "",
  })
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    const fetchListing = async () => {
      if (listingId) {
        const result = await getListing(listingId)
        if (result.success) {
          setListing(result.listing)
        }
      }
      setLoading(false)
    }

    fetchListing()
  }, [listingId])

  const calculateDays = () => {
    if (!bookingData.startDate || !bookingData.endDate) return 0
    const start = new Date(bookingData.startDate)
    const end = new Date(bookingData.endDate)
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  }

  const days = calculateDays()
  const totalPrice = listing ? days * listing.price_per_day : 0

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setBookingData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setProcessing(true)

    try {
      const bookingResult = await createBooking({
        renterId: "current-user-id",
        listingId: listingId || "",
        hostId: listing.host_id,
        startDate: bookingData.startDate,
        endDate: bookingData.endDate,
        numberOfDays: days,
        totalPrice,
      })

      if (!bookingResult.success) {
        alert("Failed to create booking")
        setProcessing(false)
        return
      }

      const paymentResult = await initiatePayment(
        bookingResult.booking.id,
        "current-user-id",
        "user@email.com",
        "User Name",
        "08000000000",
        totalPrice,
      )

      if (paymentResult.success) {
        window.location.href = paymentResult.paymentLink
      } else {
        alert("Payment initialization failed")
      }
    } catch (error) {
      alert("An error occurred")
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  if (!listing) {
    return <div className="text-center py-12">Listing not found</div>
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">{listing.title}</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Check-in Date</label>
              <Input type="date" name="startDate" value={bookingData.startDate} onChange={handleDateChange} required />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Check-out Date</label>
              <Input type="date" name="endDate" value={bookingData.endDate} onChange={handleDateChange} required />
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Rental Duration & Cost</p>
              <p className="text-2xl font-bold">
                {days} day{days !== 1 ? "s" : ""} × ₦{listing.price_per_day.toLocaleString()}
              </p>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-bold mb-3">Payment Method</h3>
              <p className="text-sm text-gray-600 mb-4">
                Your payment is held securely in escrow until the rental is completed.
              </p>

              <Button
                type="submit"
                disabled={processing || days <= 0}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg"
              >
                {processing ? "Processing..." : `Pay ₦${totalPrice.toLocaleString()} with Flutterwave`}
              </Button>
            </div>
          </form>
        </Card>
      </div>

      <div>
        <Card className="p-6">
          <h3 className="font-bold mb-4">Booking Summary</h3>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Days</span>
              <span className="font-semibold">{days}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Price per day</span>
              <span className="font-semibold">₦{listing.price_per_day.toLocaleString()}</span>
            </div>
            <div className="border-t pt-3 flex justify-between">
              <span className="font-bold">Total</span>
              <span className="font-bold text-lg">₦{totalPrice.toLocaleString()}</span>
            </div>
          </div>

          <div className="mt-6 p-4 bg-green-50 rounded-lg text-sm">
            <p className="font-semibold text-green-900 mb-2">Secure Escrow</p>
            <p className="text-green-700">
              Your payment is held safely until you confirm the item is in good condition.
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
