"use server";

import { sql } from "@/lib/db";
import {
  verifyNIN,
  verifyDriversLicense,
  verifyIntlPassport,
  verifyBVN,
  verifyCAC,
} from "@/lib/id-verification";

export interface HostTierStatus {
  currentTier: number;
  tier1: {
    completed: boolean;
    nin: boolean;
    driversLicense: boolean;
    intlPassport: boolean;
  };
  tier2: {
    completed: boolean;
    bvn: boolean;
  };
  tier3: {
    completed: boolean;
    cac: boolean;
  };
}

// Get host tier status
export async function getHostTierStatus(
  userId: string,
): Promise<HostTierStatus | null> {
  try {
    const result = await sql("SELECT * FROM host_tiers WHERE user_id = $1", [
      userId,
    ]);

    if (result.length === 0) {
      return null;
    }

    const tier = result[0];

    return {
      currentTier: tier.current_tier,
      tier1: {
        completed: tier.tier_1_completed,
        nin: tier.tier_1_nin,
        driversLicense: tier.tier_1_drivers_license,
        intlPassport: tier.tier_1_intl_passport,
      },
      tier2: {
        completed: tier.tier_2_completed,
        bvn: tier.tier_2_bvn,
      },
      tier3: {
        completed: tier.tier_3_completed,
        cac: tier.tier_3_cac,
      },
    };
  } catch (error) {
    console.error("Error fetching host tier:", error);
    return null;
  }
}

// Complete Tier 1 (NIN, Driver's License, International Passport)
export async function completeTier1(
  userId: string,
): Promise<{ success: boolean; message: string }> {
  try {
    // Check if all tier 1 requirements are met
    const idVerfication = await sql(
      `SELECT tier_1_nin, tier_1_drivers_license, tier_1_intl_passport FROM host_tiers WHERE user_id = $1`,
      [userId],
    );

    if (idVerfication.length === 0) {
      return { success: false, message: "Host record not found" };
    }

    const tier = idVerfication[0];

    if (
      !tier.tier_1_nin ||
      !tier.tier_1_drivers_license ||
      !tier.tier_1_intl_passport
    ) {
      return {
        success: false,
        message: "All Tier 1 documents must be verified",
      };
    }

    // Update host tier
    await sql(
      `UPDATE host_tiers 
       SET tier_1_completed = true, 
           tier_1_completed_at = NOW(),
           current_tier = 1,
           updated_at = NOW()
       WHERE user_id = $1`,
      [userId],
    );

    return { success: true, message: "Tier 1 completed successfully" };
  } catch (error) {
    console.error("Error completing tier 1:", error);
    return { success: false, message: "Failed to complete tier 1" };
  }
}

// Complete Tier 2 (BVN)
export async function completeTier2(
  userId: string,
): Promise<{ success: boolean; message: string }> {
  try {
    // Check if Tier 1 is completed first
    const tierStatus = await sql(
      "SELECT current_tier, tier_2_bvn FROM host_tiers WHERE user_id = $1",
      [userId],
    );

    if (tierStatus.length === 0) {
      return { success: false, message: "Host record not found" };
    }

    const tier = tierStatus[0];

    if (tier.current_tier < 1) {
      return { success: false, message: "Complete Tier 1 first" };
    }

    if (!tier.tier_2_bvn) {
      return { success: false, message: "BVN must be verified" };
    }

    // Update host tier
    await sql(
      `UPDATE host_tiers 
       SET tier_2_completed = true, 
           tier_2_completed_at = NOW(),
           current_tier = 2,
           updated_at = NOW()
       WHERE user_id = $1`,
      [userId],
    );

    return { success: true, message: "Tier 2 completed successfully" };
  } catch (error) {
    console.error("Error completing tier 2:", error);
    return { success: false, message: "Failed to complete tier 2" };
  }
}

