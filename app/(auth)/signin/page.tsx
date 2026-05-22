"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { createDemoSession } from "@/lib/demo-client-store"
import { getRoleLabel, type UserRole } from "@/lib/demo-marketplace"

const roles: UserRole[] = ["renter", "vendor", "logistics"]

export default function SignInPage() {
  const router = useRouter()
  const [role, setRole] = useState<UserRole>("renter")
  const [email, setEmail] = useState("demo@igorent.ng")

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    createDemoSession({
      role,
      firstName: role === "vendor" ? "Musa" : role === "logistics" ? "Chidi" : "Zainab",
      lastName: role === "vendor" ? "Rentals" : role === "logistics" ? "Okafor" : "Customer",
      email,
      phone: "08000000000",
      area: role === "vendor" || role === "logistics" ? "Lekki Phase 1" : "Yaba",
      nin: role === "renter" ? "12345678901" : "12345678901",
      bvn: role === "renter" ? "10987654321" : "10987654321",
      businessName: role === "logistics" ? "Island Runner Dispatch" : role === "vendor" ? "Musa Rentals" : "",
      licenseNumber: role === "logistics" ? "DL-IGR-2044" : "",
      vehicleType: role === "logistics" ? "Van" : "",
      plateNumber: role === "logistics" ? "LSR-482-KJ" : "",
      coverageArea: role === "logistics" ? "Lekki Phase 1, Victoria Island, Ikoyi, Ajah" : "",
    })
    router.push(role === "renter" ? "/browse" : `/dashboard?role=${role}`)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#071b2f] p-4">
      <Card className="w-full max-w-md rounded-lg border-white/10 bg-white p-8 shadow-2xl shadow-black/30">
        <Link href="/" className="font-semibold text-[#071b2f]">
          i.Go-rent
        </Link>
        <h1 className="mt-6 text-3xl font-semibold tracking-normal">Sign in to demo mode</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Use this while payment and identity APIs are being connected. It creates a local profile for testing flows.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <div className="grid grid-cols-3 rounded-lg bg-slate-100 p-1">
            {roles.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRole(value)}
                className={`rounded-md px-4 py-2 text-sm font-medium ${
                  role === value ? "bg-[#071b2f] text-white" : "text-slate-600"
                }`}
              >
                {value === "logistics" ? "Logistics" : getRoleLabel(value)}
              </button>
            ))}
          </div>
          <Button className="w-full bg-teal-500 text-white hover:bg-teal-600">Continue</Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Need a profile?{" "}
          <Link href="/signup" className="font-medium text-teal-700">
            Create one
          </Link>
        </p>
      </Card>
    </main>
  )
}
