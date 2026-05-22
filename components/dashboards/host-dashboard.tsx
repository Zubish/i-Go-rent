"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

export default function HostDashboard({ data }: { data: any }) {
  if (!data || !data.success) {
    return <div className="p-8">Failed to load dashboard</div>
  }

  const { profile, activeBookings, listings, monthlyEarnings, totalEarnings, pendingPayouts, tierStatus } = data

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Welcome back, {profile.first_name}!</h1>
          <p className="text-gray-600">Manage your listings and earnings</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Verification Tier</p>
          <p className="text-2xl font-bold">
            {tierStatus?.current_tier === 0
              ? "Unverified"
              : tierStatus?.current_tier === 1
                ? "Tier 1"
                : tierStatus?.current_tier === 2
                  ? "Tier 2"
                  : "Tier 3"}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <p className="text-gray-600 text-sm mb-2">Active Bookings</p>
          <p className="text-3xl font-bold">{activeBookings.length}</p>
        </Card>
        <Card className="p-6">
          <p className="text-gray-600 text-sm mb-2">Total Listings</p>
          <p className="text-3xl font-bold">{listings.length}</p>
        </Card>
        <Card className="p-6 bg-green-50">
          <p className="text-gray-600 text-sm mb-2">Total Earnings</p>
          <p className="text-3xl font-bold text-green-600">₦{totalEarnings.toLocaleString()}</p>
        </Card>
        <Card className="p-6 bg-blue-50">
          <p className="text-gray-600 text-sm mb-2">Pending Payouts</p>
          <p className="text-3xl font-bold text-blue-600">₦{pendingPayouts.toLocaleString()}</p>
        </Card>
      </div>

      {/* Earnings Chart */}
      {monthlyEarnings.length > 0 && (
        <Card className="p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Monthly Earnings</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyEarnings}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="earnings" fill="#0066cc" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

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
                    Renter: {booking.first_name} {booking.last_name} ({booking.rating}⭐)
                  </p>
                  <p className="text-sm text-gray-600">
                    {new Date(booking.start_date).toLocaleDateString()} -{" "}
                    {new Date(booking.end_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">₦{booking.total_price.toLocaleString()}</p>
                  <Link href={`/bookings/${booking.id}`}>
                    <Button variant="outline" size="sm" className="mt-2 bg-transparent">
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Listings */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">My Listings</h2>
          <Link href="/listings/create">
            <Button className="bg-blue-600 hover:bg-blue-700">+ Create Listing</Button>
          </Link>
        </div>

        {listings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {listings.map((listing: any) => (
              <div key={listing.id} className="border rounded-lg p-4">
                <h3 className="font-bold text-lg mb-2">{listing.title}</h3>
                <p className="text-sm text-gray-600 mb-3">₦{listing.price_per_day.toLocaleString()} per day</p>

                <div className="space-y-2 text-sm mb-4">
                  <div>Total Bookings: {listing.total_bookings}</div>
                  <div>Completed: {listing.completed_bookings}</div>
                  <div>Rating: {listing.rating.toFixed(1)}⭐</div>
                </div>

                <div className="flex gap-2">
                  <Link href={`/listings/${listing.id}/edit`} className="flex-1">
                    <Button variant="outline" className="w-full bg-transparent">
                      Edit
                    </Button>
                  </Link>
                  <Link href={`/listings/${listing.id}`} className="flex-1">
                    <Button variant="outline" className="w-full bg-transparent">
                      View
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 text-center py-8">No listings yet. Create one to start earning!</p>
        )}
      </Card>
    </div>
  )
}
