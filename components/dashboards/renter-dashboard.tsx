"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function RenterDashboard({ data }: { data: any }) {
  if (!data || !data.success) {
    return <div className="p-8">Failed to load dashboard</div>
  }

  const { profile, activeBookings, pastBookings, totalSpent } = data

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Welcome, {profile.first_name}!</h1>
        <p className="text-gray-600">Manage your bookings and rentals</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <p className="text-gray-600 text-sm mb-2">Active Bookings</p>
          <p className="text-3xl font-bold">{activeBookings.length}</p>
        </Card>
        <Card className="p-6">
          <p className="text-gray-600 text-sm mb-2">Total Spent</p>
          <p className="text-3xl font-bold">₦{totalSpent.toLocaleString()}</p>
        </Card>
        <Card className="p-6">
          <p className="text-gray-600 text-sm mb-2">Completed Rentals</p>
          <p className="text-3xl font-bold">{pastBookings.length}</p>
        </Card>
      </div>

      {/* Active Bookings */}
      {activeBookings.length > 0 && (
        <Card className="p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Active Bookings</h2>
          <div className="space-y-4">
            {activeBookings.map((booking: any) => (
              <div key={booking.id} className="flex items-center justify-between border-b pb-4">
                <div>
                  <h3 className="font-bold">{booking.title}</h3>
                  <p className="text-sm text-gray-600">
                    {new Date(booking.start_date).toLocaleDateString()} -{" "}
                    {new Date(booking.end_date).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    Host: {booking.first_name} {booking.last_name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">₦{booking.total_price.toLocaleString()}</p>
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full mt-2">
                    {booking.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Past Bookings */}
      {pastBookings.length > 0 && (
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Past Rentals</h2>
          <div className="space-y-4">
            {pastBookings.map((booking: any) => (
              <div key={booking.id} className="flex items-center justify-between border-b pb-4">
                <div>
                  <h3 className="font-bold">{booking.title}</h3>
                  <p className="text-sm text-gray-600">Ended: {new Date(booking.end_date).toLocaleDateString()}</p>
                </div>
                <Link href={`/bookings/${booking.id}/review`}>
                  <Button variant="outline" size="sm">
                    Leave Review
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeBookings.length === 0 && pastBookings.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-gray-600 mb-4">No bookings yet. Start exploring!</p>
          <Link href="/browse">
            <Button className="bg-blue-600 hover:bg-blue-700">Browse Rentals</Button>
          </Link>
        </Card>
      )}
    </div>
  )
}
