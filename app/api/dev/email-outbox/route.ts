import { NextResponse } from "next/server";

import { sql } from "@/lib/db";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = url.searchParams.get("email");

  if (!email) {
    return NextResponse.json(
      { error: "Email query is required" },
      { status: 400 },
    );
  }

  try {
    const rows = await sql(
      `SELECT
        id,
        recipient_email,
        email_type,
        subject,
        body,
        action_url,
        status,
        created_at
       FROM email_outbox
       WHERE LOWER(recipient_email) = LOWER($1)
       ORDER BY created_at DESC
       LIMIT 10`,
      [email],
    );

    return NextResponse.json({ emails: rows });
  } catch (error) {
    console.error("Email outbox lookup failed:", error);
    return NextResponse.json(
      { error: "Email outbox lookup failed" },
      { status: 500 },
    );
  }
}
