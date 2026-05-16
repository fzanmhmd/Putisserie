import {
  fallbackDeliveryFeesByProvince,
  fallbackStoreSocials,
  products as fallbackProducts,
  type Product,
  type ProductCategory,
  type StoreSocial,
} from "@/lib/putisserie-data";

type SupabaseKeyMode = "anon" | "service";

type SupabaseConfig = {
  url: string;
  anonKey?: string;
  serviceRoleKey?: string;
};

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  category: string;
  short_description: string;
  description: string;
  price: number;
  compare_at_price: number | null;
  image_url: string;
  badge: string | null;
  prep_time: string;
  stock: number;
  rating: number | string;
  product_tags?: Array<{ tag: string }>;
};

type DeliveryFeeRow = {
  province: string;
  fee: number;
};

type StoreSocialRow = {
  platform: string;
  label: string;
  url: string;
};

export type StorefrontData = {
  products: Product[];
  deliveryFeesByProvince: Record<string, number>;
  socials: StoreSocial[];
};

export type CheckoutDeliveryDetails = {
  name: string;
  phone: string;
  address: string;
  province: string;
  city: string;
  district: string;
  village: string;
  deliveryDate: string;
  note?: string;
};

export type CheckoutRecordInput = {
  orderId: string;
  items: Array<{
    product: Product;
    quantity: number;
  }>;
  deliveryDetails: CheckoutDeliveryDetails;
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  total: number;
  snapToken: string;
  redirectUrl?: string;
  midtransResponse: unknown;
};

const categoryFromDatabase: Record<string, Exclude<ProductCategory, "All">> = {
  cakes: "Cakes",
  fresh_bakes: "Fresh Bakes",
  macarons: "Macarons",
  gift_boxes: "Gift Boxes",
  gluten_free: "Gluten-Free",
};

const getSupabaseConfig = (): SupabaseConfig | null => {
  const url =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anonKey =
    process.env.SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  if (!url) {
    return null;
  }

  return {
    url: url.replace(/\/$/, ""),
    anonKey,
    serviceRoleKey,
  };
};

const getSupabaseKey = (config: SupabaseConfig, mode: SupabaseKeyMode) => {
  if (mode === "service") {
    return config.serviceRoleKey || config.anonKey;
  }

  return config.anonKey;
};

