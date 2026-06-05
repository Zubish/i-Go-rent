"use client";

import type React from "react";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, ShieldCheck, Truck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  calculateBookingTotal,
  formatNaira,
  getKycStatus,
  logisticsFee,
  legalUseWarning,
  type DeliveryType,
  type DemoListing,
  type DemoLogisticsProvider,
  type DemoUser,
} from "@/lib/demo-marketplace";
import {
  getAllLogisticsProviders,
  getDemoSession,
} from "@/lib/demo-client-store";

export default function CreateBookingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listingId = searchParams.get("listing");

  const [listing, setListing] = useState<DemoListing | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("self-pickup");
  const [renterName, setRenterName] = useState("");
  const [renterPhone, setRenterPhone] = useState("");
  const [suggestedProvider, setSuggestedProvider] =
    useState<DemoLogisticsProvider | null>(null);
  const [session, setSession] = useState<DemoUser | null>(null);
  const [legalUseAccepted, setLegalUseAccepted] = useState(false);
  const [conditionAcknowledged, setConditionAcknowledged] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const todayInput = useMemo(() => new Date().toISOString().slice(0, 10), []);

  useEffect(() => {
    let mounted = true;

    async function hydrateListing() {
      if (!listingId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/listings/${listingId}`, {
          cache: "no-store",
        });
        const data = await response.json();
        const nextListing = response.ok ? data.listing : null;
        if (!mounted) return;
        setListing(nextListing);
        const providers = getAllLogisticsProviders().filter(
          (provider) => provider.verified,
        );
        setSuggestedProvider(nextListing ? providers[0] || null : null);
      } catch {
        if (mounted) setListing(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    async function hydrateSession() {
      const localSession = getDemoSession();
      let nextSession = localSession;

      try {
        const response = await fetch("/api/auth/session", {
          cache: "no-store",
        });
        if (response.ok) {
          const data = await response.json();
          if (data.user) nextSession = data.user;
        }
      } catch {
        nextSession = localSession;
      }

      setSession(nextSession);
      if (nextSession) {
        setRenterName(`${nextSession.firstName} ${nextSession.lastName}`);
        setRenterPhone(nextSession.phone);
      }
    }

    hydrateListing();
    hydrateSession();

    return () => {
      mounted = false;
    };
  }, [listingId]);

  const totals = useMemo(() => {
    if (!listing) return null;
    return calculateBookingTotal(listing, startDate, endDate, deliveryType);
  }, [deliveryType, endDate, listing, startDate]);

  const renterKyc = getKycStatus(session, "renter");
  const exceedsMaxDays = Boolean(
    listing && totals && totals.days > listing.maxRentalDays,
  );
  const invalidDateRange = Boolean(
    startDate && endDate && totals && totals.days <= 0,
  );
  const vendorReady = Boolean(listing?.vendorVerified);
  const canBook = Boolean(
    listing &&
    renterName &&
    totals &&
    totals.days > 0 &&
    !exceedsMaxDays &&
    renterKyc.canBook &&
    vendorReady &&
    legalUseAccepted &&
    conditionAcknowledged,
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!listing || !canBook) return;

    setError("");
    setProcessing(true);

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing.id,
          renterName,
          renterPhone,
          startDate,
          endDate,
          deliveryType,
          legalUseAccepted,
          conditionAcknowledged,
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.booking) {
        setError(data.error || "Could not create booking");
        setProcessing(false);
        return;
      }

      router.push(`/bookings/${data.booking.id}`);
    } catch {
      setError("Could not create booking");
      setProcessing(false);
    }
  };

  const handleStartDate = (event: React.ChangeEvent<HTMLInputElement>) =>
    setStartDate(event.currentTarget.value);
  const handleEndDate = (event: React.ChangeEvent<HTMLInputElement>) =>
    setEndDate(event.currentTarget.value);

  if (loading) {
    return (
      <Card className="rounded-lg p-8 text-center">
        <p className="font-semibold">Loading checkout...</p>
      </Card>
    );
  }

  if (!listing) {
    return (
      <Card className="rounded-lg p-8 text-center">
        <p className="font-semibold">Listing not found</p>
        <p className="mt-2 text-sm text-slate-600">
          Go back to browse and choose an available rental.
        </p>
      </Card>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-6 lg:grid-cols-[1fr_380px]"
    >
      <div className="space-y-5">
        <Card className="rounded-lg border-slate-200 bg-white p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Badge className="bg-teal-50 text-teal-700">
                {listing.category}
              </Badge>
              <h2 className="mt-3 text-2xl font-semibold tracking-normal">
                {listing.title}
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                {listing.vendorName} - {listing.location}
              </p>
            </div>
            <img
              src={listing.images[0]}
              alt=""
              className="h-24 w-32 rounded-md object-cover"
            />
          </div>
        </Card>

        <Card className="rounded-lg border-slate-200 bg-white p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <ShieldCheck className="size-5 text-teal-600" /> Verification and
            condition contract
          </h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <StatusBox
              label="Renter KYC"
              value={renterKyc.label}
              tone={renterKyc.canBook ? "good" : "warn"}
              detail={
                renterKyc.canBook
                  ? "Standard bookings enabled."
                  : `Missing: ${renterKyc.missing.join(", ")}`
              }
            />
            <StatusBox
              label="Vendor verification"
              value={
                listing.vendorVerified
                  ? "Verified vendor"
                  : "Vendor KYC pending"
              }
              tone={listing.vendorVerified ? "good" : "warn"}
              detail={
                listing.vendorVerified
                  ? "Listing can be booked."
                  : "This listing is visible but checkout is blocked."
              }
            />
          </div>
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
            <div className="grid gap-3 sm:grid-cols-2">
              <ConditionLine label="Condition" value={listing.condition} />
              <ConditionLine
                label="Max rental"
                value={`${listing.maxRentalDays} days`}
              />
              <ConditionLine
                label="Replacement value"
                value={formatNaira(listing.replacementValue)}
              />
              <ConditionLine
                label="Late return fee"
                value={`${formatNaira(listing.lateReturnFee)} / day`}
              />
            </div>
            <div className="mt-4 space-y-3">
              <ConditionLine
                label="Known defects"
                value={listing.knownDefects}
              />
              <ConditionLine label="Accessories" value={listing.accessories} />
              <ConditionLine label="Usage limits" value={listing.usageLimits} />
            </div>
          </div>
        </Card>

        <Card className="rounded-lg border-slate-200 bg-white p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <CalendarDays className="size-5 text-teal-600" /> Rental dates
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label>
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Start date
              </span>
              <Input
                type="date"
                value={startDate}
                onChange={handleStartDate}
                onInput={handleStartDate}
                min={todayInput}
                aria-invalid={invalidDateRange}
                required
              />
            </label>
            <label>
              <span className="mb-2 block text-sm font-medium text-slate-700">
                End date
              </span>
              <Input
                type="date"
                value={endDate}
                onChange={handleEndDate}
                onInput={handleEndDate}
                min={startDate || todayInput}
                aria-invalid={invalidDateRange}
                required
              />
            </label>
          </div>
          {invalidDateRange && (
            <p className="mt-3 text-sm font-medium text-red-600" role="alert">
              End date must be after the start date.
            </p>
          )}
        </Card>

        <Card className="rounded-lg border-slate-200 bg-white p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <Truck className="size-5 text-teal-600" /> Delivery type
          </h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              [
                "self-pickup",
                "Self-Pickup",
                "Meet vendor at the listed pickup location.",
                0,
              ],
              [
                "igo-logistics",
                "i.Go-Logistics",
                "Flat-fee dispatch coordination inside Lagos.",
                logisticsFee,
              ],
            ].map(([value, title, body, fee]) => (
              <label
                key={value as string}
                className={`cursor-pointer rounded-lg border p-4 ${
                  deliveryType === value
                    ? "border-teal-500 bg-teal-50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="deliveryType"
                  value={value as string}
                  checked={deliveryType === value}
                  onChange={() => setDeliveryType(value as DeliveryType)}
                  className="sr-only"
                />
                <span className="font-semibold">{title as string}</span>
                <span className="mt-1 block text-sm leading-6 text-slate-600">
                  {body as string}
                </span>
                <span className="mt-3 block text-sm font-semibold">
                  {formatNaira(fee as number)}
                </span>
              </label>
            ))}
          </div>
          {deliveryType === "igo-logistics" && suggestedProvider && (
            <div className="mt-4 rounded-lg border border-teal-200 bg-teal-50 p-4 text-sm text-teal-950">
              <p className="font-semibold">
                Dispatch provider selected after escrow funding
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <DispatchPreview
                  label="Provider"
                  value={suggestedProvider.providerName}
                />
                <DispatchPreview
                  label="Contact"
                  value={`${suggestedProvider.contactName} - ${suggestedProvider.phone}`}
                />
                <DispatchPreview
                  label="Vehicle"
                  value={`${suggestedProvider.vehicleType} - ${suggestedProvider.plateNumber}`}
                />
                <DispatchPreview
                  label="Coverage"
                  value={suggestedProvider.coverageAreas.join(", ")}
                />
              </div>
              <p className="mt-3 leading-6">
                These details are sent to both vendor and renter once the
                booking is funded. Vendor should release the item only after
                handover code and condition proof are confirmed.
              </p>
            </div>
          )}
        </Card>

        <Card className="rounded-lg border-slate-200 bg-white p-6">
          <h3 className="text-lg font-semibold">Renter details</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Name for booking
              </span>
              <Input
                value={renterName}
                onChange={(event) => setRenterName(event.target.value)}
                placeholder="Your full name"
                required
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Phone for handover
              </span>
              <Input
                value={renterPhone}
                onChange={(event) => setRenterPhone(event.target.value)}
                placeholder="080..."
                required
              />
            </label>
          </div>
        </Card>

        <Card className="rounded-lg border-slate-200 bg-white p-6">
          <h3 className="text-lg font-semibold">Required confirmations</h3>
          <div className="mt-4 space-y-3">
            <label className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
              <input
                type="checkbox"
                checked={legalUseAccepted}
                onChange={(event) => setLegalUseAccepted(event.target.checked)}
                required
                className="mt-1"
              />
              <span>
                {legalUseWarning} Misuse may lead to cancellation, frozen
                escrow, suspension, and lawful reporting where required.
              </span>
            </label>
            <label className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
              <input
                type="checkbox"
                checked={conditionAcknowledged}
                onChange={(event) =>
                  setConditionAcknowledged(event.target.checked)
                }
                required
                className="mt-1"
              />
              <span>
                I will inspect the item on receipt, confirm its condition before
                use, and open a dispute immediately if the condition differs
                from the vendor's listing.
              </span>
            </label>
          </div>
        </Card>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <Card className="rounded-lg border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/70">
          <h3 className="text-lg font-semibold">Checkout summary</h3>
          <div className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Rental duration</span>
              <span className="font-semibold">{totals?.days || 0} days</span>
            </div>
            <div className="flex justify-between">
              <span
                className={
                  exceedsMaxDays
                    ? "font-semibold text-red-600"
                    : "text-slate-600"
                }
              >
                Max rental
              </span>
              <span
                className={
                  exceedsMaxDays
                    ? "font-semibold text-red-600"
                    : "font-semibold"
                }
              >
                {listing.maxRentalDays} days
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Rental fee</span>
              <span className="font-semibold">
                {formatNaira(totals?.rentalFee || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Security deposit</span>
              <span className="font-semibold">
                {formatNaira(totals?.securityDeposit || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Delivery</span>
              <span className="font-semibold">
                {formatNaira(totals?.deliveryFee || 0)}
              </span>
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between text-base">
                <span className="font-semibold">Payment hold</span>
                <span className="font-semibold">
                  {formatNaira(totals?.totalPaid || 0)}
                </span>
              </div>
            </div>
          </div>

          {(!renterKyc.canBook || !vendorReady || exceedsMaxDays) && (
            <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
              {!renterKyc.canBook && (
                <p>
                  Complete renter KYC before checkout. Missing:{" "}
                  {renterKyc.missing.join(", ")}.
                </p>
              )}
              {!vendorReady && (
                <p>
                  This vendor must complete KYC before bookings can be accepted.
                </p>
              )}
              {exceedsMaxDays && (
                <p>
                  Selected duration exceeds this vendor's maximum rental period.
                </p>
              )}
            </div>
          )}

          {error && (
            <div
              className="mt-5 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              role="alert"
            >
              {error}
            </div>
          )}

          <div className="mt-5 rounded-md bg-[#071b2f] p-4 text-sm text-white">
            <div className="flex items-center gap-2 font-semibold text-teal-200">
              <ShieldCheck className="size-4" /> Virtual escrow
            </div>
            <p className="mt-2 text-slate-300">
              Your booking starts as payment pending. Escrow is marked as held
              only after payment is verified.
            </p>
          </div>

          <Button
            disabled={!canBook || processing}
            size="lg"
            className="mt-5 w-full bg-teal-500 text-white hover:bg-teal-600"
          >
            {processing ? "Creating booking..." : "Create pending booking"}
          </Button>
        </Card>
      </aside>
    </form>
  );
}

function DispatchPreview({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-teal-700">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}

function StatusBox({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone: "good" | "warn";
}) {
  return (
    <div
      className={`rounded-md p-4 ${tone === "good" ? "bg-teal-50 text-teal-950" : "bg-amber-50 text-amber-950"}`}
    >
      <p className="text-xs opacity-80">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
      <p className="mt-2 text-xs leading-5">{detail}</p>
    </div>
  );
}

function ConditionLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-slate-900">{value}</p>
    </div>
  );
}
