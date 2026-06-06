"use server";

import { sql } from "@/lib/db";
import { queueVerificationEmail } from "@/lib/account-email";
import { hashPassword, comparePasswords } from "@/lib/password";
import { createToken, setAuthCookie, clearAuthCookie } from "@/lib/auth";
import {
  verifyNIN,
  verifyDriversLicense,
  verifyIntlPassport,
  verifyBVN,
  verifyCAC,
} from "@/lib/id-verification";
import { randomUUID } from "crypto";

export type ProductionUserType = "renter" | "vendor" | "logistics";

export async function signUp(formData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  userType: ProductionUserType;
  city: string;
  state: string;
  area?: string;
  nin?: string;
  bvn?: string;
  cac?: string;
  businessName?: string;
  licenseNumber?: string;
  vehicleType?: string;
  plateNumber?: string;
  coverageArea?: string;
  legalAccepted?: boolean;
}) {
  try {
    if (!formData.legalAccepted) {
      return { success: false, error: "Legal-use policy must be accepted" };
    }

    // Check if user exists
    const existingUser = await sql("SELECT id FROM users WHERE email = $1", [
      formData.email,
    ]);

    if (existingUser.length > 0) {
      return { success: false, error: "Email already registered" };
    }

    // Hash password
    const passwordHash = await hashPassword(formData.password);

    // Create user
    const userId = randomUUID();
    const fullName = `${formData.firstName} ${formData.lastName}`.trim();
    const result = await sql(
      `INSERT INTO users (
        id, email, password_hash, full_name, name, role, status, kyc_status,
        first_name, last_name, phone_number, user_type, city, state, country,
        residential_area, legal_use_accepted_at
      )
       VALUES ($1, $2, $3, $4, $4, $5, 'active', 'pending',
        $6, $7, $8, $9, $10, $11, $12, $13, NOW()
       )
       RETURNING id, email, user_type, first_name, last_name, phone_number, city, state, residential_area, email_verified_at`,
      [
        userId,
        formData.email,
        passwordHash,
        fullName,
        formData.userType,
        formData.firstName,
        formData.lastName,
        formData.phoneNumber,
        formData.userType,
        formData.city,
        formData.state,
        "Nigeria",
        formData.area || formData.city,
      ],
    );

    const user = result[0];

    // Create identity verification record
    const ninVerified = Boolean(formData.nin);
    const bvnVerified = Boolean(formData.bvn);
    const cacVerified = Boolean(formData.cac);
    const isVerified =
      formData.userType === "vendor"
        ? ninVerified && bvnVerified
        : formData.userType === "logistics"
          ? ninVerified &&
            bvnVerified &&
            Boolean(
              formData.licenseNumber &&
              formData.vehicleType &&
              formData.plateNumber,
            )
          : ninVerified;

    await sql(
      `INSERT INTO identity_verification (
        user_id, nin, nin_verified, nin_verified_at,
        bvn, bvn_verified, bvn_verified_at,
        cac_number, cac_verified, cac_verified_at,
        drivers_license_number, drivers_license_verified, drivers_license_verified_at,
        verification_status
      )
       VALUES (
        $1, $2, $3, CASE WHEN $3 THEN NOW() ELSE NULL END,
        $4, $5, CASE WHEN $5 THEN NOW() ELSE NULL END,
        $6, $7, CASE WHEN $7 THEN NOW() ELSE NULL END,
        $8, $9, CASE WHEN $9 THEN NOW() ELSE NULL END,
        $10
       )`,
      [
        user.id,
        formData.nin || null,
        ninVerified,
        formData.bvn || null,
        bvnVerified,
        formData.cac || null,
        cacVerified,
        formData.licenseNumber || null,
        Boolean(formData.licenseNumber),
        isVerified ? "verified" : "pending",
      ],
    );

    if (isVerified) {
      await sql(
        `UPDATE users SET is_verified = true, updated_at = NOW() WHERE id = $1`,
        [user.id],
      );
    }

    // If vendor, create vendor verification record
    if (formData.userType === "vendor") {
      await sql(
        `INSERT INTO host_tiers (user_id, current_tier)
         VALUES ($1, $2)`,
        [user.id, bvnVerified ? 2 : ninVerified ? 1 : 0],
      );

      await sql(
        `INSERT INTO vendor_profiles (
          user_id, business_name, cac_number, pickup_area, verification_level, can_publish
        )
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (user_id) DO UPDATE SET
          business_name = EXCLUDED.business_name,
          cac_number = EXCLUDED.cac_number,
          pickup_area = EXCLUDED.pickup_area,
          verification_level = EXCLUDED.verification_level,
          can_publish = EXCLUDED.can_publish,
          updated_at = NOW()`,
        [
          user.id,
          formData.businessName || null,
          formData.cac || null,
          formData.area || formData.city,
          cacVerified && formData.businessName
            ? "business_verified"
            : isVerified
              ? "basic_verified"
              : "vendor_draft",
          isVerified,
        ],
      );
    }

    if (formData.userType === "logistics") {
      const canReceiveDispatch = isVerified;
      await sql(
        `INSERT INTO logistics_provider_profiles (
          user_id, provider_name, license_number, vehicle_type, plate_number,
          coverage_areas, verification_level, can_receive_dispatch
        )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (user_id) DO UPDATE SET
          provider_name = EXCLUDED.provider_name,
          license_number = EXCLUDED.license_number,
          vehicle_type = EXCLUDED.vehicle_type,
          plate_number = EXCLUDED.plate_number,
          coverage_areas = EXCLUDED.coverage_areas,
          verification_level = EXCLUDED.verification_level,
          can_receive_dispatch = EXCLUDED.can_receive_dispatch,
          updated_at = NOW()`,
        [
          user.id,
          formData.businessName ||
            `${formData.firstName} ${formData.lastName} Logistics`,
          formData.licenseNumber || null,
          formData.vehicleType || null,
          formData.plateNumber || null,
          (formData.coverageArea || formData.area || formData.city)
            .split(",")
            .map((area) => area.trim())
            .filter(Boolean),
          canReceiveDispatch ? "logistics_verified" : "logistics_draft",
          canReceiveDispatch,
        ],
      );
    }

    await queueVerificationEmail({
      userId: user.id,
      email: user.email,
      firstName: user.first_name,
    });

    // Create auth token
    const token = await createToken({
      id: user.id,
      userId: user.id,
      email: user.email,
      userType: user.user_type,
    });

    // Set auth cookie
    await setAuthCookie(token);

    return {
      success: true,
      user: {
        id: user.id,
        role: user.user_type === "host" ? "vendor" : user.user_type,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone_number,
        area: user.residential_area || user.city,
        nin: formData.nin || "",
        bvn: formData.bvn || "",
        cac: formData.cac || "",
        businessName: formData.businessName || "",
        licenseNumber: formData.licenseNumber || "",
        vehicleType: formData.vehicleType || "",
        plateNumber: formData.plateNumber || "",
        coverageArea: formData.coverageArea || "",
        verified: isVerified,
        emailVerified: Boolean(user.email_verified_at),
      },
      userId: user.id,
    };
  } catch (error) {
    console.error("Sign up error:", error);
    return { success: false, error: "Failed to create account" };
  }
}