const supabaseRequest = async <T>(
  path: string,
  {
    body,
    method = "GET",
    mode = "anon",
    prefer,
  }: {
    body?: unknown;
    method?: "GET" | "POST" | "PATCH";
    mode?: SupabaseKeyMode;
    prefer?: string;
  } = {},
) => {
  const config = getSupabaseConfig();
  const key = config ? getSupabaseKey(config, mode) : "";

  if (!config || !key) {
    throw new Error("Supabase environment belum dikonfigurasi.");
  }

  if (mode === "service" && !config.serviceRoleKey) {
    throw new Error("Supabase service role key belum dikonfigurasi.");
  }

  const response = await fetch(`${config.url}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(prefer ? { Prefer: prefer } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Request Supabase gagal.");
  }

  if (response.status === 204) {
    return null as T;
  }

  const responseText = await response.text();

  if (!responseText) {
    return null as T;
  }

  return JSON.parse(responseText) as T;
};

const mapProductRow = (row: ProductRow): Product => ({
  id: row.slug,
  databaseId: row.id,
  name: row.name,
  category: categoryFromDatabase[row.category] ?? "Cakes",
  short: row.short_description,
  description: row.description,
  price: row.price,
  compareAt: row.compare_at_price ?? undefined,
  image: row.image_url,
  badge: row.badge ?? undefined,
  prepTime: row.prep_time,
  stock: row.stock,
  rating: Number(row.rating),
  tags: row.product_tags?.map((tag) => tag.tag) ?? [],
});

export const getStorefrontProducts = async (mode: SupabaseKeyMode = "anon") => {
  const rows = await supabaseRequest<ProductRow[]>(
    "products?select=id,slug,name,category,short_description,description,price,compare_at_price,image_url,badge,prep_time,stock,rating,product_tags(tag)&is_active=eq.true&order=created_at.asc",
    { mode },
  );

  return rows.map(mapProductRow);
};

export const getDeliveryFeesByProvince = async (
  mode: SupabaseKeyMode = "anon",
) => {
  const rows = await supabaseRequest<DeliveryFeeRow[]>(
    "delivery_fees?select=province,fee&is_active=eq.true",
    { mode },
  );

  return rows.reduce<Record<string, number>>((fees, row) => {
    fees[row.province] = row.fee;
    return fees;
  }, {});
};

export const getStoreSocials = async (mode: SupabaseKeyMode = "anon") => {
  const rows = await supabaseRequest<StoreSocialRow[]>(
    "store_socials?select=platform,label,url&is_active=eq.true&order=sort_order.asc",
    { mode },
  );

  return rows;
};

export const getStorefrontData = async (): Promise<StorefrontData> => {
  try {
    const [databaseProducts, databaseDeliveryFees, databaseSocials] =
      await Promise.all([
        getStorefrontProducts(),
        getDeliveryFeesByProvince(),
        getStoreSocials(),
      ]);

    return {
      products: databaseProducts.length > 0 ? databaseProducts : fallbackProducts,
      deliveryFeesByProvince:
        Object.keys(databaseDeliveryFees).length > 0
          ? databaseDeliveryFees
          : fallbackDeliveryFeesByProvince,
      socials: databaseSocials.length > 0 ? databaseSocials : fallbackStoreSocials,
    };
  } catch {
    return {
      products: fallbackProducts,
      deliveryFeesByProvince: fallbackDeliveryFeesByProvince,
      socials: fallbackStoreSocials,
    };
  }
};

export const createCheckoutRecord = async ({
  orderId,
  items,
  deliveryDetails,
  subtotal,
  deliveryFee,
  serviceFee,
  total,
  snapToken,
  redirectUrl,
  midtransResponse,
}: CheckoutRecordInput) => {
  const customerRows = await supabaseRequest<Array<{ id: string }>>(
    "customers?on_conflict=phone",
    {
      method: "POST",
      mode: "service",
      prefer: "resolution=merge-duplicates,return=representation",
      body: {
        name: deliveryDetails.name,
        phone: deliveryDetails.phone,
      },
    },
  );
  const customerId = customerRows?.[0]?.id;

  const fullAddress = [
    deliveryDetails.address,
    deliveryDetails.village,
    deliveryDetails.district,
    deliveryDetails.city,
    deliveryDetails.province,
  ].join(", ");
  const orderRows = await supabaseRequest<Array<{ id: string }>>("orders", {
    method: "POST",
    mode: "service",
    prefer: "return=representation",
    body: {
      invoice_number: orderId,
      customer_id: customerId,
      customer_name: deliveryDetails.name,
      customer_phone: deliveryDetails.phone,
      delivery_address: fullAddress,
      province: deliveryDetails.province,
      city: deliveryDetails.city,
      district: deliveryDetails.district,
      village: deliveryDetails.village,
      delivery_date: deliveryDetails.deliveryDate,
      note: deliveryDetails.note ?? "",
      subtotal,
      delivery_fee: deliveryFee,
      service_fee: serviceFee,
      total,
      status: "pending_payment",
    },
  });
  const orderDatabaseId = orderRows?.[0]?.id;

  if (!orderDatabaseId) {
    throw new Error("Order Supabase gagal dibuat.");
  }

  await supabaseRequest("order_items", {
    method: "POST",
    mode: "service",
    body: items.map(({ product, quantity }) => ({
      order_id: orderDatabaseId,
      product_id: product.databaseId ?? null,
      product_slug: product.id,
      product_name: product.name,
      quantity,
      unit_price: product.price,
      line_total: product.price * quantity,
      image_url: product.image,
    })),
  });

  await supabaseRequest("payments", {
    method: "POST",
    mode: "service",
    body: {
      order_id: orderDatabaseId,
      midtrans_order_id: orderId,
      transaction_status: "pending",
      gross_amount: total,
      snap_token: snapToken,
      redirect_url: redirectUrl,
      raw_result: midtransResponse,
    },
  });

  return {
    orderDatabaseId,
  };
};

export const recordMidtransNotification = async (payload: {
  order_id?: string;
  transaction_id?: string;
  transaction_status?: string;
  payment_type?: string;
  fraud_status?: string;
  gross_amount?: string;
  settlement_time?: string;
  expiry_time?: string;
  [key: string]: unknown;
}) => {
  if (!payload.order_id) {
    throw new Error("Order ID Midtrans tidak ditemukan.");
  }

  const paymentRows = await supabaseRequest<Array<{ order_id: string }>>(
    `payments?select=order_id&midtrans_order_id=eq.${encodeURIComponent(
      payload.order_id,
    )}`,
    { mode: "service" },
  );
  const orderDatabaseId = paymentRows?.[0]?.order_id;
  const validPaymentStatuses = new Set([
    "pending",
    "capture",
    "settlement",
    "deny",
    "cancel",
    "expire",
    "failure",
    "refund",
    "partial_refund",
    "authorize",
  ]);
  const transactionStatus = validPaymentStatuses.has(
    payload.transaction_status ?? "",
  )
    ? (payload.transaction_status ?? "pending")
    : "pending";

  await supabaseRequest("payment_notifications", {
    method: "POST",
    mode: "service",
    body: {
      order_id: orderDatabaseId ?? null,
      midtrans_order_id: payload.order_id,
      transaction_id: payload.transaction_id ?? null,
      transaction_status: transactionStatus,
      payload,
    },
  });

  await supabaseRequest(
    `payments?midtrans_order_id=eq.${encodeURIComponent(payload.order_id)}`,
    {
      method: "PATCH",
      mode: "service",
      body: {
        transaction_id: payload.transaction_id ?? null,
        payment_type: payload.payment_type ?? null,
        transaction_status: transactionStatus,
        fraud_status: payload.fraud_status ?? null,
        gross_amount: payload.gross_amount
          ? Math.round(Number(payload.gross_amount))
          : undefined,
        raw_result: payload,
        paid_at: payload.settlement_time ?? null,
        expired_at: payload.expiry_time ?? null,
      },
    },
  );
};