// Complete Tier 3 (CAC)
export async function completeTier3(
  userId: string,
): Promise<{ success: boolean; message: string }> {
  try {
    // Check if Tier 2 is completed first
    const tierStatus = await sql(
      "SELECT current_tier, tier_3_cac FROM host_tiers WHERE user_id = $1",
      [userId],
    );

    if (tierStatus.length === 0) {
      return { success: false, message: "Host record not found" };
    }

    const tier = tierStatus[0];

    if (tier.current_tier < 2) {
      return { success: false, message: "Complete Tier 2 first" };
    }

    if (!tier.tier_3_cac) {
      return { success: false, message: "CAC must be verified" };
    }

    // Update host tier
    await sql(
      `UPDATE host_tiers 
       SET tier_3_completed = true, 
           tier_3_completed_at = NOW(),
           current_tier = 3,
           updated_at = NOW()
       WHERE user_id = $1`,
      [userId],
    );

    return { success: true, message: "Tier 3 completed successfully" };
  } catch (error) {
    console.error("Error completing tier 3:", error);
    return { success: false, message: "Failed to complete tier 3" };
  }
}

// Verify specific ID for host tier
export async function verifyIDForHostTier(
  userId: string,
  idType: string,
  idNumber: string,
) {
  try {
    let verificationResult;

    switch (idType) {
      case "nin":
        verificationResult = await verifyNIN(idNumber);
        if (verificationResult.verified) {
          await sql(
            `UPDATE host_tiers SET tier_1_nin = true, updated_at = NOW() WHERE user_id = $1`,
            [userId],
          );
        }
        break;
      case "drivers_license":
        verificationResult = await verifyDriversLicense(idNumber, "");
        if (verificationResult.verified) {
          await sql(
            `UPDATE host_tiers SET tier_1_drivers_license = true, updated_at = NOW() WHERE user_id = $1`,
            [userId],
          );
        }
        break;
      case "intl_passport":
        verificationResult = await verifyIntlPassport(idNumber);
        if (verificationResult.verified) {
          await sql(
            `UPDATE host_tiers SET tier_1_intl_passport = true, updated_at = NOW() WHERE user_id = $1`,
            [userId],
          );
        }
        break;
      case "bvn":
        verificationResult = await verifyBVN(idNumber);
        if (verificationResult.verified) {
          await sql(
            `UPDATE host_tiers SET tier_2_bvn = true, updated_at = NOW() WHERE user_id = $1`,
            [userId],
          );
        }
        break;
      case "cac":
        verificationResult = await verifyCAC(idNumber);
        if (verificationResult.verified) {
          await sql(
            `UPDATE host_tiers SET tier_3_cac = true, updated_at = NOW() WHERE user_id = $1`,
            [userId],
          );
        }
        break;
      default:
        return { success: false, error: "Invalid ID type" };
    }

    if (!verificationResult.verified) {
      return { success: false, error: verificationResult.error };
    }

    return { success: true, verified: true };
  } catch (error) {
    console.error("Error verifying ID:", error);
    return { success: false, error: "Verification failed" };
  }
}

// Get tier badge/benefits
export async function getTierBadge(tier: number) {
  const badges = {
    0: {
      name: "Unverified",
      color: "gray",
      benefits: [],
      description: "Complete identity verification to unlock features",
    },
    1: {
      name: "Trusted Host",
      color: "blue",
      benefits: ["List items for rent", "Accept bookings", "Receive payments"],
      description: "Verified with government ID",
    },
    2: {
      name: "Verified Host",
      color: "green",
      benefits: [
        "Higher listing visibility",
        "Priority support",
        "Featured badge",
      ],
      description: "Additional BVN verification",
    },
    3: {
      name: "Business Host",
      color: "purple",
      benefits: [
        "Corporate badge",
        "Bulk listings",
        "API access",
        "Advanced analytics",
      ],
      description: "Full corporate verification",
    },
  };

  return badges[tier as keyof typeof badges] || badges[0];
}
