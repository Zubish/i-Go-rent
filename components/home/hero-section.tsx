"use client";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 text-white py-20 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Rent Anything You Need
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-95 max-w-3xl mx-auto">
            Connect with verified hosts in your area. Secure payments.
            Government-verified identity. Your trusted peer-to-peer rental
            marketplace in Nigeria.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="bg-white rounded-lg shadow-xl p-4 flex items-center gap-3">
            <Search className="text-blue-600" size={24} />
            <input
              type="text"
              placeholder="What do you want to rent? (Camera, Car, Grill...)"
              className="flex-1 outline-none text-gray-800 placeholder-gray-500"
            />
            <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white">
              Search
            </Button>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center gap-8 text-center">
          <div>
            <div className="text-3xl font-bold">✓</div>
            <p className="text-sm opacity-90">Verified Hosts</p>
          </div>
          <div>
            <div className="text-3xl font-bold">✓</div>
            <p className="text-sm opacity-90">Secure Escrow</p>
          </div>
          <div>
            <div className="text-3xl font-bold">✓</div>
            <p className="text-sm opacity-90">Government ID</p>
          </div>
          <div>
            <div className="text-3xl font-bold">✓</div>
            <p className="text-sm opacity-90">24/7 Support</p>
          </div>
        </div>
      </div>
    </section>
  );
}
