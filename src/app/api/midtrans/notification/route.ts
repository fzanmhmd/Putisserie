import { createHash } from "crypto";
import { NextResponse } from "next/server";

import { recordMidtransNotification } from "@/lib/supabase-storefront";

export const runtime = "nodejs";

type MidtransNotificationPayload = {
  order_id?: string;
  status_code?: string;
  gross_amount?: string;
  signature_key?: string;
  transaction_status?: string;
  [key: string]: unknown;
};

const createSignature = ({
  orderId,
  statusCode,
  grossAmount,
  serverKey,
}: {
  orderId: string;
  statusCode: string;
  grossAmount: string;
  serverKey: string;
}) =>
  createHash("sha512")
    .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
    .digest("hex");

export async function POST(request: Request) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;

  if (!serverKey) {
    return NextResponse.json(
      { message: "Server key Midtrans belum dikonfigurasi." },
      { status: 500 },
    );
  }

  let payload: MidtransNotificationPayload;

  try {
    payload = (await request.json()) as MidtransNotificationPayload;
  } catch {
    return NextResponse.json(
      { message: "Payload notification tidak valid." },
      { status: 400 },
    );
  }

  const orderId = payload.order_id ?? "";
  const statusCode = payload.status_code ?? "";
  const grossAmount = payload.gross_amount ?? "";
  const signatureKey = payload.signature_key ?? "";

  if (!orderId || !statusCode || !grossAmount || !signatureKey) {
    return NextResponse.json(
      { message: "Payload notification Midtrans tidak lengkap." },
      { status: 400 },
    );
  }

  const expectedSignature = createSignature({
    orderId,
    statusCode,
    grossAmount,
    serverKey,
  });

  if (signatureKey !== expectedSignature) {
    return NextResponse.json(
      { message: "Signature Midtrans tidak valid." },
      { status: 401 },
    );
  }

  try {
    await recordMidtransNotification(payload);
  } catch {
    return NextResponse.json(
      { message: "Gagal menyimpan notification Midtrans." },
      { status: 502 },
    );
  }

  return NextResponse.json({ received: true });
}
