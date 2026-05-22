"use server"

import { sql } from "@/lib/db"
import { hashPassword, comparePasswords } from "@/lib/password"
import { createToken, setAuthCookie, clearAuthCookie } from "@/lib/auth"
import { verifyNIN, verifyDriversLicense, verifyIntlPassport, verifyBVN, verifyCAC } from "@/lib/id-verification"

export async function signUp(formData: {
  email: string
  password: string
  firstName: string
  lastName: string
  phoneNumber: string
  userType: "renter" | "host" | "both"
  city: string
  state: string
}) {
  try {
    // Check if user exists
    const existingUser = await sql("SELECT id FROM users WHERE email = $1", [formData.email])

    if (existingUser.length > 0) {
      return { success: false, error: "Email already registered" }
    }

    // Hash password
    const passwordHash = await hashPassword(formData.password)

    // Create user
    const result = await sql(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone_number, user_type, city, state, country)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, email, user_type`,
      [
        formData.email,
        passwordHash,
        formData.firstName,
        formData.lastName,
        formData.phoneNumber,
        formData.userType,
        formData.city,
        formData.state,
        "Nigeria",
      ],
    )

    const user = result[0]

    // Create identity verification record
    await sql(
      `INSERT INTO identity_verification (user_id, verification_status)
       VALUES ($1, $2)`,
      [user.id, "pending"],
    )

    // If host, create host tier record
    if (formData.userType === "host" || formData.userType === "both") {
      await sql(
        `INSERT INTO host_tiers (user_id, current_tier)
         VALUES ($1, $2)`,
        [user.id, 0],
      )
    }

    // Create auth token
    const token = await createToken({
      id: user.id,
      userId: user.id,
      email: user.email,
      userType: user.user_type,
    })

    // Set auth cookie
    await setAuthCookie(token)

    return { success: true, userId: user.id }
  } catch (error) {
    console.error("Sign up error:", error)
    return { success: false, error: "Failed to create account" }
  }
}

export async function signIn(email: string, password: string) {
  try {
    const result = await sql("SELECT id, email, password_hash, user_type FROM users WHERE email = $1", [email])

    if (result.length === 0) {
      return { success: false, error: "Invalid credentials" }
    }

    const user = result[0]
    const passwordMatch = await comparePasswords(password, user.password_hash)

    if (!passwordMatch) {
      return { success: false, error: "Invalid credentials" }
    }

    // Create auth token
    const token = await createToken({
      id: user.id,
      userId: user.id,
      email: user.email,
      userType: user.user_type,
    })

    // Set auth cookie
    await setAuthCookie(token)

    return { success: true, userId: user.id }
  } catch (error) {
    console.error("Sign in error:", error)
    return { success: false, error: "Failed to sign in" }
  }
}

export async function signOut() {
  await clearAuthCookie()
  return { success: true }
}

export async function submitIDVerification(
  userId: string,
  idType: "nin" | "drivers_license" | "intl_passport" | "bvn" | "cac",
  idNumber: string,
) {
  try {
    let verificationResult

    // Verify with government database
    switch (idType) {
      case "nin":
        verificationResult = await verifyNIN(idNumber)
        break
      case "drivers_license":
        verificationResult = await verifyDriversLicense(idNumber, "")
        break
      case "intl_passport":
        verificationResult = await verifyIntlPassport(idNumber)
        break
      case "bvn":
        verificationResult = await verifyBVN(idNumber)
        break
      case "cac":
        verificationResult = await verifyCAC(idNumber)
        break
      default:
        return { success: false, error: "Invalid ID type" }
    }

    if (!verificationResult.verified) {
      return { success: false, error: verificationResult.error }
    }

    // Update identity verification record
    const updateQuery = `
      UPDATE identity_verification 
      SET ${idType} = $1,
          ${idType}_verified = true,
          ${idType}_verified_at = NOW(),
          verification_status = 'verified',
          updated_at = NOW()
      WHERE user_id = $2
    `

    await sql(updateQuery, [idNumber, userId])

    return { success: true, verified: true }
  } catch (error) {
    console.error("ID verification error:", error)
    return { success: false, error: "Verification failed" }
  }
}
