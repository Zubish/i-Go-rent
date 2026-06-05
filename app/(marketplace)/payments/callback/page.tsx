"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={<PaymentCallbackShell />}>
      <PaymentCallbackContent />
    </Suspense>
  );
}

function PaymentCallbackContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status") || searchParams.get("tx_status");
  const bookingId = searchParams.get("bookingId") || "";
  const isSuccessful = status === "successful" || status === "completed";
  const isFailed = status === "failed" || status === "cancelled";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7fbfb] p-6">
      <Card className="w-full max-w-md rounded-lg border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-teal-50 text-teal-700">
          {isSuccessful ? (
            <CheckCircle2 className="size-6" />
          ) : isFailed ? (
            <XCircle className="size-6 text-red-600" />
          ) : (
            <Clock className="size-6" />
          )}
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-normal text-slate-950">
          {isSuccessful
            ? "Payment received"
            : isFailed
              ? "Payment was not completed"
              : "Payment is being verified"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {isSuccessful
            ? "Your booking will show held escrow once the payment webhook is processed."
            : isFailed
              ? "You can return to the booking and start checkout again."
              : "Refresh the booking after a short moment to confirm escrow status."}
        </p>
        <Button
          asChild
          className="mt-6 w-full bg-[#071b2f] text-white hover:bg-[#0b2b49]"
        >
          <Link href={bookingId ? `/bookings/${bookingId}` : "/dashboard"}>
            Back to booking
          </Link>
        </Button>
      </Card>
    </main>
  );
}

function PaymentCallbackShell() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7fbfb] p-6">
      <Card className="w-full max-w-md rounded-lg border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-teal-50 text-teal-700">
          <Clock className="size-6" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-normal text-slate-950">
          Payment is being verified
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Refresh the booking after a short moment to confirm escrow status.
        </p>
      </Card>
    </main>
  );
}
