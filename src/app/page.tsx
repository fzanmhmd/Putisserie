import { PutisserieApp } from "@/components/putisserie-app";
import { getStorefrontData } from "@/lib/supabase-storefront";

export const dynamic = "force-dynamic";

export default async function Home() {
  const storefrontData = await getStorefrontData();

  return <PutisserieApp storefrontData={storefrontData} />;
}
