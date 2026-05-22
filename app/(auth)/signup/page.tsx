"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { BadgeCheck, ShieldCheck } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { createDemoSession } from "@/lib/demo-client-store"
import { lagosAreas, type UserRole } from "@/lib/demo-marketplace"

export default function SignUpPage() {
  const router = useRouter()
  const [role, setRole] = useState<UserRole>("renter")
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    area: "Lekki Phase 1",
    nin: "",
    bvn: "",
  })

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("role") === "vendor") setRole("vendor")
  }, [])

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    createDemoSession({ role, ...formData })
    router.push(role === "vendor" ? "/dashboard?role=vendor" : "/browse")
  }

  return (
    <main className="min-h-screen bg-[#071b2f] p-4 text-white">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-6xl items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="hidden lg:block">
          <Badge className="mb-5 border-teal-300/30 bg-teal-300/10 text-teal-100">Join i.Go-rent</Badge>
          <h1 className="text-5xl font-semibold leading-tight tracking-normal">A safer rental network for Lagos.</h1>
          <p className="mt-5 max-w-lg leading-7 text-slate-300">
            Separate renter and vendor profiles, visible verification badges, deposit logic, and escrow-backed booking
            flows designed around local trust.
          </p>
          <div className="mt-8 space-y-4 text-sm text-slate-200">
            <p className="flex items-center gap-3">
              <ShieldCheck className="size-5 text-teal-300" /> Deposits tracked separately from rental income
            </p>
            <p className="flex items-center gap-3">
              <BadgeCheck className="size-5 text-teal-300" /> Vendor NIN/BVN placeholders enable verified badges
            </p>
          </div>
        </section>

        <Card className="rounded-lg border-white/10 bg-white p-6 text-slate-950 shadow-2xl shadow-black/30 sm:p-8">
          <Link href="/" className="font-semibold text-[#071b2f]">
            i.Go-rent
          </Link>
          <div className="mt-6">
            <p className="text-sm font-medium text-teal-700">Create account</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-normal">Start as a renter or vendor</h2>
          </div>

          <div className="mt-6 grid grid-cols-2 rounded-lg bg-slate-100 p-1">
            {[
              ["renter", "Renter"],
              ["vendor", "Vendor"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setRole(value as UserRole)}
                className={`rounded-md px-4 py-2 text-sm font-medium ${
                  role === value ? "bg-[#071b2f] text-white" : "text-slate-600"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input name="firstName" placeholder="First name" value={formData.firstName} onChange={handleChange} required />
              <Input name="lastName" placeholder="Last name" value={formData.lastName} onChange={handleChange} required />
            </div>
            <Input name="email" type="email" placeholder="Email address" value={formData.email} onChange={handleChange} required />
            <Input name="phone" placeholder="Phone number" value={formData.phone} onChange={handleChange} required />
            <select
              name="area"
              value={formData.area}
              onChange={handleChange}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {lagosAreas.map((area) => (
                <option key={area}>{area}</option>
              ))}
            </select>

            {role === "vendor" && (
              <div className="rounded-lg border border-teal-100 bg-teal-50 p-4">
                <p className="text-sm font-semibold text-teal-900">Vendor verification placeholders</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Input name="nin" placeholder="NIN" value={formData.nin} onChange={handleChange} />
                  <Input name="bvn" placeholder="BVN" value={formData.bvn} onChange={handleChange} />
                </div>
                <p className="mt-2 text-xs text-teal-800">Add both values to show a verified vendor badge in demo mode.</p>
              </div>
            )}

            <Button className="w-full bg-teal-500 text-white hover:bg-teal-600">
              {role === "vendor" ? "Create vendor profile" : "Create renter profile"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have a demo profile?{" "}
            <Link href="/signin" className="font-medium text-teal-700">
              Sign in
            </Link>
          </p>
        </Card>
      </div>
    </main>
  )
}
