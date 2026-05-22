"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { BadgeCheck, CalendarDays, MapPin, Search, ShieldCheck, SlidersHorizontal } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { categories, formatNaira, type DemoListing } from "@/lib/demo-marketplace"

export default function BrowseListingsPage() {
  const [listings, setListings] = useState<DemoListing[]>([])
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("All")
  const [area, setArea] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const initialCategory = params.get("category")
    if (initialCategory) setCategory(initialCategory)

    async function loadListings() {
      setLoading(true)
      try {
        const response = await fetch("/api/listings", { cache: "no-store" })
        const data = await response.json()
        setListings(Array.isArray(data.listings) ? data.listings : [])
      } catch {
        setListings([])
      } finally {
        setLoading(false)
      }
    }

    loadListings()
  }, [])

  const filteredListings = useMemo(() => {
    return listings.filter((listing) => {
      const searchText = `${listing.title} ${listing.description} ${listing.vendorName} ${listing.location}`.toLowerCase()
      const matchesQuery = !query || searchText.includes(query.toLowerCase())
      const matchesCategory = category === "All" || listing.category === category
      const matchesArea = !area || listing.location.toLowerCase().includes(area.toLowerCase()) || listing.vendorArea.toLowerCase().includes(area.toLowerCase())
      return matchesQuery && matchesCategory && matchesArea
    })
  }, [area, category, listings, query])

  return (
    <main className="min-h-screen bg-[#f7fbfb]">
      <header className="border-b bg-[#071b2f] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-lg font-semibold">
            i.Go-rent
          </Link>
          <div className="flex gap-2">
            <Button asChild variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <Button asChild className="bg-teal-400 text-[#071b2f] hover:bg-teal-300">
              <Link href="/signup?role=vendor">List item</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
          <div>
            <Badge className="mb-4 bg-teal-50 text-teal-700">Lagos marketplace</Badge>
            <h1 className="text-4xl font-semibold tracking-normal text-slate-950">Find rentals with deposit protection.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Search event equipment, transport, and creator gear. Every checkout shows rental fee, security deposit,
              delivery option, and virtual escrow status.
            </p>
          </div>

          <Card className="rounded-lg border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="sm:col-span-2 lg:col-span-4">
                <span className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-600">
                  <Search className="size-4" /> Search item or vendor
                </span>
                <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Professional Sound System" />
              </label>
              <label>
                <span className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-600">
                  <SlidersHorizontal className="size-4" /> Category
                </span>
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option>All</option>
                  {categories.map((item) => (
                    <option key={item.name}>{item.name}</option>
                  ))}
                </select>
              </label>
              <label>
                <span className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-600">
                  <MapPin className="size-4" /> Area
                </span>
                <Input value={area} onChange={(event) => setArea(event.target.value)} placeholder="Lekki" />
              </label>
              <label>
                <span className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-600">
                  <CalendarDays className="size-4" /> From
                </span>
                <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
              </label>
              <label>
                <span className="mb-2 text-xs font-medium text-slate-600">To</span>
                <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
              </label>
            </div>
          </Card>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <p className="text-sm text-slate-600">
            Showing <span className="font-semibold text-slate-950">{filteredListings.length}</span> rentals
          </p>
          {startDate && endDate && <Badge variant="outline">Dates selected</Badge>}
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredListings.map((listing) => (
            <Card key={listing.id} className="overflow-hidden rounded-lg border-slate-200 bg-white shadow-sm">
              <Link href={`/listings/${listing.id}`}>
                <img src={listing.images[0]} alt={listing.title} className="h-52 w-full object-cover" />
              </Link>
              <div className="p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{listing.category}</Badge>
                  {listing.vendorVerified && (
                    <Badge className="bg-teal-50 text-teal-700">
                      <BadgeCheck /> Verified vendor
                    </Badge>
                  )}
                </div>
                <Link href={`/listings/${listing.id}`}>
                  <h2 className="mt-4 text-xl font-semibold tracking-normal hover:text-teal-700">{listing.title}</h2>
                </Link>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{listing.description}</p>
                <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
                  <MapPin className="size-4" />
                  {listing.location}
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 rounded-md bg-slate-50 p-3">
                  <div>
                    <p className="text-xs text-slate-500">Daily rental</p>
                    <p className="font-semibold">{formatNaira(listing.pricePerDay)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Deposit</p>
                    <p className="font-semibold">{formatNaira(listing.securityDeposit)}</p>
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <ShieldCheck className="size-4 text-teal-600" />
                    Escrow ready
                  </div>
                  <Button asChild className="bg-[#071b2f] text-white hover:bg-[#0b2b49]">
                    <Link href={`/listings/${listing.id}`}>View</Link>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {loading && (
          <Card className="mt-8 rounded-lg border-slate-200 bg-white p-10 text-center">
            <p className="font-semibold">Loading Lagos rentals...</p>
          </Card>
        )}

        {!loading && filteredListings.length === 0 && (
          <Card className="mt-8 rounded-lg border-slate-200 bg-white p-10 text-center">
            <p className="font-semibold">No matching rentals yet</p>
            <p className="mt-2 text-sm text-slate-600">Try a broader Lagos area or another category.</p>
          </Card>
        )}
      </section>
    </main>
  )
}
