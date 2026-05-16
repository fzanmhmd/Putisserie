import { NextResponse } from "next/server";

import {
  checkoutServiceFee,
  fallbackDeliveryFeesByProvince,
  getDeliveryFeeByProvince,
  products as fallbackProducts,
} from "@/lib/putisserie-data";
import {
  createCheckoutRecord,
  getDeliveryFeesByProvince,
  getStorefrontProducts,
} from "@/lib/supabase-storefront";

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
};

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

const getJakartaDateInputValue = (offsetDays = 0) => {
  const date = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000);
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Jakarta",
    year: "numeric",
  }).formatToParts(date);
  const getPart = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${getPart("year")}-${getPart("month")}-${getPart("day")}`;
};

const isDeliveryDateAllowed = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  value >= getJakartaDateInputValue(1);

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

  if (!isDeliveryDateAllowed(deliveryDate)) {
    return NextResponse.json(
      { message: "Tanggal pengiriman minimal H+1 dari hari ini." },
      { status: 400 },
    );
  }

  let activeProducts = fallbackProducts;
  let deliveryFeesByProvince = fallbackDeliveryFeesByProvince;

  try {
    const [databaseProducts, databaseDeliveryFees] = await Promise.all([
      getStorefrontProducts("service"),
      getDeliveryFeesByProvince("service"),
    ]);

    if (databaseProducts.length > 0) {
      activeProducts = databaseProducts;
    }

    if (Object.keys(databaseDeliveryFees).length > 0) {
      deliveryFeesByProvince = databaseDeliveryFees;
    }
  } catch {
    activeProducts = fallbackProducts;
    deliveryFeesByProvince = fallbackDeliveryFeesByProvince;
  }

  const checkoutItems = (body.items ?? [])
    .map((item) => ({
      product: activeProducts.find((product) => product.id === item.productId),
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
  const subtotal = productItemDetails.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const deliveryFee = getDeliveryFeeByProvince(province, deliveryFeesByProvince);
  const grossAmount =
    subtotal +
    deliveryFee +
    checkoutServiceFee;
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
        price: checkoutServiceFee,
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
    custom_field3: "Channel: Midtrans Snap",
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

  try {
    await createCheckoutRecord({
      orderId,
      items: checkoutItems.map(({ product, quantity }) => ({
        product: product!,
        quantity,
      })),
      deliveryDetails: {
        name: customerName,
        phone: customerPhone,
        address: streetAddress,
        province,
        city,
        district,
        village,
        deliveryDate,
        note: cleanText(deliveryDetails.note),
      },
      subtotal,
      deliveryFee,
      serviceFee: checkoutServiceFee,
      total: grossAmount,
      snapToken: data.token,
      redirectUrl: data.redirect_url,
      midtransResponse: data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          "Transaksi Midtrans dibuat, tetapi order gagal tersimpan ke Supabase. Coba lagi sebelum membayar.",
        details:
          process.env.NODE_ENV === "production"
            ? undefined
            : error instanceof Error
              ? error.message
              : "Unknown Supabase error",
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    token: data.token,
    redirectUrl: data.redirect_url,
    orderId,
  });
}
