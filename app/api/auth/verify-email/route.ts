import { NextResponse } from "next/server";

import { verifyEmailToken } from "@/lib/account-email";

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: "Verification link is missing" },
        { status: 400 },
      );
    }

    const result = await verifyEmailToken(token);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, email: result.email });
  } catch (error) {
    console.error("Email verification failed:", error);
    return NextResponse.json(
      { error: "Email verification failed" },
      { status: 500 },
    );
  }
}