export async function signIn(email: string, password: string) {
  try {
    const result = await sql(
      `SELECT
        u.id, u.email, u.password_hash, u.user_type, u.first_name, u.last_name, u.phone_number,
        u.email_verified_at,
        u.city, u.state, u.residential_area, u.is_verified,
        iv.nin, iv.bvn, iv.cac_number,
        vp.business_name as vendor_business_name,
        lpp.provider_name, lpp.license_number, lpp.vehicle_type, lpp.plate_number, lpp.coverage_areas
       FROM users u
       LEFT JOIN identity_verification iv ON iv.user_id = u.id
       LEFT JOIN vendor_profiles vp ON vp.user_id = u.id
       LEFT JOIN logistics_provider_profiles lpp ON lpp.user_id = u.id
       WHERE u.email = $1`,
      [email],
    );

    if (result.length === 0) {
      return { success: false, error: "Invalid credentials" };
    }

    const user = result[0];
    const passwordMatch = await comparePasswords(password, user.password_hash);

    if (!passwordMatch) {
      return { success: false, error: "Invalid credentials" };
    }

    // Create auth token
    const token = await createToken({
      id: user.id,
      userId: user.id,
      email: user.email,
      userType: user.user_type,
    });

    // Set auth cookie
    await setAuthCookie(token);

    return {
      success: true,
      user: {
        id: user.id,
        role: user.user_type === "host" ? "vendor" : user.user_type,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone_number,
        area: user.residential_area || user.city,
        nin: user.nin || "",
        bvn: user.bvn || "",
        cac: user.cac_number || "",
        businessName: user.vendor_business_name || user.provider_name || "",
        licenseNumber: user.license_number || "",
        vehicleType: user.vehicle_type || "",
        plateNumber: user.plate_number || "",
        coverageArea: Array.isArray(user.coverage_areas)
          ? user.coverage_areas.join(", ")
          : "",
        verified: Boolean(user.is_verified),
        emailVerified: Boolean(user.email_verified_at),
      },
      userId: user.id,
    };
  } catch (error) {
    console.error("Sign in error:", error);
    return { success: false, error: "Failed to sign in" };
  }
}

export async function signOut() {
  await clearAuthCookie();
  return { success: true };
}

export async function submitIDVerification(
  userId: string,
  idType: "nin" | "drivers_license" | "intl_passport" | "bvn" | "cac",
  idNumber: string,
) {
  try {
    let verificationResult;

    // Verify with government database
    switch (idType) {
      case "nin":
        verificationResult = await verifyNIN(idNumber);
        break;
      case "drivers_license":
        verificationResult = await verifyDriversLicense(idNumber, "");
        break;
      case "intl_passport":
        verificationResult = await verifyIntlPassport(idNumber);
        break;
      case "bvn":
        verificationResult = await verifyBVN(idNumber);
        break;
      case "cac":
        verificationResult = await verifyCAC(idNumber);
        break;
      default:
        return { success: false, error: "Invalid ID type" };
    }

    if (!verificationResult.verified) {
      return { success: false, error: verificationResult.error };
    }

    // Update identity verification record
    const updateQuery = `
      UPDATE identity_verification 
      SET ${idType} = $1,
          ${idType}_verified = true,
          ${idType}_verified_at = NOW(),
          verification_status = 'verified',
          updated_at = NOW()
      WHERE user_id = $2
    `;

    await sql(updateQuery, [idNumber, userId]);

    return { success: true, verified: true };
  } catch (error) {
    console.error("ID verification error:", error);
    return { success: false, error: "Verification failed" };
  }
}
