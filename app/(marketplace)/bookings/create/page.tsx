"use client"

import { Suspense } from "react"
import CreateBookingForm from "@/components/create-booking-form"

export default function CreateBookingPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Complete Your Booking</h1>

        <Suspense fallback={<div className="text-center py-12">Loading...</div>}>
          <CreateBookingForm />
        </Suspense>
      </div>
    </div>
  )
}
