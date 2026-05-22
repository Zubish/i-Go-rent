"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { searchListings, getCategories } from "@/app/actions/listing-actions"
import Link from "next/link"

export default function BrowseListingsPage() {
  const [listings, setListings] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    query: "",
    city: "",
    state: "",
    minPrice: "",
    maxPrice: "",
    category: "",
    page: 1,
  })
  const [pagination, setPagination] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      const categoriesResult = await getCategories()
      if (categoriesResult.success) {
        setCategories(categoriesResult.categories)
      }

      const searchParams: any = {
        page: filters.page,
      }

      if (filters.query) searchParams.query = filters.query
      if (filters.city) searchParams.city = filters.city
      if (filters.state) searchParams.state = filters.state
      if (filters.minPrice) searchParams.minPrice = Number(filters.minPrice)
      if (filters.maxPrice) searchParams.maxPrice = Number(filters.maxPrice)
      if (filters.category) searchParams.category = filters.category

      const listingsResult = await searchListings(searchParams)
      if (listingsResult.success) {
        setListings(listingsResult.listings)
        setPagination(listingsResult.pagination)
      }

      setLoading(false)
    }

    fetchData()
  }, [filters])

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFilters((prev) => ({ ...prev, [name]: value, page: 1 }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Browse Rentals</h1>

        {/* Filters */}
        <Card className="p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Search</label>
              <Input name="query" placeholder="Search items..." value={filters.query} onChange={handleFilterChange} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">City</label>
              <Input name="city" placeholder="Lagos, Abuja..." value={filters.city} onChange={handleFilterChange} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Min Price (₦)</label>
              <Input
                name="minPrice"
                type="number"
                placeholder="0"
                value={filters.minPrice}
                onChange={handleFilterChange}
              />
            </div>
          </div>
        </Card>

        {/* Listings Grid */}
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : listings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No listings found. Try adjusting your filters.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {listings.map((listing) => (
                <Card key={listing.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-square bg-gray-200 relative">
                    {listing.image_urls && listing.image_urls.length > 0 ? (
                      <img
                        src={listing.image_urls[0] || "/placeholder.svg"}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-2 line-clamp-2">{listing.title}</h3>

                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-2xl font-bold text-blue-600">₦{listing.price_per_day.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">per day</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{listing.rating.toFixed(1)}⭐</p>
                        <p className="text-sm text-gray-600">({listing.total_reviews})</p>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-2">
                      📍 {listing.city}, {listing.state}
                    </p>

                    <p className="text-sm text-gray-600 mb-4">
                      Host: {listing.first_name} {listing.last_name}
                    </p>

                    <Link href={`/listings/${listing.id}`}>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700">View Details</Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="flex justify-center gap-2 mb-8">
                {Array.from({ length: pagination.pages }).map((_, idx) => {
                  const pageNum = idx + 1
                  return (
                    <Button
                      key={pageNum}
                      onClick={() => setFilters((prev) => ({ ...prev, page: pageNum }))}
                      variant={pagination.page === pageNum ? "default" : "outline"}
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
