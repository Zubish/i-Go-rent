import { neon } from "@neondatabase/serverless"

let client: ReturnType<typeof neon> | null = null

function getSqlClient() {
  if (!client) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not configured")
    }

    client = neon(process.env.DATABASE_URL)
  }

  return client
}

export async function sql(query: string, params: any[] = []) {
  const queryClient = getSqlClient() as unknown as (query: string, params?: any[]) => Promise<any[]>
  return queryClient(query, params)
}


export async function executeQuery(query: string, params: any[] = []) {
  try {
    const result = await sql(query, params)
    return result
  } catch (error) {
    console.error("Database error:", error)
    throw error
  }
}
