"use client";

import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import CreateBookingForm from "@/components/create-booking-form";

export default function CreateBookingPage() {
  return (
    <main className="min-h-screen bg-[#f7fbfb]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/browse"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-700"
        >
          <ArrowLeft className="size-4" /> Back to marketplace
        </Link>
        <div className="mt-6">
          <p className="text-sm font-medium text-teal-700">Checkout</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950">
            Confirm booking and payment details
          </h1>
        </div>
        <div className="mt-6">
          <Suspense
            fallback={
              <div className="rounded-lg bg-white p-8">Loading checkout...</div>
            }
          >
            <CreateBookingForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
