"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  MapPin,
  ShieldCheck,
  Star,
  Truck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  formatNaira,
  maxListingImages,
  type DemoListing,
} from "@/lib/demo-marketplace";

export default function ListingDetailPage() {
  const params = useParams();
  const [listing, setListing] = useState<DemoListing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadListing() {
      setLoading(true);
      try {
        const response = await fetch(`/api/listings/${params.id}`, {
          cache: "no-store",
        });
        const data = await response.json();
        setListing(response.ok ? data.listing : null);
      } catch {
        setListing(null);
      } finally {
        setLoading(false);
      }
    }

    if (params.id) loadListing();
  }, [params.id]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7fbfb] p-6">
        <Card className="max-w-md rounded-lg p-8 text-center">
          <p className="text-lg font-semibold">Loading listing...</p>
        </Card>
      </main>
    );
  }

  if (!listing) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7fbfb] p-6">
        <Card className="max-w-md rounded-lg p-8 text-center">
          <p className="text-lg font-semibold">Listing not found</p>
          <Button
            asChild
            className="mt-5 bg-[#071b2f] text-white hover:bg-[#0b2b49]"
          >
            <Link href="/browse">Back to marketplace</Link>
          </Button>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7fbfb]">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/browse"
            className="flex items-center gap-2 text-sm font-medium text-slate-700"
          >
            <ArrowLeft className="size-4" /> Marketplace
          </Link>
          <Button asChild className="bg-teal-500 text-white hover:bg-teal-600">
            <Link href={`/bookings/create?listing=${listing.id}`}>
              Book now
            </Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8">
        <div>
          <div className="grid gap-3 md:grid-cols-[1fr_0.42fr]">
            <img
              src={listing.images[0]}
              alt={listing.title}
              className="h-80 w-full rounded-lg object-cover md:h-[520px]"
            />
            <div className="grid gap-3">
              {(listing.images.length > 1
                ? listing.images.slice(1, 3)
                : listing.images
              ).map((image, index) => (
                <img
                  key={image + index}
                  src={image}
                  alt=""
                  className="h-40 w-full rounded-lg object-cover md:h-full"
                />
              ))}
            </div>
          </div>
          {listing.images.length > 3 && (
            <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5">
              {listing.images.slice(3, maxListingImages).map((image, index) => (
                <img
                  key={image + index}
                  src={image}
                  alt=""
                  className="h-24 w-full rounded-lg object-cover"
                />
              ))}
            </div>
          )}

          <Card className="mt-6 rounded-lg border-slate-200 bg-white p-6">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{listing.category}</Badge>
              <Badge variant="outline">{listing.condition}</Badge>
              {listing.vendorVerified && (
                <Badge className="bg-teal-50 text-teal-700">
                  Verified vendor
                </Badge>
              )}
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-normal text-slate-950 sm:text-4xl">
              {listing.title}
            </h1>
            <p className="mt-4 leading-7 text-slate-600">
              {listing.description}
            </p>
            <p className="mt-3 text-sm text-slate-500">
              {listing.images.slice(0, maxListingImages).length} of{" "}
              {maxListingImages} allowed listing photos shown.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-md bg-slate-50 p-4">
                <p className="text-xs text-slate-500">Vendor</p>
                <p className="mt-1 font-semibold">{listing.vendorName}</p>
              </div>
              <div className="rounded-md bg-slate-50 p-4">
                <p className="text-xs text-slate-500">Rating</p>
                <p className="mt-1 flex items-center gap-1 font-semibold">
                  <Star className="size-4 fill-amber-400 text-amber-400" />{" "}
                  {listing.rating} ({listing.reviews})
                </p>
              </div>
              <div className="rounded-md bg-slate-50 p-4">
                <p className="text-xs text-slate-500">Area</p>
                <p className="mt-1 font-semibold">{listing.vendorArea}</p>
              </div>
            </div>

            <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-5">
              <h2 className="font-semibold">Item condition record</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <ConditionDetail
                  label="Current condition"
                  value={listing.condition}
                />
                <ConditionDetail
                  label="Replacement value"
                  value={formatNaira(listing.replacementValue)}
                />
                <ConditionDetail
                  label="Late return fee"
                  value={`${formatNaira(listing.lateReturnFee)} / day`}
                />
                <ConditionDetail
                  label="Maximum rental"
                  value={`${listing.maxRentalDays} days`}
                />
              </div>
              <div className="mt-4 space-y-4">
                <ConditionDetail
                  label="Known defects"
                  value={listing.knownDefects}
                />
                <ConditionDetail
                  label="Accessories included"
                  value={listing.accessories}
                />
                <ConditionDetail
                  label="Usage limits"
                  value={listing.usageLimits}
                />
              </div>
            </div>

            <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-5 text-amber-950">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-1 size-5" />
                <div>
                  <h2 className="font-semibold">Condition protection</h2>
                  <p className="mt-2 text-sm leading-6">
                    Vendors must disclose current condition, known defects,
                    missing accessories, and usage limits. Renters should
                    confirm condition on receipt before use. Misuse, damage,
                    missing parts, or late return can lead to deposit
                    deductions, while unclear vendor condition notes can weaken
                    a vendor's dispute claim.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h2 className="font-semibold">Included in this rental</h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {listing.included.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 text-sm text-slate-600"
                  >
                    <ShieldCheck className="size-4 text-teal-600" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card className="rounded-lg border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60">
            <p className="text-sm text-slate-500">Daily rental</p>
            <p className="mt-1 text-3xl font-semibold">
              {formatNaira(listing.pricePerDay)}
            </p>
            <div className="mt-5 space-y-3 border-t pt-5 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-slate-600">Security deposit</span>
                <span className="font-semibold">
                  {formatNaira(listing.securityDeposit)}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-600">Max rental</span>
                <span className="font-semibold">
                  {listing.maxRentalDays} days
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-600">Late fee</span>
                <span className="font-semibold">
                  {formatNaira(listing.lateReturnFee)} / day
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-600">Escrow model</span>
                <span className="font-semibold text-teal-700">
                  Virtual hold
                </span>
              </div>
              <div className="flex items-start gap-2 rounded-md bg-teal-50 p-3 text-teal-900">
                <ShieldCheck className="mt-0.5 size-4" />
                <p>
                  Funds remain marked as held until the vendor confirms returned
                  and inspected.
                </p>
              </div>
            </div>
            <Button
              asChild
              size="lg"
              className="mt-6 w-full bg-[#071b2f] text-white hover:bg-[#0b2b49]"
            >
              <Link href={`/bookings/create?listing=${listing.id}`}>
                <CalendarDays /> Choose dates
              </Link>
            </Button>
          </Card>

          <Card className="mt-5 rounded-lg border-slate-200 bg-white p-5">
            <div className="flex items-start gap-3">
              <MapPin className="mt-1 size-5 text-teal-600" />
              <div>
                <p className="font-semibold">Pickup location</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {listing.location}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-start gap-3">
              <Truck className="mt-1 size-5 text-teal-600" />
              <div>
                <p className="font-semibold">i.Go-Logistics coverage</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {listing.deliveryArea}
                </p>
              </div>
            </div>
            {listing.vendorVerified && (
              <div className="mt-4 flex items-center gap-2 rounded-md bg-slate-950 p-3 text-sm text-white">
                <BadgeCheck className="size-4 text-teal-300" />
                NIN/BVN profile complete
              </div>
            )}
          </Card>
        </aside>
      </section>
    </main>
  );
}

function ConditionDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold leading-6 text-slate-900">
        {value}
      </p>
    </div>
  );
}
