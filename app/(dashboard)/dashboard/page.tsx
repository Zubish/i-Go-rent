"use client";

import type React from "react";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  BadgeCheck,
  CalendarCheck,
  CircleDollarSign,
  ImagePlus,
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
  legalUseWarning,
  maxListingImages,
  type DemoBooking,
  type DemoListing,
  type DemoUser,
} from "@/lib/demo-marketplace";
import { signOutDemo } from "@/lib/demo-client-store";

const defaultListingForm = {
  title: "",
  category: "Events" as DemoListing["category"],
  description: "",
  pricePerDay: "",
  securityDeposit: "",
  location: "",
  condition: "Good" as DemoListing["condition"],
  knownDefects: "",
  accessories: "",
  usageLimits: "",
  replacementValue: "",
  lateReturnFee: "",
  maxRentalDays: "3",
};

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<DemoUser | null>(null);
  const [listings, setListings] = useState<DemoListing[]>([]);
  const [renterBookings, setRenterBookings] = useState<DemoBooking[]>([]);
  const [vendorBookings, setVendorBookings] = useState<DemoBooking[]>([]);
  const [dispatchBookings, setDispatchBookings] = useState<DemoBooking[]>([]);
  const [form, setForm] = useState(defaultListingForm);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoDataUrls, setPhotoDataUrls] = useState<string[]>([]);
  const [createdListingId, setCreatedListingId] = useState("");
  const [listingError, setListingError] = useState("");
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [marketplaceNotice, setMarketplaceNotice] = useState("");
  const [submittingListing, setSubmittingListing] = useState(false);
  const [verificationNotice, setVerificationNotice] = useState("");
  const [sendingVerification, setSendingVerification] = useState(false);

  useEffect(() => {
    let active = true;

    async function hydrate() {
      setLoadingRecords(true);

      try {
        const sessionResponse = await fetch("/api/auth/session", {
          cache: "no-store",
        });
        const sessionData = await sessionResponse.json();
        const user = sessionResponse.ok ? sessionData.user : null;

        if (!user) {
          signOutDemo();
          router.replace("/signin");
          return;
        }

        const [listingResponse, renterResponse, vendorResponse] =
          await Promise.all([
            fetch("/api/listings", { cache: "no-store" }),
            fetch("/api/bookings?role=renter", { cache: "no-store" }),
            fetch("/api/bookings?role=vendor", { cache: "no-store" }),
          ]);
        const [listingData, renterData, vendorData] = await Promise.all([
          listingResponse.json(),
          renterResponse.json(),
          vendorResponse.json(),
        ]);

        let logisticsData = { bookings: [] };
        if (user.role === "logistics") {
          const logisticsResponse = await fetch("/api/bookings?role=logistics", {
            cache: "no-store",
          });
          logisticsData = await logisticsResponse.json();
        }

        if (!active) return;

        setSession(user);
        setListings(
          Array.isArray(listingData.listings) ? listingData.listings : [],
        );
        setRenterBookings(
          Array.isArray(renterData.bookings) ? renterData.bookings : [],
        );
        setVendorBookings(
          Array.isArray(vendorData.bookings) ? vendorData.bookings : [],
        );
        setDispatchBookings(
          Array.isArray(logisticsData.bookings) ? logisticsData.bookings : [],
        );
        setMarketplaceNotice(
          listingData.degraded || listingData.source === "seeded_fallback"
            ? "Marketplace is running in fallback mode. New listings and bookings may be limited."
            : "",
        );
      } catch {
        if (!active) return;
        setMarketplaceNotice("Marketplace records could not be loaded.");
      } finally {
        if (active) setLoadingRecords(false);
      }
    }

    hydrate();

    return () => {
      active = false;
    };
  }, [router]);

  const myListings = useMemo(() => {
    if (!session) return [];
    return listings.filter((listing) => listing.vendorId === session.id);
  }, [listings, session]);

  const vendorKyc = getKycStatus(session, "vendor");
  const renterKyc = getKycStatus(session, "renter");
  const logisticsKyc = getKycStatus(session, "logistics");
  const totalBookingValue = [...renterBookings, ...vendorBookings].reduce(
    (sum, booking) => sum + booking.totalPaid,
    0,
  );

  const handleListingChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotos = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []).slice(0, maxListingImages);
    setPhotoFiles(files);
    const dataUrls = await Promise.all(
      files.map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(new Error("Could not read photo"));
            reader.readAsDataURL(file);
          }),
      ),
    );
    setPhotoDataUrls(dataUrls);
  };

  const uploadPhotos = async () => {
    const uploadedUrls: string[] = [];

    for (const file of photoFiles) {
      const uploadForm = new FormData();
      uploadForm.append("file", file);

      const response = await fetch("/api/uploads/listing-photo", {
        method: "POST",
        body: uploadForm,
      });
      const data = await response.json();

      if (!response.ok || !data.url) {
        throw new Error(data.error || "Could not upload listing photo");
      }

      uploadedUrls.push(data.url);
    }

    return uploadedUrls;
  };

  const handleCreateListing = async (event: React.FormEvent) => {
    event.preventDefault();
    setListingError("");
    setSubmittingListing(true);

    try {
      if (!photoFiles.length) {
        setListingError("Add at least one item photo");
        return;
      }

      const imageUrls = await uploadPhotos();
      const response = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          pricePerDay: Number(form.pricePerDay),
          securityDeposit: Number(form.securityDeposit),
          replacementValue: Number(form.replacementValue),
          lateReturnFee: Number(form.lateReturnFee),
          maxRentalDays: Number(form.maxRentalDays),
          imageUrls,
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
      setForm(defaultListingForm);
      setPhotoFiles([]);
      setPhotoDataUrls([]);
    } catch (error) {
      setListingError(
        error instanceof Error ? error.message : "Could not create listing",
      );
    } finally {
      setSubmittingListing(false);
    }
  };

  const handleResendVerification = async () => {
    setVerificationNotice("");
    setSendingVerification(true);

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) {
        setVerificationNotice(data.error || "Could not send confirmation link");
        return;
      }

      setVerificationNotice(
        data.alreadyVerified
          ? "Your email is already confirmed."
          : "Confirmation link sent.",
      );
    } catch {
      setVerificationNotice("Could not send confirmation link");
    } finally {
      setSendingVerification(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    signOutDemo();
    router.replace("/");
  };

  if (!session && loadingRecords) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7fbfb] p-6">
        <Card className="rounded-lg border-slate-200 bg-white p-8 text-center">
          <p className="font-semibold">Loading your workspace...</p>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7fbfb]">
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <Link href="/" className="text-sm font-semibold text-[#071b2f]">
              i.Go-rent
            </Link>
            <h1 className="mt-3 text-4xl font-semibold tracking-normal text-slate-950">
              {session ? `Welcome, ${session.firstName}` : "Workspace"}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Manage your rentals, listings, escrow states, and dispatch work
              from one account.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" className="bg-white">
              <Link href="/browse">Browse</Link>
            </Button>
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="bg-white"
            >
              Sign out
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Metric
            icon={CalendarCheck}
            label="Bookings"
            value={(renterBookings.length + vendorBookings.length).toString()}
          />
          <Metric
            icon={ShieldCheck}
            label="Email"
            value={session?.emailVerified ? "Confirmed" : "Unconfirmed"}
          />
          <Metric
            icon={CircleDollarSign}
            label="Booking value"
            value={formatNaira(totalBookingValue)}
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

        {session && !session.emailVerified && (
          <div
            className="mt-6 flex flex-col gap-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950 sm:flex-row sm:items-center sm:justify-between"
            role="status"
            aria-live="polite"
          >
            <div>
              <p className="font-semibold">Confirm your email</p>
              <p>
                Secure account recovery and booking updates for {session.email}.
              </p>
              {verificationNotice && (
                <p className="mt-1 text-xs font-semibold">
                  {verificationNotice}
                </p>
              )}
            </div>
            <Button
              type="button"
              onClick={handleResendVerification}
              disabled={sendingVerification}
              variant="outline"
              className="bg-white"
            >
              {sendingVerification ? "Sending..." : "Send link"}
            </Button>
          </div>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="rounded-lg border-slate-200 bg-white p-6">
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <PackagePlus className="size-5 text-teal-600" /> Post a rental
            </h2>
            <TrustPanel
              title="Seller trust"
              isClear={vendorKyc.canList}
              status={vendorKyc.canList ? "Verified seller" : "Unverified seller"}
              body={
                vendorKyc.canList
                  ? "Your listings can show the verified badge."
                  : "You can post rentals, but your listings will not show a verified badge until vendor verification is complete."
              }
            />
            <form onSubmit={handleCreateListing} className="mt-5 space-y-4">
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
                placeholder="What is included and what kind of rental is this best for?"
                required
              />
              <label className="block rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5">
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <ImagePlus className="size-4 text-teal-600" /> Photos
                </span>
                <span className="mt-1 block text-xs leading-5 text-slate-600">
                  Add clear photos of the actual item and its current condition.
                </span>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotos}
                  className="mt-4 bg-white"
                  required={photoDataUrls.length === 0}
                />
              </label>
              {photoDataUrls.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {photoDataUrls.map((photo, index) => (
                    <img
                      key={photo.slice(0, 40) + index}
                      src={photo}
                      alt=""
                      className="h-24 w-full rounded-md object-cover"
                    />
                  ))}
                </div>
              )}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  Condition record
                </p>
                <div className="mt-4 space-y-3">
                  <Textarea
                    name="knownDefects"
                    value={form.knownDefects}
                    onChange={handleListingChange}
                    rows={2}
                    placeholder="Known defects or wear"
                    required
                  />
                  <Textarea
                    name="accessories"
                    value={form.accessories}
                    onChange={handleListingChange}
                    rows={2}
                    placeholder="Included accessories"
                    required
                  />
                  <Textarea
                    name="usageLimits"
                    value={form.usageLimits}
                    onChange={handleListingChange}
                    rows={2}
                    placeholder="Usage limits"
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
                  placeholder="Late fee"
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
              <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-950">
                {legalUseWarning}
              </div>
              {listingError && (
                <div
                  className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                  role="alert"
                >
                  {listingError}
                </div>
              )}
              <Button
                disabled={submittingListing}
                className="w-full bg-teal-500 text-white hover:bg-teal-600"
              >
                {submittingListing ? "Saving..." : "Save listing"}
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

          <div className="space-y-6">
            <Card className="rounded-lg border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-semibold">My listings</h2>
                {vendorKyc.canList && (
                  <Badge className="bg-teal-50 text-teal-700">
                    <BadgeCheck /> Verified
                  </Badge>
                )}
              </div>
              <div className="mt-5 space-y-4">
                {loadingRecords ? (
                  <EmptyState title="Loading listings..." />
                ) : myListings.length === 0 ? (
                  <EmptyState title="No listings yet" />
                ) : (
                  myListings.map((listing) => (
                    <ListingRow key={listing.id} listing={listing} />
                  ))
                )}
              </div>
            </Card>

            <Card className="rounded-lg border-slate-200 bg-white p-6">
              <h2 className="text-xl font-semibold">My bookings</h2>
              <TrustPanel
                title="Booking access"
                isClear={renterKyc.canBook}
                status={renterKyc.label}
                body={
                  renterKyc.canBook
                    ? "You can book standard rentals."
                    : "Complete phone and NIN verification before checkout."
                }
              />
              <RecordList
                bookings={renterBookings}
                emptyTitle="No bookings yet"
                loading={loadingRecords}
              />
            </Card>

            <Card className="rounded-lg border-slate-200 bg-white p-6">
              <h2 className="text-xl font-semibold">Booking requests</h2>
              <RecordList
                bookings={vendorBookings}
                emptyTitle="No requests yet"
                loading={loadingRecords}
              />
            </Card>

            {session?.role === "logistics" && (
              <Card className="rounded-lg border-slate-200 bg-white p-6">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-xl font-semibold">Dispatch work</h2>
                  <Truck className="size-5 text-teal-600" />
                </div>
                <TrustPanel
                  title="Logistics access"
                  isClear={logisticsKyc.canDispatch}
                  status={
                    logisticsKyc.canDispatch
                      ? "Verified logistics"
                      : "Verification required"
                  }
                  body={
                    logisticsKyc.canDispatch
                      ? "You can receive dispatch assignments."
                      : "Logistics providers must be verified before operating."
                  }
                />
                <RecordList
                  bookings={dispatchBookings}
                  emptyTitle="No dispatches assigned"
                  loading={loadingRecords}
                />
              </Card>
            )}
          </div>
        </div>
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

function TrustPanel({
  title,
  isClear,
  status,
  body,
}: {
  title: string;
  isClear: boolean;
  status: string;
  body: string;
}) {
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
            {body}
          </p>
        </div>
      </div>
    </div>
  );
}

function ListingRow({ listing }: { listing: DemoListing }) {
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
        </div>
      </div>
    </Link>
  );
}

function RecordList({
  bookings,
  emptyTitle,
  loading,
}: {
  bookings: DemoBooking[];
  emptyTitle: string;
  loading: boolean;
}) {
  if (loading) return <EmptyState title="Loading records..." />;
  if (bookings.length === 0) return <EmptyState title={emptyTitle} />;

  return (
    <div className="mt-5 space-y-4">
      {bookings.map((booking) => (
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
      ))}
    </div>
  );
}

function EmptyState({ title }: { title: string }) {
  return (
    <div className="mt-5 rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-600">
      {title}
    </div>
  );
}
