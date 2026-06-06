"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function VerifyEmailPage() {
  const [state, setState] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("Confirming your email...");

  useEffect(() => {
    async function verify() {
      const token = new URLSearchParams(window.location.search).get("token");

      if (!token) {
        setState("error");
        setMessage("Verification link is missing.");
        return;
      }

      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await response.json();

        if (!response.ok) {
          setState("error");
          setMessage(data.error || "Verification link could not be used.");
          return;
        }

        setState("success");
        setMessage("Your email has been confirmed.");
      } catch {
        setState("error");
        setMessage("Email verification failed.");
      }
    }

    verify();
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7fbfb] p-6">
      <Card className="w-full max-w-md rounded-lg border-slate-200 bg-white p-8 text-center shadow-sm">
        <Link href="/" className="font-semibold text-[#071b2f]">
          i.Go-rent
        </Link>
        <h1 className="mt-6 text-3xl font-semibold tracking-normal">
          {state === "success" ? "Email confirmed" : "Confirm email"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>
        <Button
          asChild
          className="mt-6 w-full bg-[#071b2f] text-white hover:bg-[#0b2b49]"
        >
          <Link href={state === "success" ? "/dashboard" : "/signin"}>
            {state === "success" ? "Continue" : "Back to sign in"}
          </Link>
        </Button>
      </Card>
    </main>
  );
}
