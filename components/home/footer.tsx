"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-white font-bold text-lg mb-4">i.Go-rent</h3>
            <p className="text-sm">
              Nigeria's trusted peer-to-peer rental marketplace with secure
              escrow and verified hosts.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">For Renters</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/browse" className="hover:text-white">
                  Browse Items
                </Link>
              </li>
              <li>
                <Link href="/signup" className="hover:text-white">
                  Create Account
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white">
                  Safety Tips
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">For Hosts</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/signup?role=host" className="hover:text-white">
                  Start Hosting
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white">
                  Host Guide
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white">
                  Support
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#" className="hover:text-white">
                  About
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 text-center text-sm">
          <p>&copy; 2025 i.Go-rent. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
