"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getListing } from "@/app/actions/listing-actions"
import Link from "next/link"

export default function ListingDetailPage() {
  const params = useParams()
  const [listing, setListing] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchListing = async () => {
      const result = await getListing(params.id as string)
      if (result.success) {
        setListing(result.listing)
      }
      setLoading(false)
    }

    fetchListing()
  }, [params.id])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!listing) {
    return <div className="min-h-screen flex items-center justify-center">Listing not found</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Link href="/browse" className="text-blue-600 hover:underline mb-6">
          ← Back to Browse
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Images */}
          <div className="lg:col-span-2">
            {listing.image_urls && listing.image_urls.length > 0 ? (
              <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                <img
                  src={listing.image_urls[0] || "/placeholder.svg"}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">No Image</div>
            )}
          </div>

          {/* Details */}
          <div>
            <Card className="p-6">
              <h1 className="text-3xl font-bold mb-4">{listing.title}</h1>

              <div className="mb-6">
                <p className="text-4xl font-bold text-blue-600 mb-1">₦{listing.price_per_day.toLocaleString()}</p>
                <p className="text-gray-600">per day</p>
              </div>

              <div className="mb-6 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Rating:</span>
                  <span className="font-semibold">
                    {listing.rating.toFixed(1)} ⭐ ({listing.total_reviews})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Condition:</span>
                  <span className="font-semibold capitalize">{listing.condition}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Available:</span>
                  <span className="font-semibold">
                    {listing.available_quantity} of {listing.total_quantity}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Location:</span>
                  <span className="font-semibold">
                    {listing.city}, {listing.state}
                  </span>
                </div>
              </div>

              <div className="border-t pt-6 mb-6">
                <h3 className="font-bold mb-2">Host Information</h3>
                <p className="text-lg font-semibold">
                  {listing.first_name} {listing.last_name}
                </p>
                <p className="text-sm text-gray-600">Rating: {listing.host_rating.toFixed(1)} ⭐</p>
              </div>

              {listing.available ? (
                <Link href={`/bookings/create?listing=${listing.id}`}>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg">Book Now</Button>
                </Link>
              ) : (
                <Button disabled className="w-full bg-gray-400 text-white py-6 text-lg">
                  Not Available
                </Button>
              )}
            </Card>
          </div>
        </div>

        {/* Description */}
        <Card className="p-6 mt-8">
          <h2 className="text-2xl font-bold mb-4">Description</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{listing.description}</p>
        </Card>
      </div>
    </div>
  )
}
