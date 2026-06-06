"use client";

import type React from "react";

import { useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Could not start password reset.");
        return;
      }

      setMessage(data.message);
    } catch {
      setError("Could not start password reset.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#071b2f] p-4">
      <Card className="w-full max-w-md rounded-lg border-white/10 bg-white p-8 shadow-2xl shadow-black/30">
        <Link href="/" className="font-semibold text-[#071b2f]">
          i.Go-rent
        </Link>
        <h1 className="mt-6 text-3xl font-semibold tracking-normal">
          Reset password
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Enter your account email. We will send a reset link if it exists.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email address"
            required
          />
          {message && (
            <div
              className="rounded-md border border-teal-200 bg-teal-50 p-3 text-sm text-teal-900"
              role="status"
              aria-live="polite"
            >
              {message}
            </div>
          )}
          {error && (
            <div
              className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              role="alert"
            >
              {error}
            </div>
          )}
          <Button
            disabled={submitting}
            className="w-full bg-teal-500 text-white hover:bg-teal-600"
          >
            {submitting ? "Sending..." : "Send reset link"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-600">
          Remembered it?{" "}
          <Link href="/signin" className="font-medium text-teal-700">
            Sign in
          </Link>
        </p>
      </Card>
    </main>
  );
}
