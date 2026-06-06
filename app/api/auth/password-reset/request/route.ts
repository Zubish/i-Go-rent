import { NextResponse } from "next/server";

import { queuePasswordResetEmail } from "@/lib/account-email";
import { sql } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!normalizedEmail) {
      return NextResponse.json(
        { error: "Email address is required" },
        { status: 400 },
      );
    }

    const rows = await sql(
      `SELECT id, email, first_name
       FROM users
       WHERE LOWER(email) = $1
       LIMIT 1`,
      [normalizedEmail],
    );

    if (rows[0]) {
      await queuePasswordResetEmail({
        userId: rows[0].id,
        email: rows[0].email,
        firstName: rows[0].first_name,
      });
    }

    return NextResponse.json({
      success: true,
      message: "If that email exists, a reset link has been sent.",
    });
  } catch (error) {
    console.error("Password reset request failed:", error);
    return NextResponse.json(
      { error: "Password reset request failed" },
      { status: 500 },
    );
  }
}
