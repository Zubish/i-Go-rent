import { NextResponse } from "next/server";

import { queueVerificationEmail } from "@/lib/account-email";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function POST() {
  const authUser = await getCurrentUser();

  if (!authUser) {
    return NextResponse.json(
      { error: "Sign in before confirming your email" },
      { status: 401 },
    );
  }

  try {
    const rows = await sql(
      `SELECT id, email, first_name, email_verified_at
       FROM users
       WHERE id = $1
       LIMIT 1`,
      [authUser.userId],
    );
    const user = rows[0];

    if (!user) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    if (user.email_verified_at) {
      return NextResponse.json({ success: true, alreadyVerified: true });
    }

    await queueVerificationEmail({
      userId: user.id,
      email: user.email,
      firstName: user.first_name,
    });

    return NextResponse.json({ success: true, delivery: "outbox" });
  } catch (error) {
    console.error("Verification resend failed:", error);
    return NextResponse.json(
      { error: "Verification link could not be sent" },
      { status: 500 },
    );
  }
}
