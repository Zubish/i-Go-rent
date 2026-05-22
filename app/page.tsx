import Link from "next/link"
import { ArrowRight, BadgeCheck, CalendarDays, CircleDollarSign, MapPin, ShieldCheck, Truck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { categories, formatNaira, seedListings } from "@/lib/demo-marketplace"

const trustStats = [
  ["2,400+", "verified rentals"],
  ["24 hrs", "average vendor response"],
  ["98%", "escrow-safe returns"],
]

export default function Home() {
  const featured = seedListings.slice(0, 3)

  return (
    <main className="min-h-screen bg-[#f7fbfb] text-slate-950">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#071b2f]/95 text-white backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-md bg-teal-400 font-black text-[#071b2f]">
              iG
            </span>
            <span className="text-xl font-semibold tracking-normal">i.Go-rent</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-slate-200 md:flex">
            <Link href="/browse" className="hover:text-white">
              Browse
            </Link>
            <Link href="/dashboard" className="hover:text-white">
              Dashboard
            </Link>
            <Link href="/signup?role=vendor" className="hover:text-white">
              Become a vendor
            </Link>
            <Link href="/signup?role=logistics" className="hover:text-white">
              Logistics
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="hidden text-white hover:bg-white/10 hover:text-white sm:inline-flex">
              <Link href="/signin">Sign in</Link>
            </Button>
            <Button asChild className="bg-teal-400 text-[#071b2f] hover:bg-teal-300">
              <Link href="/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="bg-[#071b2f] text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-20">
          <div className="flex flex-col justify-center">
            <Badge className="mb-5 w-fit border-teal-300/30 bg-teal-300/10 text-teal-100">
              Built for Lagos rentals
            </Badge>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-normal sm:text-5xl lg:text-6xl">
              Rent verified gear, event equipment, and transport with escrow confidence.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              i.Go-rent helps Lagos renters book from trusted vendors, pay rental fees plus deposits, and keep funds in
              virtual escrow until items are returned and inspected.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="bg-teal-400 text-[#071b2f] hover:bg-teal-300">
                <Link href="/browse">
                  Find rentals <ArrowRight />
                </Link>
              </Button>
            <Button asChild size="lg" variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
              <Link href="/signup?role=vendor">List an item</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
              <Link href="/signup?role=logistics">Join logistics</Link>
            </Button>
            </div>
            <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
              {trustStats.map(([value, label]) => (
                <div key={label} className="rounded-md border border-white/10 bg-white/5 p-4">
                  <p className="text-2xl font-semibold text-teal-200">{value}</p>
                  <p className="mt-1 text-xs text-slate-300">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-lg border border-white/10 bg-white shadow-2xl shadow-black/30">
              <img
                src="https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1400&q=80"
                alt="Lagos event rental setup"
                className="h-72 w-full object-cover sm:h-96"
              />
              <div className="grid gap-4 p-5 text-slate-950 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <div className="flex items-center gap-2">
                    <BadgeCheck className="size-5 text-teal-600" />
                    <span className="text-sm font-medium text-teal-700">Verified vendor</span>
                  </div>
                  <h2 className="mt-2 text-2xl font-semibold">Professional Sound System</h2>
                  <p className="mt-2 text-sm text-slate-600">Lekki vendor, escrow-backed deposit, logistics optional.</p>
                </div>
                <div className="rounded-md bg-slate-950 p-4 text-white">
                  <p className="text-xs text-slate-300">Today from</p>
                  <p className="mt-1 text-xl font-semibold">{formatNaira(45000)}</p>
                  <p className="mt-2 text-xs text-teal-200">+ protected deposit</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            [ShieldCheck, "Virtual escrow", "Rental fee and deposit are tracked separately until return inspection."],
            [Truck, "Lagos logistics", "Choose self-pickup or i.Go-Logistics dispatch with registered providers."],
            [BadgeCheck, "Vendor verification", "NIN/BVN profile completion unlocks visible verified badges."],
          ].map(([Icon, title, body]) => (
            <Card key={title as string} className="rounded-lg border-slate-200 bg-white p-6 shadow-sm">
              <Icon className="size-6 text-teal-600" />
              <h3 className="mt-4 text-lg font-semibold">{title as string}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{body as string}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-teal-700">Marketplace categories</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-normal">Everything Lagos rents often</h2>
          </div>
          <Button asChild variant="outline" className="w-fit bg-white">
            <Link href="/browse">View marketplace</Link>
          </Button>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {categories.map((category) => (
            <Link key={category.name} href={`/browse?category=${category.name}`}>
              <Card className="h-full rounded-lg border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:border-teal-200 hover:shadow-lg">
                <p className="text-sm font-semibold text-teal-700">{category.name}</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">{category.description}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-teal-700">Featured rentals</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-normal">Ready-to-book vendor listings</h2>
          </div>
        </div>
        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          {featured.map((listing) => (
            <Card key={listing.id} className="overflow-hidden rounded-lg border-slate-200 bg-white shadow-sm">
              <img src={listing.images[0]} alt={listing.title} className="h-48 w-full object-cover" />
              <div className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <Badge variant="secondary">{listing.category}</Badge>
                  {listing.vendorVerified && <Badge className="bg-teal-50 text-teal-700">Verified</Badge>}
                </div>
                <h3 className="mt-4 text-xl font-semibold">{listing.title}</h3>
                <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                  <MapPin className="size-4" />
                  {listing.vendorArea}
                </div>
                <div className="mt-5 flex items-end justify-between">
                  <div>
                    <p className="text-xs text-slate-500">Daily rental</p>
                    <p className="text-lg font-semibold">{formatNaira(listing.pricePerDay)}</p>
                  </div>
                  <Button asChild className="bg-[#071b2f] text-white hover:bg-[#0b2b49]">
                    <Link href={`/listings/${listing.id}`}>Book</Link>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-14 sm:px-6 md:grid-cols-3 lg:px-8">
          {[
            [CalendarDays, "Select dates", "Choose your rental window and confirm item availability."],
            [CircleDollarSign, "Pay into escrow", "Rental fee, deposit, and optional logistics are simulated as held."],
            [ShieldCheck, "Return and release", "Vendor marks returned and inspected before funds/deposit settle."],
          ].map(([Icon, title, body]) => (
            <div key={title as string} className="rounded-lg border border-slate-200 p-6">
              <Icon className="size-6 text-teal-600" />
              <h3 className="mt-4 text-lg font-semibold">{title as string}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{body as string}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="bg-[#071b2f] px-4 py-8 text-sm text-slate-300 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-semibold text-white">i.Go-rent</p>
          <p>Professional rental marketplace for Lagos vendors and renters.</p>
        </div>
      </footer>
    </main>
  )
}
