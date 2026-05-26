/**
 * Razorpay X (Payouts) client
 *
 * Razorpay X is a separate product from Razorpay Subscriptions.
 * It uses different API keys (RAZORPAY_X_KEY_ID / RAZORPAY_X_KEY_SECRET)
 * and a different base URL.
 *
 * Docs: https://razorpay.com/docs/razorpay-x/payouts/apis/
 */

const RAZORPAY_X_BASE = "https://api.razorpay.com/v1";

function getHeaders() {
  const keyId = process.env.RAZORPAY_X_KEY_ID;
  const keySecret = process.env.RAZORPAY_X_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error(
      "Razorpay X is not configured. Set RAZORPAY_X_KEY_ID and RAZORPAY_X_KEY_SECRET."
    );
  }

  const credentials = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  return {
    Authorization: `Basic ${credentials}`,
    "Content-Type": "application/json",
  };
}

async function razorpayXFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${RAZORPAY_X_BASE}${path}`, {
    ...options,
    headers: { ...getHeaders(), ...(options.headers ?? {}) },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Razorpay X error ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

export interface RazorpayXContact {
  id: string;
  name: string;
  email: string;
  type: string;
}

export interface RazorpayXFundAccount {
  id: string;
  contact_id: string;
  account_type: string;
}

export interface RazorpayXPayout {
  id: string;
  status: string;
  amount: number;
  currency: string;
}

/** Create a Razorpay X contact for an affiliate */
export async function createContact({
  name,
  email,
}: {
  name: string;
  email: string;
}): Promise<RazorpayXContact> {
  return razorpayXFetch<RazorpayXContact>("/contacts", {
    method: "POST",
    body: JSON.stringify({
      name,
      email,
      type: "vendor",
      reference_id: email,
    }),
  });
}

/** Create a UPI fund account linked to a contact */
export async function createUPIFundAccount({
  contactId,
  upiId,
  name,
}: {
  contactId: string;
  upiId: string;
  name: string;
}): Promise<RazorpayXFundAccount> {
  return razorpayXFetch<RazorpayXFundAccount>("/fund_accounts", {
    method: "POST",
    body: JSON.stringify({
      contact_id: contactId,
      account_type: "vpa",
      vpa: {
        address: upiId,
      },
    }),
  });
}

/** Initiate a payout to a fund account */
export async function createPayout({
  fundAccountId,
  amountInPaise,
  narration,
  referenceId,
  accountNumber,
}: {
  fundAccountId: string;
  amountInPaise: bigint;
  narration: string;
  referenceId: string;
  accountNumber: string; // Razorpay X account number (from dashboard)
}): Promise<RazorpayXPayout> {
  return razorpayXFetch<RazorpayXPayout>("/payouts", {
    method: "POST",
    body: JSON.stringify({
      account_number: accountNumber,
      fund_account_id: fundAccountId,
      amount: Number(amountInPaise),
      currency: "INR",
      mode: "UPI",
      purpose: "payout",
      queue_if_low_balance: true,
      reference_id: referenceId,
      narration,
    }),
  });
}
