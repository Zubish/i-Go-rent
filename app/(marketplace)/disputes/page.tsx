import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { getDisputesForUser } from "@/app/actions/dispute-actions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function DisputesPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="p-8 text-center">
            <p className="text-gray-600">Please sign in to view disputes</p>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">My Disputes</h1>

        <Suspense
          fallback={
            <Card className="p-8 text-center">Loading disputes...</Card>
          }
        >
          <DisputesSection userId={user.id} />
        </Suspense>
      </div>
    </main>
  );
}

async function DisputesSection({ userId }: { userId: string }) {
  const response = await getDisputesForUser(userId);

  if (!response.success) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-600">Failed to load disputes</p>
      </Card>
    );
  }

  const disputes = response.disputes || [];

  if (disputes.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-600">You have no disputes</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {disputes.map((dispute) => (
        <Card key={dispute.id} className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold capitalize">
                {dispute.reason.replace(/_/g, " ")}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Booking #{dispute.booking_id.slice(0, 8)}
              </p>
            </div>
            <Badge
              variant={dispute.status === "resolved" ? "default" : "secondary"}
            >
              {dispute.status}
            </Badge>
          </div>

          <p className="text-gray-700 mb-4">{dispute.description}</p>

          <div className="flex justify-between items-center">
            <span className="font-semibold text-lg">
              ₦{(dispute.claim_amount || 0).toLocaleString()}
            </span>
            <Link
              href={`/disputes/${dispute.id}`}
              className="text-blue-600 hover:text-blue-700"
            >
              View Details →
            </Link>
          </div>
        </Card>
      ))}
    </div>
  );
}
