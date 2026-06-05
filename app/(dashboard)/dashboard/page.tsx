"use client";

import type React from "react";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BadgeCheck,
  CalendarCheck,
  CircleDollarSign,
  PackagePlus,
  ShieldCheck,
  Truck,
} from "lucide-react";

import { signOut } from "@/app/actions/auth-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  categories,
  formatNaira,
  getKycStatus,
  getRoleLabel,
  legalUseWarning,
  maxListingImageSizeMb,
  type DemoBooking,
  type DemoListing,
  type DemoUser,
  type UserRole,
} from "@/lib/demo-marketplace";
import { getDemoSession, signOutDemo } from "@/lib/demo-client-store";

const dashboardRoles: UserRole[] = ["renter", "vendor", "logistics"];

const defaultListingForm = {
  title: "Professional Sound System",
  category: "Events" as DemoListing["category"],
  description:
    "Complete party and corporate-event audio setup with two speakers, mixer, wireless microphones, stands, and setup support.",
  pricePerDay: "45000",
  securityDeposit: "80000",
  location: "Admiralty Way, Lekki Phase 1",
  deliveryArea: "Lekki, VI, Ikoyi, Ajah",
  condition: "Excellent" as DemoListing["condition"],
  knownDefects:
    "Minor scuff marks on speaker stands; mixer and microphones are fully functional.",
  accessories:
    "2 powered speakers, mixer, 2 wireless microphones, stands, XLR cables, power cables.",
  usageLimits:
    "Indoor or covered outdoor use only. Not for rain exposure or generator overload.",
  replacementValue: "650000",
  lateReturnFee: "15000",
  maxRentalDays: "5",
  imageUrls:
    "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80, https://images.unsplash.com/photo-1505236858219-8359eb29e329?auto=format&fit=crop&w=1200&q=80",
};

