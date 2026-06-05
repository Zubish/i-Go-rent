"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { submitIDVerification } from "@/app/actions/auth-actions";
import { useRouter } from "next/navigation";

export default function VerifyIDPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [idType, setIdType] = useState<
    "nin" | "drivers_license" | "intl_passport" | "bvn" | "cac"
  >("nin");
  const [idNumber, setIdNumber] = useState("");
  const userId = "temp-user-id"; // This should come from session/auth context

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await submitIDVerification(userId, idType, idNumber);

      if (result.success) {
        setSuccess(true);
        setTimeout(() => router.push("/dashboard"), 2000);
      } else {
        setError(result.error || "Verification failed");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="p-8">
          <h1 className="text-2xl font-bold mb-2">
            Government ID Verification
          </h1>
          <p className="text-gray-600 mb-8">
            Verify your identity to unlock all features
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
              Verification successful! Redirecting...
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <select
              value={idType}
              onChange={(e) => setIdType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="nin">NIN (National ID)</option>
              <option value="drivers_license">Driver's License</option>
              <option value="intl_passport">International Passport</option>
              <option value="bvn">BVN (Bank Verification)</option>
              <option value="cac">CAC (Corporate)</option>
            </select>

            <Input
              type="text"
              placeholder="Enter ID Number"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              required
            />

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? "Verifying..." : "Verify Identity"}
            </Button>
          </form>

          <p className="text-sm text-gray-500 mt-6 text-center">
            Your information is secure and encrypted. We verify against official
            government databases.
          </p>
        </div>
      </Card>
    </div>
  );
}
