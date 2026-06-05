import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function GET() {
  const authUser = await getCurrentUser();

  if (!authUser) {
    return NextResponse.json({ user: null });
  }

  try {
    const result = await sql(
      `SELECT
        u.id, u.email, u.user_type, u.first_name, u.last_name, u.phone_number,
        u.city, u.residential_area, u.is_verified,
        iv.nin, iv.bvn, iv.cac_number,
        vp.business_name as vendor_business_name,
        lpp.provider_name, lpp.license_number, lpp.vehicle_type, lpp.plate_number, lpp.coverage_areas
       FROM users u
       LEFT JOIN identity_verification iv ON iv.user_id = u.id
       LEFT JOIN vendor_profiles vp ON vp.user_id = u.id
       LEFT JOIN logistics_provider_profiles lpp ON lpp.user_id = u.id
       WHERE u.id = $1`,
      [authUser.userId],
    );

    if (result.length === 0) {
      return NextResponse.json({ user: null });
    }

    const user = result[0];

    return NextResponse.json({
      user: {
        id: user.id,
        role: user.user_type === "host" ? "vendor" : user.user_type,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone_number,
        area: user.residential_area || user.city || "Lagos",
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
      },
    });
  } catch (error) {
    console.error("Session lookup failed:", error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
