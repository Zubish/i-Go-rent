import { seedListings } from "@/lib/demo-marketplace";
import { sql } from "@/lib/db";

export type MarketplaceHealth = {
  status: "healthy" | "degraded";
  source: "database" | "seeded_fallback";
  checkedAt: string;
  counts: {
    databaseListings: number | null;
    databaseBookings: number | null;
    seedListings: number;
  };
  checks: {
    databaseConfigured: boolean;
    requiredTablesPresent: boolean;
    hasDatabaseListings: boolean;
  };
  issues: string[];
};

const requiredTables = [
  "users",
  "categories",
  "listings",
  "bookings",
  "escrow_transactions",
  "dispatch_assignments",
];

export async function getMarketplaceHealth(): Promise<MarketplaceHealth> {
  const checkedAt = new Date().toISOString();
  const databaseConfigured = Boolean(process.env.DATABASE_URL);

  if (!databaseConfigured) {
    return {
      status: "degraded",
      source: "seeded_fallback",
      checkedAt,
      counts: {
        databaseListings: null,
        databaseBookings: null,
        seedListings: seedListings.length,
      },
      checks: {
        databaseConfigured: false,
        requiredTablesPresent: false,
        hasDatabaseListings: false,
      },
      issues: ["DATABASE_URL is not configured"],
    };
  }

  try {
    const tableRows = await sql(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_name = ANY($1)`,
      [requiredTables],
    );
    const presentTables = new Set(tableRows.map((row) => row.table_name));
    const requiredTablesPresent = requiredTables.every((table) =>
      presentTables.has(table),
    );

    let databaseListings: number | null = null;
    let databaseBookings: number | null = null;

    if (requiredTablesPresent) {
      const rows = await sql(
        `SELECT
           (SELECT COUNT(*)::int FROM listings WHERE available = TRUE) AS listings_count,
           (SELECT COUNT(*)::int FROM bookings) AS bookings_count`,
      );
      databaseListings = Number(rows[0]?.listings_count ?? 0);
      databaseBookings = Number(rows[0]?.bookings_count ?? 0);
    }

    const issues: string[] = [];
    if (!requiredTablesPresent) {
      issues.push("Required marketplace tables are missing");
    }
    if (requiredTablesPresent && !databaseListings) {
      issues.push("Database has no available listings");
    }

    const healthy = requiredTablesPresent && Number(databaseListings) > 0;

    return {
      status: healthy ? "healthy" : "degraded",
      source: healthy ? "database" : "seeded_fallback",
      checkedAt,
      counts: {
        databaseListings,
        databaseBookings,
        seedListings: seedListings.length,
      },
      checks: {
        databaseConfigured: true,
        requiredTablesPresent,
        hasDatabaseListings: Number(databaseListings) > 0,
      },
      issues,
    };
  } catch (error) {
    return {
      status: "degraded",
      source: "seeded_fallback",
      checkedAt,
      counts: {
        databaseListings: null,
        databaseBookings: null,
        seedListings: seedListings.length,
      },
      checks: {
        databaseConfigured: true,
        requiredTablesPresent: false,
        hasDatabaseListings: false,
      },
      issues: [
        error instanceof Error ? error.message : "Database health check failed",
      ],
    };
  }
}