export default function DashboardPage() {
  const [session, setSession] = useState<DemoUser | null>(null);
  const [role, setRole] = useState<UserRole>("renter");
  const [listings, setListings] = useState<DemoListing[]>([]);
  const [bookings, setBookings] = useState<DemoBooking[]>([]);
  const [form, setForm] = useState(defaultListingForm);
  const [createdListingId, setCreatedListingId] = useState("");
  const [listingError, setListingError] = useState("");
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [marketplaceNotice, setMarketplaceNotice] = useState("");

  useEffect(() => {
    async function hydrateSession() {
      const params = new URLSearchParams(window.location.search);
      const queryRole = params.get("role");
      const localUser = getDemoSession();
      let user = localUser;

      try {
        const response = await fetch("/api/auth/session", {
          cache: "no-store",
        });
        if (response.ok) {
          const data = await response.json();
          if (data.user) user = data.user;
        }
      } catch {
        user = localUser;
      }

      const activeRole =
        queryRole === "vendor" || queryRole === "logistics"
          ? queryRole
          : user?.role === "vendor" || user?.role === "logistics"
            ? user.role
            : "renter";

      setSession(user);
      setRole(activeRole);
      await hydrateRecords(activeRole);
    }

    async function hydrateRecords(activeRole: UserRole) {
      setLoadingRecords(true);
      try {
        const [listingResponse, bookingResponse] = await Promise.all([
          fetch("/api/listings", { cache: "no-store" }),
          fetch(`/api/bookings?role=${activeRole}`, { cache: "no-store" }),
        ]);
        const [listingData, bookingData] = await Promise.all([
          listingResponse.json(),
          bookingResponse.json(),
        ]);
        setListings(
          Array.isArray(listingData.listings) ? listingData.listings : [],
        );
        setMarketplaceNotice(
          listingData.degraded || listingData.source === "seeded_fallback"
            ? "Marketplace is showing curated seed listings while the production database is being restored."
            : "",
        );
        setBookings(
          Array.isArray(bookingData.bookings) ? bookingData.bookings : [],
        );
      } catch {
        setListings([]);
        setBookings([]);
        setMarketplaceNotice("Marketplace records could not be loaded.");
      } finally {
        setLoadingRecords(false);
      }
    }

    hydrateSession();
  }, []);

  useEffect(() => {
    async function refreshBookingsForRole() {
      try {
        const response = await fetch(`/api/bookings?role=${role}`, {
          cache: "no-store",
        });
        const data = await response.json();
        setBookings(Array.isArray(data.bookings) ? data.bookings : []);
      } catch {
        setBookings([]);
      }
    }

    refreshBookingsForRole();
  }, [role]);

  const vendorListings = useMemo(() => {
    if (!session) return [];
    return listings.filter(
      (listing) =>
        listing.vendorId === session.id ||
        listing.vendorName === `${session.firstName} ${session.lastName}`,
    );
  }, [listings, session]);

  const activeBookings = bookings.filter(
    (booking) => booking.escrowStatus === "held",
  );
  const dispatchBookings = bookings.filter((booking) => booking.dispatch);
  const visibleDispatchBookings = dispatchBookings;
  const totalEscrow = bookings.reduce(
    (sum, booking) => sum + booking.totalPaid,
    0,
  );
  const activeKyc = getKycStatus(session, role);
  const vendorKyc = getKycStatus(session, "vendor");

  const handleListingChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateListing = async (event: React.FormEvent) => {
    event.preventDefault();
    setListingError("");

    try {
      const response = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          category: form.category,
          description: form.description,
          pricePerDay: Number(form.pricePerDay),
          securityDeposit: Number(form.securityDeposit),
          location: form.location,
          deliveryArea: form.deliveryArea,
          condition: form.condition,
          knownDefects: form.knownDefects,
          accessories: form.accessories,
          usageLimits: form.usageLimits,
          replacementValue: Number(form.replacementValue),
          lateReturnFee: Number(form.lateReturnFee),
          maxRentalDays: Number(form.maxRentalDays),
          imageUrls: form.imageUrls,
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.listing) {
        setListingError(data.error || "Could not create listing");
        return;
      }

      const listing = data.listing as DemoListing;
      setCreatedListingId(listing.id);
      setListings((current) => [
        listing,
        ...current.filter((item) => item.id !== listing.id),
      ]);
    } catch (error) {
      setListingError(
        error instanceof Error ? error.message : "Could not create listing",
      );
    }
  };

  const handleSignOut = async () => {
    await signOut();
    signOutDemo();
    setSession(null);
  };

  return (
    <main className="min-h-screen bg-[#f7fbfb]">
      <header className="border-b bg-[#071b2f] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="font-semibold">
            i.Go-rent
          </Link>
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="ghost"
              className="text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="/browse">Browse</Link>
            </Button>
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="border-white/20 bg-transparent text-white hover:bg-white/10"
            >
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <Badge className="bg-teal-50 text-teal-700">
              {getRoleLabel(role)} workspace
            </Badge>
            <h1 className="mt-3 text-4xl font-semibold tracking-normal text-slate-950">
              {session ? `Welcome, ${session.firstName}` : "Dashboard"}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Manage listings, bookings, dispatch assignments, and escrow states
              for the Lagos rental flow.
            </p>
          </div>
          <div className="grid grid-cols-3 rounded-lg bg-white p-1 shadow-sm">
            {dashboardRoles.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRole(value)}
                className={`rounded-md px-5 py-2 text-sm font-medium ${
                  role === value ? "bg-[#071b2f] text-white" : "text-slate-600"
                }`}
              >
                {value === "logistics" ? "Logistics" : getRoleLabel(value)}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Metric
            icon={CalendarCheck}
            label="Bookings"
            value={bookings.length.toString()}
          />
          <Metric
            icon={ShieldCheck}
            label="KYC status"
            value={activeKyc.label}
          />
          <Metric
            icon={role === "logistics" ? Truck : CircleDollarSign}
            label={
              role === "logistics" ? "Dispatch jobs" : "Total booking value"
            }
            value={
              role === "logistics"
                ? dispatchBookings.length.toString()
                : formatNaira(totalEscrow)
            }
          />
        </div>

        {marketplaceNotice && (
          <div
            className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"
            role="status"
            aria-live="polite"
          >
            {marketplaceNotice}
          </div>
        )}

        {role === "vendor" ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <Card className="rounded-lg border-slate-200 bg-white p-6">
              <h2 className="flex items-center gap-2 text-xl font-semibold">
                <PackagePlus className="size-5 text-teal-600" /> Add rental
                listing
              </h2>
              <form onSubmit={handleCreateListing} className="mt-5 space-y-4">
                <KycPanel
                  title="Vendor publishing access"
                  status={vendorKyc.label}
                  missing={vendorKyc.missing}
                  successCopy="Vendor KYC is sufficient to publish listings."
                  blockedCopy="Complete vendor KYC before publishing rental inventory."
                />
                <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-950">
                  {legalUseWarning} Clearly state the item's current condition.
                  Missing or vague condition details can weaken a vendor's
                  dispute protection.
                </div>
                <Input
                  name="title"
                  value={form.title}
                  onChange={handleListingChange}
                  placeholder="Listing title"
                  required
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleListingChange}
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {categories.map((category) => (
                      <option key={category.name}>{category.name}</option>
                    ))}
                  </select>
                  <select
                    name="condition"
                    value={form.condition}
                    onChange={handleListingChange}
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option>New</option>
                    <option>Excellent</option>
                    <option>Good</option>
                  </select>
                </div>
                <Textarea
                  name="description"
                  value={form.description}
                  onChange={handleListingChange}
                  rows={4}
                />
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">
                    Condition contract
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    This record is shown to renters before checkout and saved on
                    the booking for dispute review.
                  </p>
                  <div className="mt-4 space-y-3">
                    <Textarea
                      name="knownDefects"
                      value={form.knownDefects}
                      onChange={handleListingChange}
                      rows={3}
                      placeholder="Known defects, scratches, missing parts, age, or wear"
                      required
                    />
                    <Textarea
                      name="accessories"
                      value={form.accessories}
                      onChange={handleListingChange}
                      rows={2}
                      placeholder="Included accessories and parts"
                      required
                    />
                    <Textarea
                      name="usageLimits"
                      value={form.usageLimits}
                      onChange={handleListingChange}
                      rows={2}
                      placeholder="Usage limits and handling instructions"
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    name="pricePerDay"
                    type="number"
                    value={form.pricePerDay}
                    onChange={handleListingChange}
                    placeholder="Daily price"
                    required
                  />
                  <Input
                    name="securityDeposit"
                    type="number"
                    value={form.securityDeposit}
                    onChange={handleListingChange}
                    placeholder="Security deposit"
                    required
                  />
                  <Input
                    name="replacementValue"
                    type="number"
                    value={form.replacementValue}
                    onChange={handleListingChange}
                    placeholder="Replacement value"
                    required
                  />
                  <Input
                    name="lateReturnFee"
                    type="number"
                    value={form.lateReturnFee}
                    onChange={handleListingChange}
                    placeholder="Late return fee / day"
                    required
                  />
                  <Input
                    name="maxRentalDays"
                    type="number"
                    value={form.maxRentalDays}
                    onChange={handleListingChange}
                    placeholder="Max rental days"
                    required
                  />
                </div>
                <Input
                  name="location"
                  value={form.location}
                  onChange={handleListingChange}
                  placeholder="Pickup location"
                  required
                />
                <Input
                  name="deliveryArea"
                  value={form.deliveryArea}
                  onChange={handleListingChange}
                  placeholder="Delivery coverage"
                  required
                />
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Photo URLs, up to 10
                  </span>
                  <Textarea
                    name="imageUrls"
                    value={form.imageUrls}
                    onChange={handleListingChange}
                    rows={3}
                    placeholder={`Separate image URLs with commas. Production uploads should cap files at ${maxListingImageSizeMb} MB each.`}
                  />
                </label>
                {listingError && (
                  <div
                    className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                    role="alert"
                  >
                    {listingError}
                  </div>
                )}
                <Button
                  disabled={!vendorKyc.canList}
                  className="w-full bg-teal-500 text-white hover:bg-teal-600"
                >
                  Save listing
                </Button>
              </form>
              {createdListingId && (
                <div
                  className="mt-4 rounded-md bg-teal-50 p-4 text-sm text-teal-900"
                  role="status"
                  aria-live="polite"
                >
                  Listing created.{" "}
                  <Link
                    className="font-semibold underline"
                    href={`/listings/${createdListingId}`}
                  >
                    View it
                  </Link>
                  .
                </div>
              )}
            </Card>

            <Card className="rounded-lg border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Vendor listings</h2>
                {session?.verified && (
                  <Badge className="bg-teal-50 text-teal-700">
                    <BadgeCheck /> Verified
                  </Badge>
                )}
              </div>
              <div className="mt-5 space-y-4">
                {loadingRecords && (
                  <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-600">
                    Loading listings...
                  </p>
                )}
                {(vendorListings.length
                  ? vendorListings
                  : listings.slice(0, 2)
                ).map((listing) => (
                  <ListingRow key={listing.id} listing={listing} />
                ))}
              </div>
            </Card>
          </div>
        ) : role === "logistics" ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <Card className="rounded-lg border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-semibold">Provider profile</h2>
                {session?.verified ? (
                  <Badge className="bg-teal-50 text-teal-700">
                    <BadgeCheck /> Logistics verified
                  </Badge>
                ) : (
                  <Badge variant="outline">KYC pending</Badge>
                )}
              </div>
              <div className="mt-5 space-y-3 text-sm">
                <InfoLine
                  label="Provider"
                  value={
                    session?.businessName ||
                    `${session?.firstName || "Demo"} ${session?.lastName || "Provider"}`
                  }
                />
                <InfoLine
                  label="Contact phone"
                  value={session?.phone || "Not set"}
                />
                <InfoLine
                  label="Vehicle"
                  value={session?.vehicleType || "Pending vehicle"}
                />
                <InfoLine
                  label="Plate number"
                  value={session?.plateNumber || "Pending plate"}
                />
                <InfoLine
                  label="Coverage"
                  value={session?.coverageArea || session?.area || "Lagos"}
                />
              </div>
              <KycPanel
                title="Dispatch access"
                status={activeKyc.label}
                missing={activeKyc.missing}
                successCopy="Provider KYC is sufficient to receive dispatch jobs."
                blockedCopy="Complete logistics KYC before receiving i.Go-Logistics assignments."
              />
              <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
                Logistics providers must not knowingly transport illegal,
                restricted, stolen, counterfeit, dangerous, or illicit items.
                Suspicious dispatches should be rejected or escalated before
                pickup.
              </div>
            </Card>

            <Card className="rounded-lg border-slate-200 bg-white p-6">
              <h2 className="text-xl font-semibold">
                Assigned i.Go-Logistics dispatches
              </h2>
              <div className="mt-5 space-y-4">
                {loadingRecords ? (
                  <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center">
                    <p className="font-semibold">Loading dispatches...</p>
                  </div>
                ) : visibleDispatchBookings.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center">
                    <p className="font-semibold">No dispatches assigned yet</p>
                    <p className="mt-2 text-sm text-slate-600">
                      When a renter chooses i.Go-Logistics, assigned pickup and
                      delivery jobs will appear here.
                    </p>
                  </div>
                ) : (
                  visibleDispatchBookings.map((booking) => (
                    <Link key={booking.id} href={`/bookings/${booking.id}`}>
                      <div className="rounded-lg border border-slate-200 p-4 transition hover:border-teal-300">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="font-semibold">{booking.title}</p>
                          <Badge className="bg-teal-50 text-teal-700">
                            {booking.dispatch?.status.replaceAll("_", " ")}
                          </Badge>
                        </div>
                        <div className="mt-3 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                          <InfoLine
                            label="Pickup"
                            value={booking.dispatch?.pickupArea || "Pending"}
                          />
                          <InfoLine
                            label="Delivery"
                            value={booking.dispatch?.deliveryArea || "Pending"}
                          />
                          <InfoLine
                            label="Vendor"
                            value={
                              booking.dispatch?.vendorContact.name ||
                              booking.vendorName
                            }
                          />
                          <InfoLine
                            label="Renter"
                            value={
                              booking.dispatch?.renterContact.name ||
                              booking.renterName
                            }
                          />
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </Card>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.85fr]">
            <Card className="rounded-lg border-slate-200 bg-white p-6">
              <h2 className="text-xl font-semibold">My bookings</h2>
              <KycPanel
                title="Booking access"
                status={activeKyc.label}
                missing={activeKyc.missing}
                successCopy="Renter KYC is sufficient for standard bookings."
                blockedCopy="Complete phone and NIN verification before booking rentals."
              />
              <div className="mt-5 space-y-4">
                {loadingRecords ? (
                  <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center">
                    <p className="font-semibold">Loading bookings...</p>
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center">
                    <p className="font-semibold">No bookings yet</p>
                    <p className="mt-2 text-sm text-slate-600">
                      Search for Professional Sound System to complete the
                      success path.
                    </p>
                    <Button
                      asChild
                      className="mt-5 bg-[#071b2f] text-white hover:bg-[#0b2b49]"
                    >
                      <Link href="/browse">Browse rentals</Link>
                    </Button>
                  </div>
                ) : (
                  bookings.map((booking) => (
                    <Link key={booking.id} href={`/bookings/${booking.id}`}>
                      <div className="rounded-lg border border-slate-200 p-4 transition hover:border-teal-300">
                        <div className="flex items-center justify-between gap-4">
                          <p className="font-semibold">{booking.title}</p>
                          <Badge className="bg-teal-50 text-teal-700">
                            {booking.escrowStatus.replaceAll("_", " ")}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm text-slate-600">
                          {formatNaira(booking.totalPaid)} - {booking.days} days
                        </p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </Card>

            <Card className="rounded-lg border-slate-200 bg-white p-6">
              <h2 className="text-xl font-semibold">Recommended rentals</h2>
              <div className="mt-5 space-y-4">
                {listings.slice(0, 3).map((listing) => (
                  <ListingRow key={listing.id} listing={listing} compact />
                ))}
              </div>
            </Card>
          </div>
        )}
      </section>
    </main>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <Card className="rounded-lg border-slate-200 bg-white p-5">
      <Icon className="size-5 text-teal-600" />
      <p className="mt-3 text-sm text-slate-600">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </Card>
  );
}

function ListingRow({
  listing,
  compact,
}: {
  listing: DemoListing;
  compact?: boolean;
}) {
  return (
    <Link href={`/listings/${listing.id}`} className="block">
      <div className="grid grid-cols-[86px_1fr] gap-4 rounded-lg border border-slate-200 p-3 transition hover:border-teal-300">
        <img
          src={listing.images[0]}
          alt=""
          className="h-20 w-full rounded-md object-cover"
        />
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{listing.title}</p>
            {listing.vendorVerified && (
              <Badge className="bg-teal-50 text-teal-700">Verified</Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-600">
            {formatNaira(listing.pricePerDay)} / day
          </p>
          {!compact && (
            <p className="mt-1 text-xs text-slate-500">
              Deposit {formatNaira(listing.securityDeposit)}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 rounded-md bg-slate-50 p-3">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-semibold text-slate-900">{value}</span>
    </div>
  );
}

function KycPanel({
  title,
  status,
  missing,
  successCopy,
  blockedCopy,
}: {
  title: string;
  status: string;
  missing: string[];
  successCopy: string;
  blockedCopy: string;
}) {
  const isClear = missing.length === 0;

  return (
    <div
      className={`mt-4 rounded-lg border p-4 ${isClear ? "border-teal-200 bg-teal-50" : "border-amber-200 bg-amber-50"}`}
    >
      <div className="flex items-start gap-3">
        {isClear ? (
          <ShieldCheck className="mt-0.5 size-5 text-teal-700" />
        ) : (
          <AlertTriangle className="mt-0.5 size-5 text-amber-700" />
        )}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p
              className={
                isClear
                  ? "font-semibold text-teal-950"
                  : "font-semibold text-amber-950"
              }
            >
              {title}
            </p>
            <Badge
              className={
                isClear ? "bg-white text-teal-700" : "bg-white text-amber-700"
              }
            >
              {status}
            </Badge>
          </div>
          <p
            className={`mt-2 text-sm leading-6 ${isClear ? "text-teal-900" : "text-amber-950"}`}
          >
            {isClear ? successCopy : blockedCopy}
          </p>
          {!isClear && (
            <p className="mt-1 text-xs text-amber-900">
              Missing: {missing.join(", ")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
