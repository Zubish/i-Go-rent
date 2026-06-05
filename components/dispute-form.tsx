"use client";

import type React from "react";

import { useState } from "react";
import { createDispute } from "@/app/actions/dispute-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface DisputeFormProps {
  bookingId: string;
  listingId: string;
  otherPartyId: string;
  rentalAmount: number;
}

export function DisputeForm({
  bookingId,
  listingId,
  otherPartyId,
  rentalAmount,
}: DisputeFormProps) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [claimAmount, setClaimAmount] = useState(rentalAmount);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await createDispute({
        bookingId,
        escrowId: bookingId,
        initiatedBy: "demo-current-user",
        opposedBy: otherPartyId,
        reason,
        description,
        evidenceUrls: [],
      });
      setSubmitted(true);
    } catch (error) {
      console.error("Failed to create dispute:", error);
      alert("Failed to create dispute. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <Card className="p-4 bg-blue-50 border-blue-200">
        <p className="text-blue-700 font-semibold">Dispute Submitted</p>
        <p className="text-blue-600 text-sm mt-1">
          Our team will review your dispute within 24-48 hours.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6 border-red-200 bg-red-50">
      <h3 className="text-lg font-semibold mb-4 text-red-700">
        File a Dispute
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Reason for Dispute
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            required
          >
            <option value="">Select a reason</option>
            <option value="item_damaged">Item damaged</option>
            <option value="item_not_returned">Item not returned</option>
            <option value="item_different">
              Item different from description
            </option>
            <option value="unauthorized_charge">Unauthorized charge</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide detailed information about the dispute..."
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            rows={4}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Claim Amount (₦)
          </label>
          <input
            type="number"
            value={claimAmount}
            onChange={(e) => setClaimAmount(Number.parseFloat(e.target.value))}
            max={rentalAmount}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            required
          />
          <p className="text-xs text-gray-600 mt-1">
            Max claimable: ₦{rentalAmount.toLocaleString()}
          </p>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-red-600 hover:bg-red-700"
        >
          {isSubmitting ? "Submitting..." : "Submit Dispute"}
        </Button>
      </form>
    </Card>
  );
}
