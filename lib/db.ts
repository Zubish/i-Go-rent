import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL || "")

export { sql }

export async function executeQuery(query: string, params: any[] = []) {
  try {
    const result = await sql(query, params)
    return result
  } catch (error) {
    console.error("Database error:", error)
    throw error
  }
}
