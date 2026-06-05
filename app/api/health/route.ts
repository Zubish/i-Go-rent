import { NextResponse } from "next/server";

import { getMarketplaceHealth } from "@/lib/marketplace-health";

export const dynamic = "force-dynamic";

export async function GET() {
  const marketplace = await getMarketplaceHealth();

  return NextResponse.json(
    {
      ok: marketplace.status === "healthy",
      marketplace,
    },
    {
      status: marketplace.status === "healthy" ? 200 : 207,
    },
  );
}
