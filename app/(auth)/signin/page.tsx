"use client";

import type React from "react";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { signIn } from "@/app/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { saveDemoSession } from "@/lib/demo-client-store";
import { getRoleLabel, type UserRole } from "@/lib/demo-marketplace";

const roles: UserRole[] = ["renter", "vendor", "logistics"];

export default function SignInPage() {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>("renter");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    const response = await signIn(email, password);
    setSubmitting(false);

    if (!response.success || !response.user) {
      setError(response.error || "Could not sign in");
      return;
    }

    saveDemoSession(response.user);
    const nextRole =
      response.user.role === "vendor" || response.user.role === "logistics"
        ? response.user.role
        : role;
    router.push(
      nextRole === "renter" ? "/browse" : `/dashboard?role=${nextRole}`,
    );
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#071b2f] p-4">
      <Card className="w-full max-w-md rounded-lg border-white/10 bg-white p-8 shadow-2xl shadow-black/30">
        <Link href="/" className="font-semibold text-[#071b2f]">
          i.Go-rent
        </Link>
        <h1 className="mt-6 text-3xl font-semibold tracking-normal">
          Sign in to i.Go-rent
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Use your production email and password. Your role determines the
          workspace you enter.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email address"
            required
          />
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            required
          />
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
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <Button
            disabled={submitting}
            className="w-full bg-teal-500 text-white hover:bg-teal-600"
          >
            {submitting ? "Signing in..." : "Continue"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Need a profile?{" "}
          <Link href="/signup" className="font-medium text-teal-700">
            Create one
          </Link>
        </p>
      </Card>
    </main>
  );
}
