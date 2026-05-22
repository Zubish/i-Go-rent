"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MapPin, Star } from "lucide-react"

const featuredListings = [
  {
    id: 1,
    name: "Canon EOS R5 Camera",
    category: "Photo Gear",
    price: 15000,
    location: "Lagos",
    rating: 4.9,
    reviews: 28,
    image: "📷",
  },
  {
    id: 2,
    name: "Toyota Camry 2022",
    category: "Vehicles",
    price: 25000,
    location: "Lagos",
    rating: 4.8,
    reviews: 45,
    image: "🚗",
  },
  {
    id: 3,
    name: "Premium BBQ Grill",
    category: "Grills",
    price: 5000,
    location: "Lagos",
    rating: 4.9,
    reviews: 32,
    image: "🔥",
  },
  {
    id: 4,
    name: "Luxury Yacht",
    category: "Boats",
    price: 50000,
    location: "Lagos",
    rating: 5.0,
    reviews: 12,
    image: "⛵",
  },
]

export function FeaturedListings() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h2 className="text-4xl font-bold text-center mb-12">Featured Rentals</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {featuredListings.map((listing) => (
          <div
            key={listing.id}
            className="bg-white rounded-xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
          >
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 h-40 flex items-center justify-center">
              <div className="text-6xl">{listing.image}</div>
            </div>

            <div className="p-5">
              <h3 className="font-semibold text-lg mb-1">{listing.name}</h3>
              <p className="text-sm text-gray-500 mb-3">{listing.category}</p>

              <div className="flex items-center gap-1 mb-3">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">{listing.rating}</span>
                <span className="text-sm text-gray-500">({listing.reviews})</span>
              </div>

              <div className="flex items-center gap-1 text-gray-600 text-sm mb-4">
                <MapPin className="w-4 h-4" />
                {listing.location}
              </div>

              <div className="flex justify-between items-center">
                <div className="text-2xl font-bold text-blue-600">₦{listing.price.toLocaleString()}</div>
                <span className="text-sm text-gray-500">/day</span>
              </div>

              <Link href={`/listings/${listing.id}`}>
                <Button className="w-full mt-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white">
                  Rent Now
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
