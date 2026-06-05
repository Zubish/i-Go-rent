"use server";

import { sql } from "@/lib/db";

// Create dispute
export async function createDispute(data: {
  bookingId: string;
  escrowId: string;
  initiatedBy: string;
  opposedBy: string;
  reason: string;
  description: string;
  evidenceUrls?: string[];
}) {
  try {
    const result = await sql(
      `INSERT INTO disputes (booking_id, escrow_transaction_id, initiated_by, opposed_by, reason, description, evidence_urls)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        data.bookingId,
        data.escrowId,
        data.initiatedBy,
        data.opposedBy,
        data.reason,
        data.description,
        data.evidenceUrls,
      ],
    );

    // Update escrow to disputed
    await sql(
      `UPDATE escrow_transactions SET status = 'disputed' WHERE id = $1`,
      [data.escrowId],
    );

    // Update booking status
    await sql(`UPDATE bookings SET status = 'disputed' WHERE id = $1`, [
      data.bookingId,
    ]);

    return { success: true, dispute: result[0] };
  } catch (error) {
    console.error("Error creating dispute:", error);
    return { success: false, error: "Failed to create dispute" };
  }
}

// Get dispute details
export async function getDispute(disputeId: string) {
  try {
    const result = await sql(
      `SELECT d.*, u1.first_name as initiator_first_name, u1.last_name as initiator_last_name,
              u2.first_name as opposed_first_name, u2.last_name as opposed_last_name,
              b.title as listing_title
       FROM disputes d
       JOIN users u1 ON d.initiated_by = u1.id
       JOIN users u2 ON d.opposed_by = u2.id
       LEFT JOIN listings b ON d.booking_id = b.id
       WHERE d.id = $1`,
      [disputeId],
    );

    if (result.length === 0) {
      return { success: false, error: "Dispute not found" };
    }

    return { success: true, dispute: result[0] };
  } catch (error) {
    console.error("Error fetching dispute:", error);
    return { success: false, error: "Failed to fetch dispute" };
  }
}

// Get user's active disputes
export async function getUserDisputes(userId: string) {
  try {
    const result = await sql(
      `SELECT d.*, u1.first_name as initiator_first_name, u1.last_name as initiator_last_name,
              u2.first_name as opposed_first_name, u2.last_name as opposed_last_name
       FROM disputes d
       JOIN users u1 ON d.initiated_by = u1.id
       JOIN users u2 ON d.opposed_by = u2.id
       WHERE (d.initiated_by = $1 OR d.opposed_by = $1) AND d.status != 'resolved'
       ORDER BY d.created_at DESC`,
      [userId],
    );

    return { success: true, disputes: result };
  } catch (error) {
    console.error("Error fetching disputes:", error);
    return { success: false, error: "Failed to fetch disputes" };
  }
}

// Get disputes for user (alias for getUserDisputes)
export async function getDisputesForUser(userId: string) {
  return getUserDisputes(userId);
}
