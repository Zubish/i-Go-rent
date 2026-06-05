"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getHostTierStatus,
  getTierBadge,
} from "@/app/actions/host-tier-actions";

export default function HostTierProgress({ userId }: { userId: string }) {
  const [tierStatus, setTierStatus] = useState<any>(null);
  const [currentBadge, setCurrentBadge] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTierStatus = async () => {
      const status = await getHostTierStatus(userId);
      setTierStatus(status);

      if (status) {
        const badge = await getTierBadge(status.currentTier);
        setCurrentBadge(badge);
      }

      setLoading(false);
    };

    fetchTierStatus();
  }, [userId]);

  if (loading) {
    return <div>Loading tier status...</div>;
  }

  if (!tierStatus) {
    return <div>Failed to load tier information</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Host Verification Tiers</h2>
          <div
            className={`px-4 py-2 rounded-full text-white font-semibold bg-${currentBadge.color}-500`}
          >
            {currentBadge.name}
          </div>
        </div>

        <p className="text-gray-600 mb-6">{currentBadge.description}</p>

        {/* Tier Progress */}
        <div className="space-y-4">
          {/* Tier 1 */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-lg">Tier 1: Trusted Host</h3>
              {tierStatus.tier1.completed && (
                <span className="text-green-600 font-semibold">
                  ✓ Completed
                </span>
              )}
            </div>

            <div className="text-sm text-gray-600 mb-4">
              Verify with government ID
            </div>

            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={tierStatus.tier1.nin}
                  disabled
                  className="mr-3"
                />
                <span>NIN (National ID)</span>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={tierStatus.tier1.driversLicense}
                  disabled
                  className="mr-3"
                />
                <span>Driver's License</span>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={tierStatus.tier1.intlPassport}
                  disabled
                  className="mr-3"
                />
                <span>International Passport</span>
              </div>
            </div>

            {!tierStatus.tier1.completed && (
              <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700">
                Verify Documents
              </Button>
            )}
          </div>

          {/* Tier 2 */}
          <div
            className={`border rounded-lg p-4 ${tierStatus.currentTier < 1 ? "opacity-50" : ""}`}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-lg">Tier 2: Verified Host</h3>
              {tierStatus.tier2.completed && (
                <span className="text-green-600 font-semibold">
                  ✓ Completed
                </span>
              )}
            </div>

            <div className="text-sm text-gray-600 mb-4">
              Bank Verification Number (BVN)
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={tierStatus.tier2.bvn}
                disabled
                className="mr-3"
              />
              <span>BVN Verified</span>
            </div>

            {!tierStatus.tier2.completed && tierStatus.currentTier >= 1 && (
              <Button className="w-full mt-4 bg-green-600 hover:bg-green-700">
                Add BVN
              </Button>
            )}
          </div>

          {/* Tier 3 */}
          <div
            className={`border rounded-lg p-4 ${tierStatus.currentTier < 2 ? "opacity-50" : ""}`}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-lg">Tier 3: Business Host</h3>
              {tierStatus.tier3.completed && (
                <span className="text-green-600 font-semibold">
                  ✓ Completed
                </span>
              )}
            </div>

            <div className="text-sm text-gray-600 mb-4">
              Corporate Affairs Commission (CAC) Certificate
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={tierStatus.tier3.cac}
                disabled
                className="mr-3"
              />
              <span>CAC Verified</span>
            </div>

            {!tierStatus.tier3.completed && tierStatus.currentTier >= 2 && (
              <Button className="w-full mt-4 bg-purple-600 hover:bg-purple-700">
                Add CAC
              </Button>
            )}
          </div>
        </div>

        {/* Benefits */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-bold mb-2">Current Benefits:</h4>
          <ul className="space-y-1">
            {currentBadge.benefits.map((benefit: string, idx: number) => (
              <li key={idx} className="text-sm text-gray-700">
                ✓ {benefit}
              </li>
            ))}
          </ul>
        </div>
      </Card>
    </div>
  );
}
