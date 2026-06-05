"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-6">
          Ready to Start Sharing?
        </h2>
        <p className="text-xl md:text-2xl opacity-95 mb-8">
          Join thousands of Nigerians earning and saving on i.Go-rent today.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/signup?role=renter">
            <Button
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100 font-semibold"
            >
              Browse Rentals
            </Button>
          </Link>
          <Link href="/signup?role=host">
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/20 font-semibold bg-transparent"
            >
              Become a Host
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
