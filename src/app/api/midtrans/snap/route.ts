import { NextResponse } from "next/server";

import { products } from "@/lib/putisserie-data";

export const runtime = "nodejs";

type CheckoutItem = {
  productId: string;
  quantity: number;
};

type CheckoutDeliveryDetails = {
  name?: string;
  phone?: string;
  address?: string;
  province?: string;
  city?: string;
  district?: string;
  village?: string;
  deliveryDate?: string;
  note?: string;
};

type CheckoutRequest = {
  items?: CheckoutItem[];
  deliveryDetails?: CheckoutDeliveryDetails;
  selectedPaymentMethod?: string;
};

const deliveryFee = 15000;
const serviceFee = 4500;

const getMidtransEndpoint = () =>
  process.env.MIDTRANS_IS_PRODUCTION === "true"
    ? "https://app.midtrans.com/snap/v1/transactions"
    : "https://app.sandbox.midtrans.com/snap/v1/transactions";

const toPositiveInteger = (value: unknown) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.max(0, Math.floor(parsed));
};

const cleanText = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

export async function POST(request: Request) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;

  if (!serverKey) {
    return NextResponse.json(
      { message: "Server key Midtrans belum dikonfigurasi." },
      { status: 500 },
    );
  }

  let body: CheckoutRequest;

  try {
    body = (await request.json()) as CheckoutRequest;
  } catch {
    return NextResponse.json(
      { message: "Payload checkout tidak valid." },
      { status: 400 },
    );
  }

  const deliveryDetails = body.deliveryDetails ?? {};
  const customerName = cleanText(deliveryDetails.name);
  const customerPhone = cleanText(deliveryDetails.phone);
  const streetAddress = cleanText(deliveryDetails.address);
  const province = cleanText(deliveryDetails.province);
  const city = cleanText(deliveryDetails.city);
  const district = cleanText(deliveryDetails.district);
  const village = cleanText(deliveryDetails.village);
  const deliveryDate = cleanText(deliveryDetails.deliveryDate);

  if (
    !customerName ||
    !customerPhone ||
    !streetAddress ||
    !province ||
    !city ||
    !district ||
    !village ||
    !deliveryDate
  ) {
    return NextResponse.json(
      { message: "Lengkapi detail pengiriman sebelum membayar." },
      { status: 400 },
    );
  }

  const checkoutItems = (body.items ?? [])
    .map((item) => ({
      product: products.find((product) => product.id === item.productId),
      quantity: toPositiveInteger(item.quantity),
    }))
    .filter((item) => item.product && item.quantity > 0);

  if (checkoutItems.length === 0) {
    return NextResponse.json(
      { message: "Keranjang kosong atau produk tidak valid." },
      { status: 400 },
    );
  }

  const productItemDetails = checkoutItems.map(({ product, quantity }) => ({
    id: product!.id,
    price: product!.price,
    quantity,
    name: product!.name.slice(0, 50),
  }));
  const grossAmount =
    productItemDetails.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    ) +
    deliveryFee +
    serviceFee;
  const orderId = `PUT-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase()}`;
  const [firstName, ...lastNameParts] = customerName.split(/\s+/);
  const fullAddress = [
    streetAddress,
    village,
    district,
    city,
    province,
  ].join(", ");
  const snapPayload = {
    transaction_details: {
      order_id: orderId,
      gross_amount: grossAmount,
    },
    item_details: [
      ...productItemDetails,
      {
        id: "delivery-fee",
        price: deliveryFee,
        quantity: 1,
        name: "Delivery Fee",
      },
      {
        id: "service-fee",
        price: serviceFee,
        quantity: 1,
        name: "Service Fee",
      },
    ],
    customer_details: {
      first_name: firstName,
      last_name: lastNameParts.join(" "),
      phone: customerPhone,
      billing_address: {
        first_name: firstName,
        last_name: lastNameParts.join(" "),
        phone: customerPhone,
        address: fullAddress.slice(0, 200),
        city,
        country_code: "IDN",
      },
      shipping_address: {
        first_name: firstName,
        last_name: lastNameParts.join(" "),
        phone: customerPhone,
        address: fullAddress.slice(0, 200),
        city,
        country_code: "IDN",
      },
    },
    credit_card: {
      secure: true,
    },
    custom_field1: `Delivery: ${deliveryDate}`.slice(0, 255),
    custom_field2: `Area: ${district}, ${city}`.slice(0, 255),
    custom_field3: `Preference: ${cleanText(body.selectedPaymentMethod) || "Snap"}`.slice(
      0,
      255,
    ),
  };

  let midtransResponse: Response;

  try {
    midtransResponse = await fetch(getMidtransEndpoint(), {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(snapPayload),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { message: "Tidak dapat menghubungi Midtrans. Coba beberapa saat lagi." },
      { status: 502 },
    );
  }

  const data = (await midtransResponse.json()) as {
    token?: string;
    redirect_url?: string;
    error_messages?: string[];
    status_message?: string;
  };

  if (!midtransResponse.ok || !data.token) {
    return NextResponse.json(
      {
        message:
          data.error_messages?.join(" ") ??
          data.status_message ??
          "Gagal membuat transaksi Midtrans.",
      },
      { status: midtransResponse.status || 502 },
    );
  }

  return NextResponse.json({
    token: data.token,
    redirectUrl: data.redirect_url,
    orderId,
  });
}
