import { NextResponse } from "next/server";

import { resetPasswordWithToken } from "@/lib/account-email";
import { hashPassword } from "@/lib/password";

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Reset link and new password are required" },
        { status: 400 },
      );
    }

    if (String(password).length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }

    const passwordHash = await hashPassword(password);
    const result = await resetPasswordWithToken(token, passwordHash);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, email: result.email });
  } catch (error) {
    console.error("Password reset confirmation failed:", error);
    return NextResponse.json(
      { error: "Password reset confirmation failed" },
      { status: 500 },
    );
  }
}
