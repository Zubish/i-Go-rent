// Flutterwave Integration for Nigerian Naira Payments

export interface FlutterwavePaymentPayload {
  tx_ref: string // Unique transaction reference
  amount: number
  currency: string // NGN for Nigerian Naira
  payment_options: string // "card,mobilemoney,ussd"
  customer: {
    email: string
    phonenumber: string
    name: string
  }
  customizations: {
    title: string
    description: string
    logo: string
  }
  redirect_url: string
}

export interface FlutterwaveWebhookPayload {
  event: string
  data: {
    id: number
    tx_ref: string
    flw_ref: string
    device_fingerprint: string
    amount: number
    currency: string
    charged_amount: number
    app_fee: number
    merchant_fee: number
    processor_response: string
    auth_model: string
    customer: {
      id: number
      customer_email: string
      customer_name: string
      customer_phone: string
    }
    status: string // "successful", "failed", "pending"
    payment_type: string
    created_at: string
    account_id: number
    merchant_id: number
  }
}

export async function initializeFlutterwavePayment(payload: FlutterwavePaymentPayload) {
  try {
    const response = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()

    if (!response.ok) {
      return { success: false, error: data.message }
    }

    return {
      success: true,
      link: data.data.link,
      transactionId: data.data.id,
    }
  } catch (error) {
    console.error("Flutterwave initialization error:", error)
    return { success: false, error: "Payment initialization failed" }
  }
}

export async function verifyFlutterwavePayment(transactionId: string) {
  try {
    const response = await fetch(`https://api.flutterwave.com/v3/transactions/${transactionId}/verify`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return { success: false, error: data.message }
    }

    return {
      success: true,
      status: data.data.status,
      amount: data.data.amount,
      reference: data.data.tx_ref,
    }
  } catch (error) {
    console.error("Flutterwave verification error:", error)
    return { success: false, error: "Payment verification failed" }
  }
}

export async function refundFlutterwavePayment(transactionId: string) {
  try {
    const response = await fetch(`https://api.flutterwave.com/v3/transactions/${transactionId}/refund`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return { success: false, error: data.message }
    }

    return {
      success: true,
      refundId: data.data.id,
    }
  } catch (error) {
    console.error("Flutterwave refund error:", error)
    return { success: false, error: "Refund failed" }
  }
}
