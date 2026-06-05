"use client";

import type React from "react";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BadgeCheck, ShieldCheck, Truck } from "lucide-react";

import { signUp } from "@/app/actions/auth-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  getRoleLabel,
  lagosAreas,
  legalUseWarning,
  type UserRole,
} from "@/lib/demo-marketplace";

const roles: UserRole[] = ["renter", "vendor", "logistics"];

export default function SignUpPage() {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>("renter");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    area: "Lekki Phase 1",
    nin: "",
    bvn: "",
    cac: "",
    businessName: "",
    licenseNumber: "",
    vehicleType: "",
    plateNumber: "",
    coverageArea: "Lekki Phase 1, Victoria Island",
    legalAccepted: false,
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("role") === "vendor") setRole("vendor");
    if (params.get("role") === "logistics") setRole("logistics");
  }, []);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = event.target;
    const checked =
      type === "checkbox"
        ? (event.target as HTMLInputElement).checked
        : undefined;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    const response = await signUp({
      email: formData.email,
      password: formData.password,
      firstName: formData.firstName,
      lastName: formData.lastName,
      phoneNumber: formData.phone,
      userType: role,
      city: formData.area,
      state: "Lagos",
      area: formData.area,
      nin: formData.nin,
      bvn: formData.bvn,
      cac: formData.cac,
      businessName: formData.businessName,
      licenseNumber: formData.licenseNumber,
      vehicleType: formData.vehicleType,
      plateNumber: formData.plateNumber,
      coverageArea: formData.coverageArea,
      legalAccepted: formData.legalAccepted,
    });

    setSubmitting(false);

    if (!response.success || !response.user) {
      setError(response.error || "Could not create account");
      return;
    }

    router.push("/dashboard");
  };

  return (
    <main className="min-h-screen bg-[#071b2f] p-4 text-white">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-6xl items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="hidden lg:block">
          <Badge className="mb-5 border-teal-300/30 bg-teal-300/10 text-teal-100">
            Join i.Go-rent
          </Badge>
          <h1 className="text-5xl font-semibold leading-tight tracking-normal">
            A safer rental network for Lagos.
          </h1>
          <p className="mt-5 max-w-lg leading-7 text-slate-300">
            Separate renter and vendor profiles, visible verification badges,
            deposit logic, and escrow-backed booking flows designed around local
            trust.
          </p>
          <div className="mt-8 space-y-4 text-sm text-slate-200">
            <p className="flex items-center gap-3">
              <ShieldCheck className="size-5 text-teal-300" /> Deposits tracked
              separately from rental income
            </p>
            <p className="flex items-center gap-3">
              <BadgeCheck className="size-5 text-teal-300" /> Vendor NIN/BVN
              placeholders enable verified badges
            </p>
            <p className="flex items-center gap-3">
              <Truck className="size-5 text-teal-300" /> Logistics providers can
              receive dispatch assignments
            </p>
          </div>
        </section>

        <Card className="rounded-lg border-white/10 bg-white p-6 text-slate-950 shadow-2xl shadow-black/30 sm:p-8">
          <Link href="/" className="font-semibold text-[#071b2f]">
            i.Go-rent
          </Link>
          <div className="mt-6">
            <p className="text-sm font-medium text-teal-700">Create account</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-normal">
              Start with the right account
            </h2>
          </div>

          <div className="mt-6 grid grid-cols-3 rounded-lg bg-slate-100 p-1">
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

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                name="firstName"
                placeholder="First name"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
              <Input
                name="lastName"
                placeholder="Last name"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
            <Input
              name="email"
              type="email"
              placeholder="Email address"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <Input
              name="password"
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              minLength={8}
              required
            />
            <Input
              name="phone"
              placeholder="Phone number"
              value={formData.phone}
              onChange={handleChange}
              required
            />
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

            {role === "renter" && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  Renter KYC
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Input
                    name="nin"
                    placeholder="NIN"
                    value={formData.nin}
                    onChange={handleChange}
                  />
                  <Input
                    name="bvn"
                    placeholder="BVN for higher-value bookings"
                    value={formData.bvn}
                    onChange={handleChange}
                  />
                </div>
              </div>
            )}

            {role === "vendor" && (
              <div className="rounded-lg border border-teal-100 bg-teal-50 p-4">
                <p className="text-sm font-semibold text-teal-900">
                  Vendor verification placeholders
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Input
                    name="nin"
                    placeholder="NIN"
                    value={formData.nin}
                    onChange={handleChange}
                  />
                  <Input
                    name="bvn"
                    placeholder="BVN"
                    value={formData.bvn}
                    onChange={handleChange}
                  />
                  <Input
                    name="businessName"
                    placeholder="Business name"
                    value={formData.businessName}
                    onChange={handleChange}
                  />
                  <Input
                    name="cac"
                    placeholder="CAC reg no. optional"
                    value={formData.cac}
                    onChange={handleChange}
                  />
                </div>
                <p className="mt-2 text-xs text-teal-800">
              Add both values to show a verified vendor badge.
                </p>
              </div>
            )}

            {role === "logistics" && (
              <div className="rounded-lg border border-teal-100 bg-teal-50 p-4">
                <p className="text-sm font-semibold text-teal-900">
                  Logistics provider verification
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Input
                    name="businessName"
                    placeholder="Provider / business name"
                    value={formData.businessName}
                    onChange={handleChange}
                  />
                  <Input
                    name="licenseNumber"
                    placeholder="Driver license / rider permit"
                    value={formData.licenseNumber}
                    onChange={handleChange}
                  />
                  <Input
                    name="nin"
                    placeholder="NIN"
                    value={formData.nin}
                    onChange={handleChange}
                  />
                  <Input
                    name="bvn"
                    placeholder="BVN"
                    value={formData.bvn}
                    onChange={handleChange}
                  />
                  <Input
                    name="vehicleType"
                    placeholder="Vehicle type"
                    value={formData.vehicleType}
                    onChange={handleChange}
                  />
                  <Input
                    name="plateNumber"
                    placeholder="Plate number"
                    value={formData.plateNumber}
                    onChange={handleChange}
                  />
                </div>
                <Input
                  name="coverageArea"
                  className="mt-3"
                  placeholder="Coverage areas, comma separated"
                  value={formData.coverageArea}
                  onChange={handleChange}
                />
                <p className="mt-2 text-xs text-teal-800">
                  Verified providers can receive i.Go-Logistics dispatch
                  assignments.
                </p>
              </div>
            )}

            <label className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
              <input
                type="checkbox"
                name="legalAccepted"
                checked={formData.legalAccepted}
                onChange={handleChange}
                required
                className="mt-1"
              />
              <span>{legalUseWarning}</span>
            </label>

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button
              disabled={submitting}
              className="w-full bg-teal-500 text-white hover:bg-teal-600"
            >
              {submitting
                ? "Creating account..."
                : `Create ${getRoleLabel(role).toLowerCase()} profile`}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link href="/signin" className="font-medium text-teal-700">
              Sign in
            </Link>
          </p>
        </Card>
      </div>
    </main>
  );
}
