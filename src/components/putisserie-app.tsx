"use client";

import Image from "next/image";
import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  CreditCard,
  Gift,
  History,
  Instagram,
  Lock,
  Mail,
  MapPin,
  MessageCircle,
  Minus,
  Music2,
  PackageCheck,
  Plus,
  Printer,
  ReceiptText,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Trash2,
  Truck,
  UserRound,
  WalletCards,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  baseDeliveryFee,
  categories,
  checkoutServiceFee,
  formatCurrency,
  getDeliveryFeeByProvince,
  heroImages,
  initialOrders,
  products,
  type CartItem,
  type Order,
  type Product,
  type ProductCategory,
} from "@/lib/putisserie-data";
import { cn } from "@/lib/utils";

type View = "home" | "catalog" | "dashboard" | "account";
type SectionTarget = "about" | "collections" | "fresh" | "contact";
type Language = "id" | "en";

type MidtransPaymentResult = {
  order_id?: string;
  payment_type?: string;
  status_code?: string;
  status_message?: string;
  transaction_id?: string;
  transaction_status?: string;
};

type SnapOptions = {
  onSuccess?: (result: MidtransPaymentResult) => void;
  onPending?: (result: MidtransPaymentResult) => void;
  onError?: (result: MidtransPaymentResult) => void;
  onClose?: () => void;
};

declare global {
  interface Window {
    snap?: {
      pay: (token: string, options?: SnapOptions) => void;
    };
  }
}

const acceptedPaymentMethods = ["Midtrans", "GoPay", "DANA", "ShopeePay", "Bank"];
const whatsappNumber = "6285162811421";
const storeAddress = "Jakarta";
const storeHours = "Setiap hari, 09:00 - 16:00";
const midtransSnapScriptUrl =
  process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true"
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";
const midtransClientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;

const whatsappHref = (message: string) =>
  `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

type DeliveryDetails = {
  name: string;
  phone: string;
  address: string;
  province: string;
  city: string;
  district: string;
  village: string;
  deliveryDate: string;
  note: string;
};

const initialDeliveryDetails: DeliveryDetails = {
  name: "",
  phone: "",
  address: "",
  province: "",
  city: "",
  district: "",
  village: "",
  deliveryDate: "",
  note: "",
};

const provinceOptions = [
  "Aceh",
  "Sumatera Utara",
  "Sumatera Barat",
  "Riau",
  "Kepulauan Riau",
  "Jambi",
  "Sumatera Selatan",
  "Bangka Belitung",
  "Bengkulu",
  "Lampung",
  "DKI Jakarta",
  "Banten",
  "Jawa Barat",
  "Jawa Tengah",
  "DI Yogyakarta",
  "Jawa Timur",
  "Bali",
  "Nusa Tenggara Barat",
  "Nusa Tenggara Timur",
  "Kalimantan Barat",
  "Kalimantan Tengah",
  "Kalimantan Selatan",
  "Kalimantan Timur",
  "Kalimantan Utara",
  "Sulawesi Utara",
  "Gorontalo",
  "Sulawesi Tengah",
  "Sulawesi Barat",
  "Sulawesi Selatan",
  "Sulawesi Tenggara",
  "Maluku",
  "Maluku Utara",
  "Papua",
  "Papua Barat",
  "Papua Barat Daya",
  "Papua Tengah",
  "Papua Pegunungan",
  "Papua Selatan",
];

const cityOptionsByProvince: Record<string, string[]> = {
  Aceh: ["Banda Aceh", "Langsa", "Lhokseumawe", "Sabang", "Aceh Besar"],
  "Sumatera Utara": ["Medan", "Binjai", "Pematangsiantar", "Deli Serdang", "Tebing Tinggi"],
  "Sumatera Barat": ["Padang", "Bukittinggi", "Payakumbuh", "Solok", "Padang Panjang"],
  Riau: ["Pekanbaru", "Dumai", "Siak", "Kampar", "Bengkalis"],
  "Kepulauan Riau": ["Batam", "Tanjungpinang", "Bintan", "Karimun", "Natuna"],
  Jambi: ["Jambi", "Sungai Penuh", "Muaro Jambi", "Bungo", "Tanjung Jabung Barat"],
  "Sumatera Selatan": ["Palembang", "Prabumulih", "Lubuklinggau", "Banyuasin", "Ogan Ilir"],
  "Bangka Belitung": ["Pangkalpinang", "Bangka", "Belitung", "Bangka Tengah", "Bangka Barat"],
  Bengkulu: ["Bengkulu", "Rejang Lebong", "Seluma", "Bengkulu Utara", "Kaur"],
  Lampung: ["Bandar Lampung", "Metro", "Lampung Selatan", "Lampung Tengah", "Pringsewu"],
  "DKI Jakarta": [
    "Jakarta Pusat",
    "Jakarta Selatan",
    "Jakarta Barat",
    "Jakarta Timur",
    "Jakarta Utara",
    "Kepulauan Seribu",
  ],
  Banten: ["Tangerang", "Tangerang Selatan", "Serang", "Cilegon", "Pandeglang"],
  "Jawa Barat": ["Bandung", "Bekasi", "Bogor", "Depok", "Cimahi", "Cirebon"],
  "Jawa Tengah": ["Semarang", "Surakarta", "Magelang", "Tegal", "Pekalongan", "Salatiga"],
  "DI Yogyakarta": ["Yogyakarta", "Sleman", "Bantul", "Kulon Progo", "Gunungkidul"],
  "Jawa Timur": ["Surabaya", "Malang", "Sidoarjo", "Kediri", "Madiun", "Batu"],
  Bali: ["Denpasar", "Badung", "Gianyar", "Tabanan", "Buleleng"],
  "Nusa Tenggara Barat": ["Mataram", "Lombok Barat", "Lombok Tengah", "Sumbawa", "Bima"],
  "Nusa Tenggara Timur": ["Kupang", "Ende", "Maumere", "Manggarai", "Sumba Barat"],
  "Kalimantan Barat": ["Pontianak", "Singkawang", "Kubu Raya", "Ketapang", "Sambas"],
  "Kalimantan Tengah": ["Palangka Raya", "Kotawaringin Barat", "Kotawaringin Timur", "Kapuas", "Barito Selatan"],
  "Kalimantan Selatan": ["Banjarmasin", "Banjarbaru", "Banjar", "Barito Kuala", "Tanah Laut"],
  "Kalimantan Timur": ["Samarinda", "Balikpapan", "Bontang", "Kutai Kartanegara", "Paser"],
  "Kalimantan Utara": ["Tarakan", "Tanjung Selor", "Nunukan", "Malinau", "Bulungan"],
  "Sulawesi Utara": ["Manado", "Bitung", "Tomohon", "Minahasa", "Kotamobagu"],
  Gorontalo: ["Gorontalo", "Bone Bolango", "Boalemo", "Pohuwato", "Gorontalo Utara"],
  "Sulawesi Tengah": ["Palu", "Donggala", "Poso", "Banggai", "Tolitoli"],
  "Sulawesi Barat": ["Mamuju", "Majene", "Polewali Mandar", "Mamasa", "Pasangkayu"],
  "Sulawesi Selatan": ["Makassar", "Gowa", "Maros", "Parepare", "Palopo"],
  "Sulawesi Tenggara": ["Kendari", "Baubau", "Kolaka", "Konawe", "Muna"],
  Maluku: ["Ambon", "Tual", "Maluku Tengah", "Buru", "Seram Bagian Barat"],
  "Maluku Utara": ["Ternate", "Tidore Kepulauan", "Halmahera Barat", "Halmahera Selatan", "Morotai"],
  Papua: ["Jayapura", "Keerom", "Sarmi", "Biak Numfor", "Supiori"],
  "Papua Barat": ["Manokwari", "Fakfak", "Kaimana", "Teluk Bintuni", "Teluk Wondama"],
  "Papua Barat Daya": ["Sorong", "Raja Ampat", "Maybrat", "Tambrauw", "Sorong Selatan"],
  "Papua Tengah": ["Nabire", "Mimika", "Paniai", "Dogiyai", "Deiyai"],
  "Papua Pegunungan": ["Jayawijaya", "Yahukimo", "Lanny Jaya", "Tolikara", "Nduga"],
  "Papua Selatan": ["Merauke", "Boven Digoel", "Mappi", "Asmat"],
};

const districtOptionsByCity: Record<string, string[]> = {
  "Jakarta Pusat": ["Gambir", "Menteng", "Tanah Abang", "Senen", "Kemayoran"],
  "Jakarta Selatan": ["Kebayoran Baru", "Kebayoran Lama", "Cilandak", "Mampang Prapatan", "Tebet"],
  "Jakarta Barat": ["Palmerah", "Grogol Petamburan", "Kembangan", "Cengkareng", "Tambora"],
  "Jakarta Timur": ["Duren Sawit", "Jatinegara", "Cakung", "Pasar Rebo", "Kramat Jati"],
  "Jakarta Utara": ["Kelapa Gading", "Penjaringan", "Tanjung Priok", "Pademangan", "Koja"],
  "Kepulauan Seribu": ["Kepulauan Seribu Utara", "Kepulauan Seribu Selatan"],
  Bandung: ["Coblong", "Cicendo", "Lengkong", "Sukajadi", "Antapani"],
  Bekasi: ["Bekasi Selatan", "Bekasi Barat", "Bekasi Timur", "Rawalumbu", "Jatiasih"],
  Bogor: ["Bogor Tengah", "Bogor Barat", "Bogor Timur", "Tanah Sareal", "Bogor Utara"],
  Depok: ["Beji", "Pancoran Mas", "Cimanggis", "Sukmajaya", "Sawangan"],
  Tangerang: ["Tangerang", "Cipondoh", "Ciledug", "Karawaci", "Batuceper"],
  "Tangerang Selatan": ["Serpong", "Serpong Utara", "Pondok Aren", "Ciputat", "Bintaro"],
  Surabaya: ["Tegalsari", "Genteng", "Wonokromo", "Rungkut", "Sukolilo"],
  Malang: ["Klojen", "Blimbing", "Lowokwaru", "Sukun", "Kedungkandang"],
  Denpasar: ["Denpasar Barat", "Denpasar Timur", "Denpasar Selatan", "Denpasar Utara"],
  Yogyakarta: ["Gondokusuman", "Jetis", "Kraton", "Umbulharjo", "Tegalrejo"],
  Semarang: ["Semarang Tengah", "Semarang Selatan", "Banyumanik", "Tembalang", "Candisari"],
  Medan: ["Medan Kota", "Medan Baru", "Medan Petisah", "Medan Sunggal", "Medan Johor"],
  Makassar: ["Panakkukang", "Rappocini", "Ujung Pandang", "Tamalanrea", "Biringkanaya"],
};

const villageOptionsByDistrict: Record<string, string[]> = {
  Gambir: ["Gambir", "Cideng", "Petojo Utara", "Kebon Kelapa"],
  Menteng: ["Menteng", "Gondangdia", "Cikini", "Pegangsaan"],
  "Tanah Abang": ["Bendungan Hilir", "Karet Tengsin", "Kebon Melati", "Petamburan"],
  "Kebayoran Baru": ["Gandaria Utara", "Kramat Pela", "Pulo", "Selong"],
  "Kebayoran Lama": ["Pondok Pinang", "Cipulir", "Grogol Utara", "Grogol Selatan"],
  Cilandak: ["Cilandak Barat", "Lebak Bulus", "Pondok Labu", "Cipete Selatan"],
  Tebet: ["Tebet Barat", "Tebet Timur", "Menteng Dalam", "Manggarai"],
  Palmerah: ["Palmerah", "Slipi", "Kemanggisan", "Kota Bambu Utara"],
  "Grogol Petamburan": ["Tomang", "Grogol", "Jelambar", "Tanjung Duren Utara"],
  "Duren Sawit": ["Duren Sawit", "Pondok Bambu", "Klender", "Malaka Jaya"],
  "Kelapa Gading": ["Kelapa Gading Barat", "Kelapa Gading Timur", "Pegangsaan Dua"],
  Coblong: ["Dago", "Lebak Siliwangi", "Sekeloa", "Cipaganti"],
  Cicendo: ["Arjuna", "Pajajaran", "Pamoyanan", "Pasirkaliki"],
  "Bekasi Selatan": ["Kayuringin Jaya", "Pekayon Jaya", "Marga Jaya", "Jaka Mulya"],
  Beji: ["Beji", "Kemiri Muka", "Pondok Cina", "Tanah Baru"],
  Serpong: ["Serpong", "Rawa Buntu", "Lengkong Gudang", "Cilenggang"],
  Tegalsari: ["Kedungdoro", "Tegalsari", "Wonorejo", "Dr. Soetomo"],
  Klojen: ["Klojen", "Kauman", "Oro-oro Dowo", "Bareng"],
  "Denpasar Barat": ["Padangsambian", "Pemecutan Kelod", "Dauh Puri Kauh", "Tegal Harum"],
  Gondokusuman: ["Baciro", "Demangan", "Klitren", "Terban"],
  "Semarang Tengah": ["Pekunden", "Sekayu", "Miroto", "Brumbungan"],
  "Medan Kota": ["Teladan Barat", "Pasar Baru", "Pusat Pasar", "Sei Rengas"],
  Panakkukang: ["Masale", "Pandang", "Karuwisi", "Tamamaung"],
};

const getCityOptions = (province: string) =>
  cityOptionsByProvince[province] ?? [];

const getDistrictOptions = (city: string) =>
  districtOptionsByCity[city] ??
  (city
    ? ["Kecamatan Pusat", "Kecamatan Utara", "Kecamatan Timur", "Kecamatan Selatan"]
    : []);

const getVillageOptions = (district: string) =>
  villageOptionsByDistrict[district] ??
  (district
    ? ["Kelurahan Utama", "Kelurahan Tengah", "Kelurahan Baru", "Desa Sukamaju"]
    : []);

const appCopy = {
  id: {
    nav: {
      about: "Tentang Kami",
      collections: "Koleksi Cake",
      fresh: "Tambah Produk",
      contact: "Kontak",
    },
    orderNow: "Pesan Sekarang",
    language: "Bahasa",
    aboutBadge: "Tentang Kami",
    aboutTitle: "Tentang Putisserie",
    aboutText:
      "Putisserie adalah boutique cake shop di Jakarta yang membuat cake, pastry, macaron, dan hampers dengan rasa lembut, tampilan elegan, serta proses pemesanan online yang sederhana dari keranjang sampai pembayaran.",
    aboutTextSecond:
      "Kami mengutamakan bahan premium, produksi batch kecil, packaging rapi, dan bantuan WhatsApp supaya pelanggan bisa memesan kue untuk hadiah, acara, atau camilan harian tanpa proses manual yang ribet.",
    startOrder: "Mulai Pesan",
    viewCollections: "Lihat Koleksi",
    collectionsTitle: "Koleksi Cake",
    collectionsText:
      "9 pilihan cake Putisserie lengkap dengan harga, stok, rasa, dan deskripsi. Hover atau klik produk untuk melihat detailnya lebih jelas.",
    addProductTitle: "Tambah Produk",
    addProductText:
      "Pilih cake favorit dan masukkan langsung ke keranjang. Tombol cart dibuat lebih jelas supaya alur order terasa cepat.",
    browseAll: "Lihat Semua Produk",
    contactBadge: "Kontak",
    contactTitle: "Butuh Bantuan Pesanan?",
    contactText:
      "Hubungi Putisserie untuk konsultasi ukuran cake, request kartu ucapan, jadwal pickup, atau bantuan pembayaran. Tim kami siap bantu lewat WhatsApp dan email.",
    whatsapp: "WhatsApp",
    email: "hello@putisserie.id",
    footerText:
      "Membuat momen manis yang elegan melalui cake artisanal dan bahan berkualitas.",
  },
  en: {
    nav: {
      about: "About Us",
      collections: "Cake Collections",
      fresh: "Add Product",
      contact: "Contact",
    },
    orderNow: "Order Now",
    language: "Language",
    aboutBadge: "About Us",
    aboutTitle: "About Putisserie",
    aboutText:
      "Putisserie is a Jakarta boutique cake shop creating soft cakes, pastries, macarons, and hampers with polished presentation and a simple online ordering flow from cart to payment.",
    aboutTextSecond:
      "We focus on premium ingredients, small-batch production, neat packaging, and WhatsApp support so customers can order gifts, events, and daily treats without a complicated manual process.",
    startOrder: "Start Order",
    viewCollections: "View Collections",
    collectionsTitle: "Cake Collections",
    collectionsText:
      "9 Putisserie cake options with price, stock, flavor notes, and descriptions. Hover or click a product to reveal richer details.",
    addProductTitle: "Add Product",
    addProductText:
      "Choose your favorite cake and add it directly to cart. The cart order button is clearer for a faster shopping flow.",
    browseAll: "Browse All Products",
    contactBadge: "Contact",
    contactTitle: "Need Order Help?",
    contactText:
      "Contact Putisserie for cake sizing, greeting card requests, pickup schedules, or payment help. Our team can help through WhatsApp and email.",
    whatsapp: "WhatsApp",
    email: "hello@putisserie.id",
    footerText:
      "Crafting elegant sweet moments through artisanal cakes and high-quality ingredients.",
  },
} as const;

export function PutisserieApp() {
  const [view, setView] = useState<View>("home");
  const [language, setLanguage] = useState<Language>("id");
  const [activeSection, setActiveSection] = useState<SectionTarget>("about");
  const [category, setCategory] = useState<ProductCategory>("All");
  const [query, setQuery] = useState("");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState<Order | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<Order>(initialOrders[0]);

  const filteredProducts = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory = category === "All" || product.category === category;
      const matchesQuery =
        !keyword ||
        product.name.toLowerCase().includes(keyword) ||
        product.short.toLowerCase().includes(keyword) ||
        product.tags.some((tag) => tag.toLowerCase().includes(keyword));

      return matchesCategory && matchesQuery;
    });
  }, [category, query]);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );
  const deliveryFee = cartCount > 0 ? baseDeliveryFee : 0;
  const serviceFee = cartCount > 0 ? checkoutServiceFee : 0;
  const total = subtotal + deliveryFee + serviceFee;

  function goTo(nextView: View) {
    setView(nextView);
    if (nextView === "catalog") {
      setActiveSection("fresh");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function scrollToSection(section: SectionTarget) {
    setActiveSection(section);
    setView("home");
    window.setTimeout(() => {
      document
        .getElementById(section)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  }

  function addToCart(product: Product) {
    setCartItems((current) => {
      const existing = current.find((item) => item.product.id === product.id);

      if (!existing) {
        return [...current, { product, quantity: 1 }];
      }

      return current.map((item) =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item,
      );
    });
    setCartOpen(true);
  }

  function updateQuantity(productId: string, direction: "increase" | "decrease") {
    setCartItems((current) =>
      current
        .map((item) => {
          if (item.product.id !== productId) {
            return item;
          }

          const quantity =
            direction === "increase" ? item.quantity + 1 : item.quantity - 1;

          return { ...item, quantity: Math.max(quantity, 0) };
        })
        .filter((item) => item.quantity > 0),
    );
  }

  function removeCartItem(productId: string) {
    setCartItems((current) =>
      current.filter((item) => item.product.id !== productId),
    );
  }

  function beginCheckout() {
    setCheckoutSuccess(null);
    setCartOpen(false);
    setCheckoutOpen(true);
  }

  function completeCheckout(
    deliveryDetails: DeliveryDetails,
    paymentResult?: MidtransPaymentResult,
  ) {
    if (cartItems.length === 0) {
      return;
    }

    const now = new Date();
    const deliveryAddress = [
      deliveryDetails.address,
      deliveryDetails.village,
      deliveryDetails.district,
      deliveryDetails.city,
      deliveryDetails.province,
    ]
      .filter(Boolean)
      .join(", ");
    const orderDeliveryFee = getDeliveryFeeByProvince(deliveryDetails.province);
    const orderTotal = subtotal + orderDeliveryFee + serviceFee;
    const newOrder: Order = {
      id: `INV-PUT-${now.getFullYear()}${String(now.getMonth() + 1).padStart(
        2,
        "0",
      )}-${String(orders.length + 42).padStart(3, "0")}`,
      date: new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(now),
      status:
        paymentResult?.transaction_status === "pending"
          ? "Menunggu Pembayaran"
          : "Dibayar",
      items: cartItems.map((item) => ({
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        image: item.product.image,
      })),
      total: orderTotal,
      customer: deliveryDetails.name || "Pelanggan Putisserie",
      address: deliveryAddress,
      payment: paymentResult?.payment_type
        ? `Midtrans Sandbox - ${paymentResult.payment_type}`
        : "Midtrans Sandbox",
    };

    setOrders((current) => [newOrder, ...current]);
    setInvoiceOrder(newOrder);
    setCheckoutSuccess(newOrder);
    setCheckoutOpen(true);
    setCartItems([]);
  }

  function printInvoice(order: Order) {
    setInvoiceOrder(order);
    window.setTimeout(() => window.print(), 50);
  }

  return (
    <main className="min-h-screen bg-[#fff8f6] text-[#201a19]">
      <Header
        view={view}
        language={language}
        activeSection={activeSection}
        cartCount={cartCount}
        onLanguage={setLanguage}
        onSection={scrollToSection}
        onCart={() => setCartOpen(true)}
        onOrderNow={() =>
          cartCount > 0 ? setCartOpen(true) : scrollToSection("fresh")
        }
      />

      {view === "home" ? (
        <HomeView
          language={language}
          onNavigate={goTo}
          onSection={scrollToSection}
          onAddToCart={addToCart}
          onProduct={setSelectedProduct}
        />
      ) : null}

      {view === "catalog" ? (
        <CatalogView
          category={category}
          query={query}
          products={filteredProducts}
          onCategory={setCategory}
          onQuery={setQuery}
          onAddToCart={addToCart}
          onProduct={setSelectedProduct}
        />
      ) : null}

      {view === "dashboard" ? (
        <DashboardView
          orders={orders}
          onNavigate={goTo}
          onAddToCart={addToCart}
          onPrint={printInvoice}
        />
      ) : null}

      {view === "account" ? (
        <AccountView orders={orders} onPrint={printInvoice} />
      ) : null}

      <Footer
        language={language}
        onNavigate={goTo}
        onSection={scrollToSection}
      />

      <CartSheet
        open={cartOpen}
        onOpenChange={setCartOpen}
        items={cartItems}
        subtotal={subtotal}
        deliveryFee={deliveryFee}
        serviceFee={serviceFee}
        total={total}
        onUpdate={updateQuantity}
        onRemove={removeCartItem}
        onCheckout={beginCheckout}
      />

      <CheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        items={cartItems}
        subtotal={subtotal}
        deliveryFee={deliveryFee}
        serviceFee={serviceFee}
        successOrder={checkoutSuccess}
        onPay={completeCheckout}
        onPrint={printInvoice}
      />

      <ProductDialog
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAdd={addToCart}
      />

      <InvoicePrint order={invoiceOrder} />

      <a
        href={whatsappHref("Halo Putisserie, saya butuh bantuan untuk pesanan.")}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-5 right-5 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_14px_35px_rgba(112,88,91,0.22)] transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#70585b] focus:ring-offset-2"
        aria-label="Chat WhatsApp Putisserie"
      >
        <MessageCircle className="h-5 w-5" />
      </a>
    </main>
  );
}

function Header({
  view,
  language,
  activeSection,
  cartCount,
  onLanguage,
  onSection,
  onCart,
  onOrderNow,
}: {
  view: View;
  language: Language;
  activeSection: SectionTarget;
  cartCount: number;
  onLanguage: (language: Language) => void;
  onSection: (section: SectionTarget) => void;
  onCart: () => void;
  onOrderNow: () => void;
}) {
  const t = appCopy[language];
  const navItems: Array<{ label: string; section: SectionTarget }> = [
    { label: t.nav.about, section: "about" },
    { label: t.nav.collections, section: "collections" },
    { label: t.nav.fresh, section: "fresh" },
    { label: t.nav.contact, section: "contact" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-[#d2c3c4]/40 bg-[#fff8f6]/92 backdrop-blur-md shadow-[0_4px_20px_rgba(74,66,64,0.05)]">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 md:h-20 md:px-8">
        <div className="flex min-w-0 items-center gap-4 md:gap-8">
          <button
            type="button"
            onClick={() => onSection("about")}
            className="shrink-0 font-['Quicksand'] text-2xl font-bold tracking-normal text-[#70585b] md:text-[34px]"
          >
            Putisserie
          </button>

          <nav className="hidden items-center gap-2 md:flex">
            {navItems.map((item) => {
              const active = view === "home" && activeSection === item.section;

              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => onSection(item.section)}
                  className={cn(
                    "rounded-full px-3 py-2 font-['Plus_Jakarta_Sans'] text-sm font-semibold text-[#5f5f59] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#f8ebe8] hover:text-[#70585b] hover:shadow-[0_8px_20px_rgba(112,88,91,0.10)]",
                    active && "bg-[#70585b] text-white hover:bg-[#70585b] hover:text-white",
                  )}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          <div
            className="hidden items-center rounded-full border border-[#d2c3c4]/70 bg-white/60 p-1 sm:flex"
            aria-label={t.language}
          >
            {(["id", "en"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => onLanguage(item)}
                className={cn(
                  "rounded-full px-3 py-1.5 font-['Plus_Jakarta_Sans'] text-xs font-bold uppercase transition-all duration-300 hover:bg-[#f8ebe8] hover:text-[#70585b]",
                  language === item
                    ? "bg-[#70585b] text-white shadow-sm hover:bg-[#70585b] hover:text-white"
                    : "text-[#807475]",
                )}
              >
                {item}
              </button>
            ))}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onCart}
            className="relative rounded-full text-[#70585b] hover:bg-[#f8ebe8]"
            aria-label={`Buka keranjang, ${cartCount} item`}
          >
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 ? (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#ffe088] px-1 text-[10px] font-bold text-[#574500]">
                {cartCount}
              </span>
            ) : null}
          </Button>
          <Button
            type="button"
            onClick={onOrderNow}
            className="rounded-full bg-[#70585b] px-3 text-xs text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#70585b]/90 hover:shadow-[0_10px_22px_rgba(112,88,91,0.18)] sm:px-5 sm:text-sm"
          >
            <span className="hidden sm:inline">{t.orderNow}</span>
            <span className="sm:hidden">{language === "id" ? "Pesan" : "Order"}</span>
          </Button>
        </div>
      </div>
      <div className="border-t border-[#d2c3c4]/30 px-4 py-2 md:hidden">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {navItems.map((item) => {
            const active = view === "home" && activeSection === item.section;

            return (
              <button
                key={`mobile-${item.label}`}
                type="button"
                onClick={() => onSection(item.section)}
                className={cn(
                  "shrink-0 rounded-full px-3 py-2 font-['Plus_Jakarta_Sans'] text-xs font-semibold text-[#5f5f59] transition-all duration-300 hover:bg-[#f8ebe8] hover:text-[#70585b]",
                  active && "bg-[#70585b] text-white hover:bg-[#70585b] hover:text-white",
                )}
              >
                {item.label}
              </button>
            );
          })}
          <div
            className="ml-auto flex shrink-0 items-center rounded-full border border-[#d2c3c4]/70 bg-white/70 p-1"
            aria-label={t.language}
          >
            {(["id", "en"] as const).map((item) => (
              <button
                key={`mobile-language-${item}`}
                type="button"
                onClick={() => onLanguage(item)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase transition-all duration-300 hover:bg-[#f8ebe8] hover:text-[#70585b]",
                  language === item
                    ? "bg-[#70585b] text-white shadow-sm hover:bg-[#70585b] hover:text-white"
                    : "text-[#807475]",
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}

function HomeView({
  language,
  onNavigate,
  onSection,
  onAddToCart,
  onProduct,
}: {
  language: Language;
  onNavigate: (view: View) => void;
  onSection: (section: SectionTarget) => void;
  onAddToCart: (product: Product) => void;
  onProduct: (product: Product) => void;
}) {
  const t = appCopy[language];

  return (
    <>
      <section
        id="about"
        className="relative scroll-mt-32 overflow-hidden px-4 py-10 md:scroll-mt-24 md:px-8 md:py-20"
      >
        <div className="mx-auto grid max-w-[1200px] items-center gap-10 md:grid-cols-[0.95fr_1.05fr] md:gap-12">
          <div className="space-y-5 md:space-y-6">
            <Badge className="rounded-full bg-[#fadadd] px-4 py-1.5 text-[#574144] hover:bg-[#fadadd]">
              <Sparkles className="mr-1 h-3.5 w-3.5" />
              {t.aboutBadge}
            </Badge>
            <div className="space-y-4">
              <h1 className="max-w-xl text-4xl font-bold leading-tight text-[#70585b] sm:text-5xl md:text-6xl">
                {t.aboutTitle}
              </h1>
              <p className="max-w-lg text-[15px] leading-7 text-[#4f4445] md:text-lg md:leading-8">
                {t.aboutText}
              </p>
              <p className="max-w-lg text-[15px] leading-7 text-[#4f4445] md:text-base md:leading-8">
                {t.aboutTextSecond}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                onClick={() => onSection("fresh")}
                className="rounded-full bg-[#70585b] px-6 py-5 text-white shadow-[0_12px_24px_rgba(112,88,91,0.18)] hover:bg-[#70585b]/90 sm:px-8 sm:py-6"
              >
                {t.startOrder}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onSection("collections")}
                className="rounded-full border-[#e9c349] px-6 py-5 text-[#70585b] hover:bg-[#f8ebe8] sm:px-8 sm:py-6"
              >
                {t.viewCollections}
              </Button>
            </div>
            <div className="grid max-w-lg grid-cols-3 gap-2 pt-3 sm:gap-3 sm:pt-4">
              <Metric value="9+" label="Produk" />
              <Metric value="15 rb+" label="Ongkir" />
              <Metric value="3" label="Medsos" />
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[620px]">
            <div className="absolute -right-12 -top-12 h-52 w-52 rounded-full bg-[#fadadd]/50 blur-3xl sm:h-72 sm:w-72" />
            <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] bg-[#f8ebe8] shadow-[0_24px_70px_rgba(74,66,64,0.12)] md:aspect-[5/4] md:rounded-[2rem]">
              <Image
                src={heroImages.cake}
                alt="Putisserie signature cake"
                fill
                priority
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="absolute -bottom-5 left-3 grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-[#ffe088] to-[#e9c349] p-3 text-center text-[#241a00] shadow-[0_12px_30px_rgba(233,195,73,0.25)] sm:h-28 sm:w-28 sm:p-4 md:-left-7">
              <span className="text-[10px] font-bold uppercase tracking-widest sm:text-xs">
                New
              </span>
              <span className="font-['Quicksand'] text-xs font-bold leading-tight sm:text-sm">
                Chef&apos;s Choice
              </span>
            </div>
          </div>
        </div>
      </section>

      <section
        id="collections"
        className="scroll-mt-32 bg-[#fef1ee] px-4 py-14 md:scroll-mt-24 md:px-8 md:py-20"
      >
        <SectionIntro
          title={t.collectionsTitle}
          text={t.collectionsText}
        />
        <div className="mx-auto mt-10 grid max-w-[1200px] gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <CollectionProductCard
              key={product.id}
              product={product}
              onAdd={onAddToCart}
              onProduct={onProduct}
              language={language}
            />
          ))}
        </div>
      </section>

      <section
        id="fresh"
        className="scroll-mt-32 px-4 py-14 md:scroll-mt-24 md:px-8 md:py-20"
      >
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="text-3xl font-semibold text-[#70585b]">
                {t.addProductTitle}
              </h2>
              <p className="mt-2 text-[#5f5f59]">
                {t.addProductText}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("catalog")}
              className="inline-flex items-center gap-2 font-['Plus_Jakarta_Sans'] text-sm font-semibold text-[#70585b]"
            >
              {t.browseAll}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {products.slice(1, 5).map((product) => (
              <MiniProductCard
                key={product.id}
                product={product}
                onAdd={onAddToCart}
                onProduct={onProduct}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#fadadd]/35 px-4 py-14 md:px-8 md:py-20">
        <div className="mx-auto grid max-w-[1200px] gap-10 md:grid-cols-2 md:items-center">
          <div className="space-y-5">
            <h2 className="text-3xl font-semibold text-[#70585b]">
              Crafted with Sophisticated Sweetness
            </h2>
            <p className="text-base leading-8 text-[#4f4445]">
              Setiap produk dibuat dari butter premium, cokelat berkualitas, buah
              musiman, dan teknik French patisserie yang presisi. Prototype ini
              juga menyiapkan jalur buyer lengkap: akun, cart, checkout, invoice,
              histori, dan notifikasi.
            </p>
            <div className="grid grid-cols-2 gap-6 pt-3">
              <Metric value="12+" label="Years of mastery" />
              <Metric value="100%" label="Natural ingredients" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="relative h-64 overflow-hidden rounded-[1.5rem] shadow-[0_12px_28px_rgba(74,66,64,0.08)]">
              <Image
                src={heroImages.chef}
                alt="Chef finishing cake"
                fill
                sizes="(min-width: 768px) 25vw, 50vw"
                className="object-cover"
              />
            </div>
            <div className="relative mt-8 h-64 overflow-hidden rounded-[1.5rem] shadow-[0_12px_28px_rgba(74,66,64,0.08)]">
              <Image
                src={products[8].image}
                alt="Putisserie gift box"
                fill
                sizes="(min-width: 768px) 25vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section
        id="contact"
        className="scroll-mt-32 px-4 py-14 md:scroll-mt-24 md:px-8 md:py-20"
      >
        <div className="mx-auto grid max-w-[1200px] gap-8 rounded-[2rem] bg-[#fef1ee] p-6 shadow-[0_14px_40px_rgba(74,66,64,0.06)] md:grid-cols-[1fr_0.9fr] md:p-10">
          <div>
            <Badge className="rounded-full bg-[#fadadd] text-[#70585b] hover:bg-[#fadadd]">
              {t.contactBadge}
            </Badge>
            <h2 className="mt-4 text-4xl font-bold text-[#70585b]">
              {t.contactTitle}
            </h2>
            <p className="mt-4 max-w-xl leading-8 text-[#4f4445]">
              {t.contactText}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button asChild className="rounded-full bg-[#25D366] px-7 text-white hover:bg-[#1fbd5a]">
                <a
                  href={whatsappHref("Halo Putisserie, saya mau bertanya tentang pesanan.")}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle className="h-4 w-4" />
                  {t.whatsapp}
                </a>
              </Button>
              <Button variant="outline" className="rounded-full border-[#d2c3c4] text-[#70585b]">
                <Mail className="h-4 w-4" />
                {t.email}
              </Button>
            </div>
          </div>
          <div className="grid gap-4">
            <ContactCard icon={<Instagram />} title="Instagram" text="@putisserie.id" />
            <ContactCard icon={<Music2 />} title="TikTok" text="@putisserie.id" />
            <ContactCard icon={<ShoppingBag />} title="Shopee" text="Putisserie Official" />
          </div>
        </div>
      </section>
    </>
  );
}

function CatalogView({
  category,
  query,
  products: visibleProducts,
  onCategory,
  onQuery,
  onAddToCart,
  onProduct,
}: {
  category: ProductCategory;
  query: string;
  products: Product[];
  onCategory: (category: ProductCategory) => void;
  onQuery: (value: string) => void;
  onAddToCart: (product: Product) => void;
  onProduct: (product: Product) => void;
}) {
  return (
    <section className="px-4 pb-20 pt-8 md:px-8 md:pt-12">
      <div className="mx-auto max-w-[1200px]">
        <div className="relative overflow-hidden rounded-[1.5rem] bg-[#fef1ee] px-5 py-10 text-center md:rounded-[2rem] md:px-12 md:py-12">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#fadadd]/60 blur-3xl" />
          <div className="relative mx-auto max-w-3xl">
            <h1 className="text-4xl font-bold text-[#70585b] md:text-5xl">Tambah Produk</h1>
            <p className="mt-4 text-base leading-7 text-[#4f4445] md:text-lg md:leading-8">
              Katalog lengkap Putisserie dengan stok, harga, detail produk,
              filter kategori, dan tombol cart yang langsung bisa digunakan.
            </p>
          </div>
        </div>

        <div className="sticky top-[116px] z-20 -mx-4 mt-8 border-y border-[#d2c3c4]/40 bg-[#fff8f6]/90 px-4 py-4 backdrop-blur-md md:top-20 md:mx-0 md:rounded-full md:border md:px-5 md:py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {categories.map((item) => (
                <Button
                  key={item}
                  type="button"
                  variant={category === item ? "default" : "outline"}
                  onClick={() => onCategory(item)}
                  className={cn(
                    "shrink-0 rounded-full px-5",
                    category === item
                      ? "bg-[#70585b] text-white hover:bg-[#70585b]/90"
                      : "border-[#d2c3c4] bg-transparent text-[#4f4445] hover:bg-[#f8ebe8]",
                  )}
                >
                  {item === "All" ? "Semua Cake" : item}
                </Button>
              ))}
            </div>
            <div className="relative w-full lg:max-w-xs">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#807475]" />
              <Input
                value={query}
                onChange={(event) => onQuery(event.target.value)}
                placeholder="Cari cake, macaron, gift..."
                className="h-11 rounded-full border-[#d2c3c4] bg-white/70 pl-10"
              />
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 md:mt-12 lg:grid-cols-3 lg:gap-y-14">
          {visibleProducts.map((product) => (
            <CatalogProductCard
              key={product.id}
              product={product}
              onAdd={onAddToCart}
              onProduct={onProduct}
            />
          ))}
        </div>

        <div className="mt-16 flex justify-center">
          <Button
            type="button"
            variant="outline"
            className="rounded-full border-[#70585b] px-10 text-[#70585b] hover:bg-[#fadadd]/40"
          >
            Lihat Produk Lainnya
          </Button>
        </div>
      </div>
    </section>
  );
}

function DashboardView({
  orders,
  onNavigate,
  onAddToCart,
  onPrint,
}: {
  orders: Order[];
  onNavigate: (view: View) => void;
  onAddToCart: (product: Product) => void;
  onPrint: (order: Order) => void;
}) {
  const activeOrder = orders.find((order) => order.status !== "Selesai") ?? orders[0];

  return (
    <section className="px-4 pb-20 pt-10 md:px-8">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-10">
          <h1 className="text-5xl font-bold text-[#70585b]">
            Selamat Datang Kembali, Putri!
          </h1>
          <p className="mt-3 text-lg text-[#4f4445]">
            Aroma croissant baru keluar oven menunggu kamu hari ini.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-12">
          <div className="rounded-[1.5rem] border border-[#ede0dd] bg-[#fef1ee] p-6 shadow-[0_4px_20px_rgba(74,66,64,0.05)] md:col-span-8 md:p-8">
            <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <h2 className="flex items-center gap-2 text-2xl font-semibold text-[#70585b]">
                <PackageCheck className="h-5 w-5" />
                Active Orders
              </h2>
              <Badge className="w-fit rounded-full bg-[#fadadd] px-4 py-1 text-[#765e61] hover:bg-[#fadadd]">
                {activeOrder.id}
              </Badge>
            </div>
            <div className="flex flex-col gap-8 md:flex-row md:items-center">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-2 border-[#fadadd]">
                <Image
                  src={activeOrder.items[0]?.image ?? products[0].image}
                  alt={activeOrder.items[0]?.name ?? "Active order"}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </div>
              <div className="w-full">
                <div className="mb-4 flex justify-between font-['Plus_Jakarta_Sans'] text-sm font-semibold text-[#70585b]">
                  <span>Baking</span>
                  <span className="text-[#5f5f59]/45">Cooling</span>
                  <span className="text-[#5f5f59]/45">Ready</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-[#e4e3db]">
                  <div className="h-full w-1/3 rounded-full bg-[#70585b] shadow-[0_0_10px_rgba(112,88,91,0.4)]" />
                </div>
                <p className="mt-4 italic leading-7 text-[#4f4445]">
                  &quot;Pesanan kamu sedang dipanggang. Notifikasi WhatsApp dan
                  email akan dikirim begitu status berubah.&quot;
                </p>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[1.5rem] bg-[#70585b] p-8 text-white shadow-[0_18px_44px_rgba(74,66,64,0.18)] md:col-span-4">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
            <h2 className="text-2xl font-semibold">Reorder?</h2>
            <p className="mt-3 text-white/80">
              Favorit terakhir kamu:
              <br />
              <strong>Parisian Macaron Cake</strong>
            </p>
            <Button
              type="button"
              onClick={() => onAddToCart(products[7])}
              className="mt-10 w-full rounded-full bg-white text-[#70585b] hover:bg-[#fff8f6]"
            >
              <Sparkles className="h-4 w-4" />
              Reorder Now
            </Button>
          </div>

          <div className="md:col-span-12">
            <div className="mb-5 flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-[#70585b]">
                  Special Recommendations
                </h2>
                <p className="text-[#5f5f59]">Hand-picked flavors for your palette</p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate("catalog")}
                className="font-['Plus_Jakarta_Sans'] text-sm font-semibold text-[#70585b]"
              >
                View All
              </button>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[products[0], products[7], products[6], products[8]].map((product) => (
                <RecommendationCard
                  key={product.id}
                  product={product}
                  onAdd={onAddToCart}
                />
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-[1.5rem] border border-[#ede0dd] bg-white/45 p-6 shadow-sm md:col-span-12 md:p-8">
            <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <h2 className="text-2xl font-semibold text-[#70585b]">
                Previous Orders
              </h2>
              <Button
                type="button"
                variant="outline"
                onClick={() => onNavigate("account")}
                className="w-fit rounded-full border-[#d2c3c4] text-[#70585b]"
              >
                <Settings className="h-4 w-4" />
                Account Settings
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#fadadd] font-['Plus_Jakarta_Sans'] text-xs uppercase tracking-wider text-[#70585b]">
                    <th className="pb-4">Date</th>
                    <th className="pb-4">Order ID</th>
                    <th className="pb-4">Items</th>
                    <th className="pb-4 text-right">Total</th>
                    <th className="pb-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f8ebe8]">
                  {orders.map((order) => (
                    <tr key={order.id} className="text-sm">
                      <td className="py-4">{order.date}</td>
                      <td className="py-4 font-medium text-[#70585b]">{order.id}</td>
                      <td className="py-4 text-[#4f4445]">
                        {order.items
                          .map((item) => `${item.quantity}x ${item.name}`)
                          .join(", ")}
                      </td>
                      <td className="py-4 text-right">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="py-4 text-right">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onPrint(order)}
                          className="rounded-full border-transparent bg-[#fadadd]/45 text-[#70585b] hover:bg-[#fadadd]"
                        >
                          <Printer className="h-4 w-4" />
                          Print Receipt
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function AccountView({
  orders,
  onPrint,
}: {
  orders: Order[];
  onPrint: (order: Order) => void;
}) {
  type AccountTab = "profile" | "orders" | "payments" | "addresses" | "notifications";

  const [activeTab, setActiveTab] = useState<AccountTab>("profile");
  const [editingProfile, setEditingProfile] = useState(false);

  return (
    <section className="px-4 pb-20 pt-10 md:px-8">
      <div className="mx-auto grid max-w-[1200px] gap-8 md:grid-cols-[280px_1fr]">
        <aside className="h-fit rounded-[1.5rem] border border-white/60 bg-[#fef1ee] p-5 shadow-[0_4px_20px_rgba(74,66,64,0.05)]">
          <div className="mb-6 flex items-center gap-4">
            <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-[#fadadd]">
              <Image
                src={heroImages.profile}
                alt="Putisserie buyer profile"
                fill
                sizes="64px"
                className="object-cover"
              />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[#70585b]">Putri Amelia</h2>
              <p className="font-['Plus_Jakarta_Sans'] text-xs font-semibold text-[#5f5f59]">
                Pastry Connoisseur
              </p>
            </div>
          </div>
          <nav className="space-y-2">
            <SideNavItem
              active={activeTab === "profile"}
              icon={<UserRound />}
              label="Profil Saya"
              onClick={() => setActiveTab("profile")}
            />
            <SideNavItem
              active={activeTab === "orders"}
              icon={<History />}
              label="Riwayat Order"
              onClick={() => setActiveTab("orders")}
            />
            <SideNavItem
              active={activeTab === "payments"}
              icon={<WalletCards />}
              label="Metode Pembayaran"
              onClick={() => setActiveTab("payments")}
            />
            <SideNavItem
              active={activeTab === "addresses"}
              icon={<MapPin />}
              label="Daftar Alamat"
              onClick={() => setActiveTab("addresses")}
            />
            <Separator className="my-3 bg-[#d2c3c4]/40" />
            <SideNavItem
              active={activeTab === "notifications"}
              icon={<Bell />}
              label="Preferensi Notifikasi"
              onClick={() => setActiveTab("notifications")}
            />
          </nav>
        </aside>

        <div className="space-y-8">
          {activeTab === "profile" ? (
            <section className="rounded-[1.5rem] border border-[#f8ebe8] bg-white p-6 shadow-[0_4px_20px_rgba(74,66,64,0.05)] transition-all duration-500 md:p-8">
              <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div>
                  <h1 className="text-3xl font-semibold text-[#70585b]">
                    Informasi Profil
                  </h1>
                  <p className="mt-1 text-[#5f5f59]">
                    Kelola informasi identitas akun pembeli Putisserie.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingProfile((value) => !value)}
                  className="w-fit rounded-full border-[#e9c349] text-[#735c00] hover:bg-[#ffdf84]/20"
                >
                  {editingProfile ? "Simpan Profil" : "Edit Profil"}
                </Button>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                {editingProfile ? (
                  <>
                    <CheckoutField label="Nama Lengkap" placeholder="Putri Amelia" />
                    <CheckoutField label="Email" type="email" placeholder="putri.amelia@email.com" />
                    <CheckoutField label="Nomor Telepon" placeholder="+62 812-3456-7890" />
                    <ProfileField label="Tanggal Bergabung" value="12 Maret 2026" />
                  </>
                ) : (
                  <>
                    <ProfileField label="Nama Lengkap" value="Putri Amelia" />
                    <ProfileField label="Email" value="putri.amelia@email.com" />
                    <ProfileField label="Nomor Telepon" value="+62 812-3456-7890" />
                    <ProfileField label="Tanggal Bergabung" value="12 Maret 2026" />
                  </>
                )}
              </div>
            </section>
          ) : null}

          {activeTab === "orders" ? (
            <section className="rounded-[1.5rem] border border-[#f8ebe8] bg-white p-6 shadow-[0_4px_20px_rgba(74,66,64,0.05)] transition-all duration-500 md:p-8">
              <div className="mb-6 flex items-end justify-between">
                <div>
                  <h2 className="text-3xl font-semibold text-[#70585b]">
                    Riwayat Order
                  </h2>
                  <p className="text-[#5f5f59]">
                    Status, invoice, dan histori belanja tersimpan di sini.
                  </p>
                </div>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                {orders.map((order) => (
                  <AccountOrderCard
                    key={order.id}
                    order={order}
                    onPrint={() => onPrint(order)}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {activeTab === "payments" ? (
            <section className="rounded-[1.5rem] border border-white/60 bg-[#fef1ee] p-6 transition-all duration-500 md:p-8">
              <h2 className="mb-2 text-3xl font-semibold text-[#70585b]">
                Metode Pembayaran
              </h2>
              <p className="mb-5 text-[#5f5f59]">
                Simpan metode pembayaran favorit untuk checkout Midtrans lebih cepat.
              </p>
              <div className="space-y-4">
                <PaymentCard
                  icon={<CreditCard />}
                  title="Virtual Account BCA"
                  detail="Disimpan untuk checkout Midtrans"
                  badge="Utama"
                />
                <PaymentCard
                  icon={<WalletCards />}
                  title="GoPay e-Wallet"
                  detail="Connected: +62 812-****-7890"
                />
                <div className="rounded-[1rem] border border-[#d2c3c4]/60 bg-white p-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <CheckoutField label="Nama Metode" placeholder="QRIS keluarga" />
                    <CheckoutField label="Nomor/ID" placeholder="putisserie-pay-01" />
                  </div>
                  <Button className="mt-4 rounded-full bg-[#70585b] text-white hover:bg-[#70585b]/90">
                    <Plus className="h-4 w-4" />
                    Tambah Metode Pembayaran
                  </Button>
                </div>
              </div>
            </section>
          ) : null}

          {activeTab === "addresses" ? (
            <section className="rounded-[1.5rem] border border-[#f8ebe8] bg-white p-6 shadow-[0_4px_20px_rgba(74,66,64,0.05)] transition-all duration-500 md:p-8">
              <h2 className="text-3xl font-semibold text-[#70585b]">
                Daftar Alamat
              </h2>
              <p className="mt-1 text-[#5f5f59]">
                Pilih alamat utama untuk delivery cake dan hampers.
              </p>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <AddressCard
                  title="Rumah"
                  detail="Jakarta"
                  badge="Utama"
                />
                <AddressCard
                  title="Kantor"
                  detail="Jakarta"
                />
              </div>
              <div className="mt-6 rounded-[1rem] border border-[#d2c3c4]/60 bg-[#fff8f6] p-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <CheckoutField label="Label Alamat" placeholder="Rumah orang tua" />
                  <CheckoutField label="Kota" placeholder="Jakarta" />
                  <CheckoutField
                    label="Alamat Lengkap"
                    placeholder="Nama jalan, nomor rumah, patokan"
                    className="md:col-span-2"
                  />
                </div>
                <Button className="mt-4 rounded-full bg-[#70585b] text-white hover:bg-[#70585b]/90">
                  <Plus className="h-4 w-4" />
                  Tambah Alamat
                </Button>
              </div>
            </section>
          ) : null}

          {activeTab === "notifications" ? (
            <section className="rounded-[1.5rem] border border-[#f8ebe8] bg-white p-6 shadow-[0_4px_20px_rgba(74,66,64,0.05)] transition-all duration-500 md:p-8">
              <h2 className="text-3xl font-semibold text-[#70585b]">
                Preferensi Notifikasi
              </h2>
              <p className="mt-1 text-[#5f5f59]">
                Atur kanal notifikasi untuk pembayaran, status oven, dan invoice.
              </p>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <PreferenceCard icon={<MessageCircle />} title="WhatsApp" text="Status order dan bantuan cepat" />
                <PreferenceCard icon={<Mail />} title="Email" text="Invoice dan ringkasan pembayaran" />
                <PreferenceCard icon={<Bell />} title="Promo musiman" text="Preview cake collection terbaru" />
                <PreferenceCard icon={<Truck />} title="Delivery update" text="Notifikasi saat kurir berangkat" />
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function CartSheet({
  open,
  onOpenChange,
  items,
  subtotal,
  deliveryFee,
  serviceFee,
  total,
  onUpdate,
  onRemove,
  onCheckout,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  total: number;
  onUpdate: (productId: string, direction: "increase" | "decrease") => void;
  onRemove: (productId: string) => void;
  onCheckout: () => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex h-full w-full max-w-full flex-col overflow-hidden border-[#d2c3c4] bg-[#fff8f6] p-4 sm:max-w-lg sm:p-6">
        <SheetHeader>
          <SheetTitle className="text-[#70585b]">Shopping Bag</SheetTitle>
          <SheetDescription>
            {items.length > 0
              ? `${items.length} pilihan siap checkout`
              : "Belum ada produk di keranjang"}
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
          {items.length === 0 ? (
            <div className="grid h-full place-items-center rounded-[1.5rem] border border-dashed border-[#d2c3c4] p-8 text-center">
              <div>
                <ShoppingBag className="mx-auto h-10 w-10 text-[#807475]" />
                <p className="mt-3 font-semibold text-[#70585b]">
                  Keranjang masih kosong
                </p>
                <p className="mt-1 text-sm text-[#5f5f59]">
                  Tambahkan pastry favorit dari katalog.
                </p>
              </div>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.product.id}
                className="grid grid-cols-[76px_1fr] gap-3 rounded-[1.25rem] border border-[#ede0dd] bg-white p-3 shadow-[0_4px_20px_rgba(74,66,64,0.04)] sm:grid-cols-[92px_1fr] sm:gap-4 sm:p-4"
              >
                <div className="relative h-[76px] w-[76px] overflow-hidden rounded-[1rem] sm:h-[92px] sm:w-[92px]">
                  <Image
                    src={item.product.image}
                    alt={item.product.name}
                    fill
                    sizes="92px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-['Quicksand'] text-base font-semibold leading-tight text-[#70585b] sm:text-lg">
                        {item.product.name}
                      </p>
                      <p className="mt-1 text-sm text-[#5f5f59]">
                        {formatCurrency(item.product.price)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemove(item.product.id)}
                      className="rounded-full text-[#807475] hover:bg-[#f8ebe8] hover:text-red-700"
                      aria-label={`Hapus ${item.product.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-2">
                    <QuantityPicker
                      quantity={item.quantity}
                      onDecrease={() => onUpdate(item.product.id, "decrease")}
                      onIncrease={() => onUpdate(item.product.id, "increase")}
                    />
                    <p className="font-semibold text-[#70585b]">
                      {formatCurrency(item.product.price * item.quantity)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <SheetFooter className="border-t border-[#d2c3c4]/40 pt-5">
          <div className="w-full space-y-3">
            <PriceRow label="Subtotal" value={subtotal} />
            <PriceRow label="Delivery Fee" value={deliveryFee} />
            <p className="text-xs leading-5 text-[#807475]">
              Ongkir final mengikuti provinsi tujuan di detail pengiriman.
            </p>
            <PriceRow label="Service Fee" value={serviceFee} />
            <Separator className="bg-[#d2c3c4]/50" />
            <PriceRow label="Total Amount" value={total} strong />
            <Button
              type="button"
              disabled={items.length === 0}
              onClick={onCheckout}
              className="h-12 w-full rounded-full bg-[#70585b] text-white hover:bg-[#70585b]/90"
            >
              Lanjut Pembayaran
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function CheckoutDialog({
  open,
  onOpenChange,
  items,
  subtotal,
  deliveryFee,
  serviceFee,
  successOrder,
  onPay,
  onPrint,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  successOrder: Order | null;
  onPay: (
    details: DeliveryDetails,
    paymentResult?: MidtransPaymentResult,
  ) => void;
  onPrint: (order: Order) => void;
}) {
  const [deliveryDetails, setDeliveryDetails] =
    useState<DeliveryDetails>(initialDeliveryDetails);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [snapReady, setSnapReady] = useState(false);
  const confirmationMessage = successOrder
    ? `Halo Putisserie, saya konfirmasi pembayaran untuk invoice ${successOrder.id}.`
    : "";
  const cityOptions = getCityOptions(deliveryDetails.province);
  const districtOptions = getDistrictOptions(deliveryDetails.city);
  const villageOptions = getVillageOptions(deliveryDetails.district);
  const canPay =
    items.length > 0 &&
    Boolean(deliveryDetails.name.trim()) &&
    Boolean(deliveryDetails.phone.trim()) &&
    Boolean(deliveryDetails.address.trim()) &&
    Boolean(deliveryDetails.province) &&
    Boolean(deliveryDetails.city) &&
    Boolean(deliveryDetails.district) &&
    Boolean(deliveryDetails.village) &&
    Boolean(deliveryDetails.deliveryDate);
  const checkoutDeliveryFee =
    items.length > 0 ? getDeliveryFeeByProvince(deliveryDetails.province) : deliveryFee;
  const checkoutTotal = subtotal + checkoutDeliveryFee + serviceFee;

  useEffect(() => {
    if (!open || successOrder) {
      return;
    }

    if (!midtransClientKey) {
      setSnapReady(false);
      return;
    }

    if (window.snap) {
      setSnapReady(true);
      return;
    }

    const existingScript = document.getElementById(
      "midtrans-snap-script",
    ) as HTMLScriptElement | null;

    if (existingScript) {
      const handleLoad = () => setSnapReady(Boolean(window.snap));
      const handleError = () =>
        setPaymentError("Gagal memuat Midtrans Snap. Coba refresh halaman.");

      existingScript.addEventListener("load", handleLoad);
      existingScript.addEventListener("error", handleError);

      return () => {
        existingScript.removeEventListener("load", handleLoad);
        existingScript.removeEventListener("error", handleError);
      };
    }

    const script = document.createElement("script");
    script.id = "midtrans-snap-script";
    script.src = midtransSnapScriptUrl;
    script.async = true;
    script.setAttribute("data-client-key", midtransClientKey);
    script.onload = () => setSnapReady(Boolean(window.snap));
    script.onerror = () =>
      setPaymentError("Gagal memuat Midtrans Snap. Coba refresh halaman.");

    document.body.appendChild(script);
  }, [open, successOrder]);

  const updateDeliveryDetail = (field: keyof DeliveryDetails, value: string) => {
    setDeliveryDetails((current) => ({ ...current, [field]: value }));
  };

  const updateProvince = (province: string) => {
    setDeliveryDetails((current) => ({
      ...current,
      province,
      city: "",
      district: "",
      village: "",
    }));
  };

  const updateCity = (city: string) => {
    setDeliveryDetails((current) => ({
      ...current,
      city,
      district: "",
      village: "",
    }));
  };

  const updateDistrict = (district: string) => {
    setDeliveryDetails((current) => ({
      ...current,
      district,
      village: "",
    }));
  };

  const handleMidtransPay = async () => {
    if (!canPay || isPaying) {
      return;
    }

    setPaymentError("");

    if (!midtransClientKey) {
      setPaymentError("Client key Midtrans belum dikonfigurasi di environment.");
      return;
    }

    if (!snapReady || !window.snap) {
      setPaymentError("Midtrans Snap sedang dimuat. Tunggu sebentar lalu coba lagi.");
      return;
    }

    setIsPaying(true);

    try {
      const response = await fetch("/api/midtrans/snap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
          })),
          deliveryDetails,
        }),
      });
      const data = (await response.json()) as {
        token?: string;
        message?: string;
      };

      if (!response.ok || !data.token) {
        throw new Error(data.message ?? "Gagal membuat transaksi Midtrans.");
      }

      const snapToken = data.token;
      onOpenChange(false);
      window.setTimeout(() => {
        window.snap?.pay(snapToken, {
          onSuccess: (result) => {
            setIsPaying(false);
            onPay(deliveryDetails, result);
          },
          onPending: (result) => {
            setIsPaying(false);
            onPay(deliveryDetails, result);
          },
          onError: (result) => {
            setIsPaying(false);
            setPaymentError(
              result.status_message ??
                "Pembayaran gagal diproses oleh Midtrans. Coba lagi.",
            );
            onOpenChange(true);
          },
          onClose: () => {
            setIsPaying(false);
            setPaymentError("Popup pembayaran ditutup sebelum transaksi selesai.");
            onOpenChange(true);
          },
        });
      }, 120);
    } catch (error) {
      setIsPaying(false);
      setPaymentError(
        error instanceof Error
          ? error.message
          : "Gagal membuka pembayaran Midtrans.",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] w-[calc(100vw-1rem)] max-w-6xl overflow-hidden border-[#d2c3c4] bg-[#fff8f6] p-0 sm:w-[calc(100vw-2rem)]">
        {successOrder ? (
          <div className="max-h-[88dvh] overflow-y-auto p-5 md:p-8">
            <DialogHeader>
              <DialogTitle className="text-2xl text-[#70585b] sm:text-3xl">
                Invoice Putisserie
              </DialogTitle>
              <DialogDescription>
                Invoice {successOrder.id} siap dikirim ke penjual.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-[#ede0dd] bg-white shadow-[0_12px_35px_rgba(74,66,64,0.06)]">
              <div className="flex flex-col gap-3 border-b border-[#ede0dd] bg-[#f8ebe8] p-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-['Plus_Jakarta_Sans'] text-xs font-bold uppercase tracking-widest text-[#807475]">
                    Nomor Invoice
                  </p>
                  <h3 className="mt-1 text-2xl font-bold text-[#70585b]">
                    {successOrder.id}
                  </h3>
                </div>
                <Badge className="w-fit rounded-full bg-[#e8f5eb] px-3 py-1 text-[#1f5130] hover:bg-[#e8f5eb]">
                  <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                  {successOrder.status}
                </Badge>
              </div>

              <div className="grid gap-4 p-5 sm:grid-cols-2">
                <InvoiceInfo label="Nama" value={successOrder.customer} />
                <InvoiceInfo label="Tanggal" value={successOrder.date} />
                <InvoiceInfo label="Pembayaran" value={successOrder.payment} />
                <InvoiceInfo label="Total" value={formatCurrency(successOrder.total)} />
                <div className="sm:col-span-2">
                  <InvoiceInfo label="Alamat" value={successOrder.address} />
                </div>
              </div>

              <div className="border-t border-[#ede0dd] p-5">
                <p className="font-['Plus_Jakarta_Sans'] text-xs font-bold uppercase tracking-widest text-[#807475]">
                  Detail Pesanan
                </p>
                <div className="mt-3 space-y-3">
                  {successOrder.items.map((item) => (
                    <div
                      key={`${successOrder.id}-${item.name}`}
                      className="flex items-center justify-between gap-4 text-sm"
                    >
                      <span className="text-[#4f4445]">
                        {item.quantity}x {item.name}
                      </span>
                      <span className="font-semibold text-[#70585b]">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter className="mt-6 gap-2 sm:justify-start [&>button]:w-full [&>button]:sm:w-auto">
              <Button
                onClick={() => onPrint(successOrder)}
                className="rounded-full bg-[#70585b] text-white hover:bg-[#70585b]/90"
              >
                <Printer className="h-4 w-4" />
                Cetak Invoice
              </Button>
              <Button
                asChild
                variant="outline"
                className="rounded-full border-[#25D366] text-[#168744] hover:bg-[#e8f5eb]"
              >
                <a
                  href={whatsappHref(confirmationMessage)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle className="h-4 w-4" />
                  Kirim ke Penjual
                </a>
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div>
            <div className="border-b border-[#d2c3c4]/40 px-5 py-4 md:px-8 md:py-5">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-center gap-2 text-2xl text-[#70585b] sm:text-3xl">
                  Putisserie
                </DialogTitle>
                <DialogDescription className="flex items-center justify-center gap-2 font-['Plus_Jakarta_Sans'] text-xs font-semibold uppercase tracking-widest">
                  <Lock className="h-3.5 w-3.5" />
                  Secure Checkout
                </DialogDescription>
              </DialogHeader>
            </div>
            <div className="grid max-h-[calc(92dvh-5rem)] gap-6 overflow-y-auto p-4 sm:p-6 md:grid-cols-[1fr_440px] md:gap-8 md:p-8">
              <div className="space-y-6 md:space-y-8">
                <section>
                  <div className="mb-4 flex items-center justify-between gap-3 sm:mb-5">
                    <h2 className="text-2xl font-semibold text-[#70585b] sm:text-3xl">
                      Your Selection
                    </h2>
                    <Badge className="rounded-full bg-[#fadadd] text-[#765e61] hover:bg-[#fadadd]">
                      {items.length} ITEMS
                    </Badge>
                  </div>
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div
                        key={`checkout-${item.product.id}`}
                        className="flex gap-3 rounded-[1.25rem] border border-[#ede0dd] bg-white p-3 shadow-[0_4px_20px_rgba(112,88,91,0.05)] sm:gap-4 sm:p-4"
                      >
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[1rem] sm:h-20 sm:w-20">
                          <Image
                            src={item.product.image}
                            alt={item.product.name}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                          <div>
                            <h3 className="font-['Quicksand'] text-base font-semibold leading-tight text-[#70585b] sm:text-lg">
                              {item.product.name}
                            </h3>
                            <p className="text-sm text-[#4f4445]">
                              {item.quantity}x {item.product.short}
                            </p>
                          </div>
                          <p className="font-semibold text-[#70585b] sm:text-right">
                            {formatCurrency(item.product.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-[1.5rem] border border-[#ede0dd] bg-white p-4 shadow-[0_4px_20px_rgba(112,88,91,0.05)] sm:p-6">
                  <h2 className="mb-5 flex items-center gap-3 text-2xl font-semibold text-[#70585b] sm:mb-6 sm:text-3xl">
                    <Truck className="h-6 w-6" />
                    Detail Pengiriman
                  </h2>
                  <div className="grid gap-5 md:grid-cols-2">
                    <CheckoutField
                      label="Nama Penerima"
                      placeholder="masukan nama"
                      value={deliveryDetails.name}
                      onChange={(value) => updateDeliveryDetail("name", value)}
                      required
                    />
                    <CheckoutField
                      label="Nomor WhatsApp"
                      placeholder="Contoh: 0812 3456 7890"
                      value={deliveryDetails.phone}
                      onChange={(value) => updateDeliveryDetail("phone", value)}
                      required
                    />
                    <CheckoutField
                      label="Alamat Lengkap"
                      placeholder="Nama jalan, nomor rumah, dan patokan"
                      value={deliveryDetails.address}
                      onChange={(value) =>
                        updateDeliveryDetail("address", value)
                      }
                      className="md:col-span-2"
                      required
                    />
                    <CheckoutSelect
                      label="Provinsi"
                      placeholder="Pilih provinsi"
                      value={deliveryDetails.province}
                      options={provinceOptions}
                      onChange={updateProvince}
                      required
                    />
                    <CheckoutSelect
                      label="Kota/Kabupaten"
                      placeholder="Pilih kota/kabupaten"
                      value={deliveryDetails.city}
                      options={cityOptions}
                      onChange={updateCity}
                      disabled={!deliveryDetails.province}
                      required
                    />
                    <CheckoutSelect
                      label="Kecamatan"
                      placeholder="Pilih kecamatan"
                      value={deliveryDetails.district}
                      options={districtOptions}
                      onChange={updateDistrict}
                      disabled={!deliveryDetails.city}
                      required
                    />
                    <CheckoutSelect
                      label="Kelurahan/Desa"
                      placeholder="Pilih kelurahan/desa"
                      value={deliveryDetails.village}
                      options={villageOptions}
                      onChange={(value) => updateDeliveryDetail("village", value)}
                      disabled={!deliveryDetails.district}
                      required
                    />
                    <CheckoutField
                      label="Tanggal Pengiriman"
                      type="date"
                      value={deliveryDetails.deliveryDate}
                      onChange={(value) =>
                        updateDeliveryDetail("deliveryDate", value)
                      }
                      required
                    />
                    <CheckoutField
                      label="Catatan Kartu"
                      placeholder="Tulis ucapan singkat untuk kartu"
                      value={deliveryDetails.note}
                      onChange={(value) => updateDeliveryDetail("note", value)}
                    />
                  </div>
                </section>
              </div>

              <aside className="h-fit rounded-[1.5rem] border border-white/60 bg-[#f8ebe8] p-4 shadow-[0_18px_50px_rgba(74,66,64,0.08)] sm:p-6 md:rounded-[2rem]">
                <h2 className="mb-5 text-2xl font-semibold text-[#70585b] sm:mb-6 sm:text-3xl">
                  Order Summary
                </h2>
                <div className="space-y-3">
                  <PriceRow label="Subtotal" value={subtotal} />
                  <PriceRow label="Delivery Fee" value={checkoutDeliveryFee} />
                  <PriceRow label="Service Fee" value={serviceFee} />
                  <Separator className="my-4 bg-[#d2c3c4]/60" />
                  <PriceRow label="Total Amount" value={checkoutTotal} strong />
                </div>
                <p className="mt-3 text-xs leading-5 text-[#807475]">
                  Ongkir dihitung otomatis dari provinsi tujuan. Pilih provinsi
                  untuk melihat estimasi final sebelum membayar.
                </p>

                <div className="mt-6 rounded-[1.25rem] border border-[#d2c3c4]/40 bg-white/60 p-4">
                  <Label className="font-['Plus_Jakarta_Sans'] text-xs uppercase tracking-widest text-[#70585b]">
                    Promo Code
                  </Label>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <Input
                      placeholder="Masukkan kode promo"
                      className="rounded-[1rem] border-[#d2c3c4] bg-white"
                    />
                    <Button className="rounded-[1rem] bg-[#5f5f59] px-5 text-white hover:bg-[#5f5f59]/90">
                      Apply
                    </Button>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={handleMidtransPay}
                  disabled={!canPay || isPaying}
                  className="mt-6 h-14 w-full rounded-[1rem] bg-[#70585b] text-base text-white hover:bg-[#70585b]/90"
                >
                  Bayar
                  <ArrowRight className="h-5 w-5" />
                </Button>
                {!canPay ? (
                  <p className="mt-3 text-center text-xs leading-5 text-[#807475]">
                    Lengkapi detail pengiriman dan pilihan wilayah Indonesia
                    sebelum melanjutkan pembayaran.
                  </p>
                ) : null}
                {paymentError ? (
                  <p className="mt-3 rounded-[0.9rem] border border-red-200 bg-red-50 p-3 text-center text-xs leading-5 text-red-700">
                    {paymentError}
                  </p>
                ) : null}

                <div className="mt-6 text-center">
                  <p className="font-['Plus_Jakarta_Sans'] text-[10px] font-bold uppercase tracking-[0.2em] text-[#807475]">
                    Accepted Payment Methods
                  </p>
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs font-bold">
                    {acceptedPaymentMethods.map((method) => (
                      <span
                        key={method}
                        className="rounded-full border border-[#d2c3c4]/60 bg-white px-3 py-1.5 text-[#70585b]"
                      >
                        {method}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-3 border-t border-[#d2c3c4]/50 pt-5 sm:grid-cols-2">
                  <TrustPill icon={<ShieldCheck />} title="Secure" text="256-bit" />
                  <TrustPill icon={<Sparkles />} title="Fresh" text="Baked daily" />
                </div>
              </aside>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ProductDialog({
  product,
  onClose,
  onAdd,
}: {
  product: Product | null;
  onClose: () => void;
  onAdd: (product: Product) => void;
}) {
  if (!product) {
    return null;
  }

  return (
    <Dialog open={Boolean(product)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92dvh] w-[calc(100vw-1rem)] max-w-5xl overflow-y-auto border-[#d2c3c4] bg-[#fff8f6] p-4 sm:w-[calc(100vw-2rem)] sm:p-6">
        <div className="grid gap-6 md:grid-cols-[0.95fr_1.05fr] md:gap-8">
          <div className="relative aspect-[16/11] overflow-hidden rounded-[1.5rem] bg-[#f8ebe8] shadow-[0_10px_40px_rgba(74,66,64,0.08)] sm:aspect-[4/5] md:rounded-[2rem]">
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(min-width: 768px) 45vw, 100vw"
              className="object-cover"
            />
            {product.badge ? (
              <div className="absolute left-4 top-4 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-[#e9c349] via-[#ffe088] to-[#e9c349] p-2 text-center font-['Plus_Jakarta_Sans'] text-[9px] font-bold uppercase leading-tight text-[#241a00] shadow-[0_10px_24px_rgba(115,92,0,0.18)] sm:left-5 sm:top-5 sm:h-16 sm:w-16 sm:text-[10px]">
                {product.badge}
              </div>
            ) : null}
          </div>
          <div className="flex flex-col gap-5 py-1 sm:gap-6 sm:py-2">
            <DialogHeader>
              <Badge className="w-fit rounded-full bg-[#fadadd] text-[#765e61] hover:bg-[#fadadd]">
                {product.category}
              </Badge>
              <DialogTitle className="text-3xl leading-tight text-[#201a19] sm:text-4xl md:text-5xl">
                {product.name}
              </DialogTitle>
              <DialogDescription className="text-base italic text-[#70585b] sm:text-lg">
                {product.short}
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-[1.25rem] border border-[#ede0dd] bg-white/70 p-5">
              <p className="font-['Plus_Jakarta_Sans'] text-xs font-bold uppercase tracking-widest text-[#70585b]">
                Deskripsi Cake
              </p>
              <p className="mt-3 text-sm leading-7 text-[#4f4445] sm:text-base sm:leading-8">
                {product.description} Dibuat dalam batch kecil, dikemas rapi,
                dan cocok untuk pickup, pengiriman, atau hadiah.
              </p>
            </div>
            <div className="flex flex-wrap items-baseline gap-3 sm:gap-4">
              <span className="font-['Quicksand'] text-3xl font-bold text-[#70585b] sm:text-4xl">
                {formatCurrency(product.price)}
              </span>
              {product.compareAt ? (
                <span className="text-[#807475] line-through">
                  {formatCurrency(product.compareAt)}
                </span>
              ) : null}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InfoTile icon={<Sparkles />} label="Rating" value={`${product.rating}/5`} />
              <InfoTile icon={<PackageCheck />} label="Stock" value={`${product.stock} pcs`} />
              <InfoTile icon={<Truck />} label="Ready" value={product.prepTime} />
              <InfoTile icon={<Gift />} label="Gift" value="Card available" />
            </div>
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-[#f8ebe8] px-3 py-1 text-xs font-semibold text-[#70585b]"
                >
                  {tag}
                </span>
              ))}
            </div>
            <DialogFooter className="mt-auto gap-2 sm:justify-end [&>button]:w-full [&>button]:sm:w-auto">
              <Button
                variant="outline"
                onClick={onClose}
                className="rounded-full border-[#d2c3c4]"
              >
                Tutup
              </Button>
              <Button
                onClick={() => {
                  onAdd(product);
                  onClose();
                }}
                className="rounded-full bg-[#70585b] px-8 text-white hover:bg-[#70585b]/90"
              >
                Order Cart
                <ShoppingBag className="h-4 w-4" />
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Footer({
  language,
  onNavigate,
  onSection,
}: {
  language: Language;
  onNavigate: (view: View) => void;
  onSection: (section: SectionTarget) => void;
}) {
  const t = appCopy[language];

  return (
    <footer className="rounded-t-[1.5rem] bg-[#f8ebe8] px-4 py-14 md:px-8">
      <div className="mx-auto grid max-w-[1200px] gap-10 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <div className="font-['Quicksand'] text-2xl font-bold text-[#70585b]">
            Putisserie
          </div>
          <p className="mt-4 max-w-sm leading-7 text-[#4f4445]">
            {t.footerText}
          </p>
        </div>
        <FooterColumn
          title="Explore"
          links={[
            [t.nav.about, "section:about"],
            [t.nav.collections, "section:collections"],
            [t.nav.fresh, "section:fresh"],
            [t.nav.contact, "section:contact"],
          ]}
          onSection={onSection}
          onNavigate={onNavigate}
        />
        <FooterColumn
          title="Social"
          links={[
            ["Instagram", "https://www.instagram.com/putisserie.id/"],
            ["TikTok", "https://www.tiktok.com/@putisserie.id"],
            ["Shopee", "https://shopee.co.id/putisserie"],
          ]}
        />
        <div>
          <h3 className="font-['Plus_Jakarta_Sans'] text-sm font-bold uppercase tracking-widest text-[#70585b]">
            Visit Us
          </h3>
          <p className="mt-4 leading-7 text-[#4f4445]">
            {storeAddress}
            <br />
            {storeHours}
          </p>
        </div>
      </div>
      <div className="mx-auto mt-10 max-w-[1200px] border-t border-[#d2c3c4]/50 pt-6 text-sm text-[#807475]">
        (c) 2026 Putisserie. Crafted with Sophisticated Sweetness.
      </div>
    </footer>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-['Quicksand'] text-2xl font-bold text-[#70585b] sm:text-3xl">
        {value}
      </div>
      <div className="mt-1 font-['Plus_Jakarta_Sans'] text-[10px] font-semibold uppercase tracking-wider text-[#5f5f59] sm:text-xs">
        {label}
      </div>
    </div>
  );
}

function SectionIntro({ title, text }: { title: string; text: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <h2 className="text-2xl font-semibold text-[#70585b] sm:text-3xl">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-[#5f5f59] sm:text-base">{text}</p>
    </div>
  );
}

function CollectionProductCard({
  product,
  onAdd,
  onProduct,
  language,
}: {
  product: Product;
  onAdd: (product: Product) => void;
  onProduct: (product: Product) => void;
  language: Language;
}) {
  const cta = language === "id" ? "Pesan ke Keranjang" : "Add to Cart";
  const detail =
    language === "id" ? "Klik untuk liat deskripsi" : "Click to view description";

  return (
    <article className="group relative overflow-hidden rounded-[1.5rem] border border-white/70 bg-white shadow-[0_8px_26px_rgba(74,66,64,0.06)] transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02] hover:shadow-[0_18px_44px_rgba(112,88,91,0.16)] focus-within:-translate-y-2 focus-within:scale-[1.02]">
      <button
        type="button"
        onClick={() => onProduct(product)}
        className="relative block aspect-[4/3] w-full overflow-hidden text-left"
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-700 group-hover:scale-110 group-focus-within:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#201a19]/55 via-[#201a19]/8 to-transparent opacity-75 transition-opacity duration-500 group-hover:opacity-90" />
        {product.badge ? (
          <Badge className="absolute left-4 top-4 rounded-full bg-[#ffe088] text-[#574500] hover:bg-[#ffe088]">
            {product.badge}
          </Badge>
        ) : null}
        <div className="absolute bottom-4 left-4 max-w-[82%] translate-y-3 rounded-full border border-white/50 bg-[#fff8f6]/65 px-4 py-2 text-[#70585b] opacity-0 shadow-[0_12px_30px_rgba(32,26,25,0.18)] backdrop-blur-xl transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
          <p className="font-['Plus_Jakarta_Sans'] text-[11px] font-bold uppercase tracking-wider">
            {detail}
          </p>
        </div>
      </button>
      <div className="space-y-3 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-['Plus_Jakarta_Sans'] text-[11px] font-bold uppercase tracking-wider text-[#807475]">
              {product.category}
            </p>
            <h3 className="mt-1 font-['Quicksand'] text-lg font-bold leading-tight text-[#70585b] sm:text-xl">
              {product.name}
            </h3>
          </div>
          <span className="shrink-0 rounded-full bg-[#f8ebe8] px-3 py-1 font-['Plus_Jakarta_Sans'] text-xs font-bold text-[#70585b]">
            {product.rating}
          </span>
        </div>
        <p className="text-sm font-semibold leading-6 text-[#70585b]">
          {product.short}
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs text-[#5f5f59]">
          <span className="rounded-full bg-[#fff8f6] px-3 py-2">
            Stock {product.stock} pcs
          </span>
          <span className="rounded-full bg-[#fff8f6] px-3 py-2">
            {product.prepTime}
          </span>
        </div>
        <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-['Plus_Jakarta_Sans'] text-sm font-bold text-[#70585b]">
            {formatCurrency(product.price)}
          </p>
          <Button
            type="button"
            onClick={() => onAdd(product)}
            className="w-full rounded-full bg-[#70585b] px-4 text-white hover:bg-[#70585b]/90 sm:w-auto"
          >
            <ShoppingBag className="h-4 w-4" />
            {cta}
          </Button>
        </div>
      </div>
    </article>
  );
}

function MiniProductCard({
  product,
  onAdd,
  onProduct,
}: {
  product: Product;
  onAdd: (product: Product) => void;
  onProduct: (product: Product) => void;
}) {
  return (
    <div className="group text-center">
      <button
        type="button"
        onClick={() => onProduct(product)}
        className="relative mb-4 aspect-square w-full overflow-hidden rounded-[2rem] bg-[#f8ebe8] shadow-[0_4px_20px_rgba(74,66,64,0.05)]"
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <span className="absolute bottom-4 right-4 grid h-11 w-11 translate-y-3 place-items-center rounded-full bg-[#fff8f6]/90 text-[#70585b] opacity-0 shadow-md backdrop-blur transition-all group-hover:translate-y-0 group-hover:opacity-100">
          <ShoppingBag className="h-4 w-4" />
        </span>
      </button>
      <h3 className="font-['Quicksand'] text-lg font-semibold text-[#70585b]">
        {product.name}
      </h3>
      <p className="mt-1 text-sm text-[#5f5f59]">{formatCurrency(product.price)}</p>
      <Button
        type="button"
        onClick={() => onAdd(product)}
        className="mt-3 rounded-full bg-[#70585b] px-5 text-white shadow-[0_8px_18px_rgba(112,88,91,0.14)] hover:bg-[#70585b]/90"
      >
        <ShoppingBag className="h-4 w-4" />
        Order Cart
      </Button>
    </div>
  );
}

function CatalogProductCard({
  product,
  onAdd,
  onProduct,
}: {
  product: Product;
  onAdd: (product: Product) => void;
  onProduct: (product: Product) => void;
}) {
  return (
    <div className="group flex flex-col items-center text-center">
      <button
        type="button"
        onClick={() => onProduct(product)}
        className="relative mb-6 aspect-[4/5] w-full overflow-hidden rounded-[1.5rem] bg-[#f8ebe8] shadow-[0_4px_20px_rgba(74,66,64,0.05)] transition-transform duration-500 group-hover:scale-[1.02]"
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover"
        />
        {product.badge ? (
          <span className="absolute right-4 top-4 grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-[#ffe088] to-[#e9c349] p-2 text-center font-['Plus_Jakarta_Sans'] text-[9px] font-bold uppercase leading-tight text-[#241a00] shadow-[0_8px_18px_rgba(115,92,0,0.16)]">
            {product.badge}
          </span>
        ) : null}
      </button>
      <h3 className="font-['Quicksand'] text-xl font-semibold leading-tight text-[#201a19] sm:text-2xl">
        {product.name}
      </h3>
      <p className="mt-2 italic text-[#4f4445]">{product.short}</p>
      <p className="mt-2 font-['Plus_Jakarta_Sans'] text-sm font-semibold text-[#70585b]">
        {formatCurrency(product.price)}
      </p>
      <div className="mt-4 flex w-full gap-2 sm:w-auto">
        <Button
          type="button"
          onClick={() => onProduct(product)}
          variant="outline"
          className="flex-1 rounded-full border-[#d2c3c4] bg-transparent text-[#70585b] sm:flex-none"
        >
          Detail
        </Button>
        <Button
          type="button"
          onClick={() => onAdd(product)}
          className="flex-1 rounded-full bg-[#70585b] px-5 text-white hover:bg-[#70585b]/90 sm:flex-none sm:px-7"
        >
          <ShoppingBag className="h-4 w-4" />
          Order Cart
        </Button>
      </div>
    </div>
  );
}

function RecommendationCard({
  product,
  onAdd,
}: {
  product: Product;
  onAdd: (product: Product) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onAdd(product)}
      className="group rounded-[1.25rem] bg-white p-4 text-center shadow-[0_4px_20px_rgba(74,66,64,0.05)] transition-shadow hover:shadow-[0_8px_30px_rgba(74,66,64,0.10)]"
    >
      <div className="relative aspect-square overflow-hidden rounded-[1rem]">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <h3 className="mt-4 font-['Quicksand'] text-lg font-semibold">
        {product.name}
      </h3>
      <p className="mt-1 font-['Plus_Jakarta_Sans'] text-sm font-semibold text-[#70585b]">
        {formatCurrency(product.price)}
      </p>
    </button>
  );
}

function SideNavItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-full px-4 py-3 font-['Plus_Jakarta_Sans'] text-sm font-semibold transition-colors [&_svg]:h-4 [&_svg]:w-4",
        active
          ? "bg-[#70585b] text-white shadow-[0_4px_14px_rgba(112,88,91,0.15)]"
          : "text-[#5f5f59] hover:bg-[#ede0dd] hover:text-[#70585b]",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Label className="ml-1 font-['Plus_Jakarta_Sans'] text-xs uppercase tracking-wider text-[#4f4445]">
        {label}
      </Label>
      <div className="mt-2 rounded-[1rem] border-b-2 border-[#d2c3c4] bg-[#fff8f6] p-4">
        {value}
      </div>
    </div>
  );
}

function AccountOrderCard({
  order,
  onPrint,
}: {
  order: Order;
  onPrint: () => void;
}) {
  return (
    <div className="rounded-[1.25rem] border border-[#f8ebe8] bg-white p-5 shadow-[0_4px_20px_rgba(74,66,64,0.03)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <Badge className="rounded-full bg-[#fadadd]/40 text-[#765e61] hover:bg-[#fadadd]/40">
          {order.status}
        </Badge>
        <span className="text-xs font-semibold text-[#807475]">{order.id}</span>
      </div>
      <div className="flex gap-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[1rem]">
          <Image
            src={order.items[0].image}
            alt={order.items[0].name}
            fill
            sizes="80px"
            className="object-cover"
          />
        </div>
        <div className="min-w-0">
          <h3 className="font-['Quicksand'] text-lg font-semibold text-[#70585b]">
            {order.items[0].name}
          </h3>
          <p className="text-sm text-[#5f5f59]">
            {order.items.length} items - {formatCurrency(order.total)}
          </p>
          <p className="mt-1 text-xs italic text-[#807475]">{order.date}</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onPrint}
            className="mt-2 rounded-full text-[#70585b] hover:bg-[#fadadd]/40"
          >
            <Printer className="h-4 w-4" />
            Print Receipt
          </Button>
        </div>
      </div>
    </div>
  );
}

function PaymentCard({
  icon,
  title,
  detail,
  badge,
}: {
  icon: ReactNode;
  title: string;
  detail: string;
  badge?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[1rem] border border-white/60 bg-[#fff8f6] p-4">
      <div className="flex items-center gap-4">
        <span className="grid h-12 w-14 place-items-center rounded-[0.85rem] border border-[#d2c3c4]/40 bg-white text-[#70585b] [&_svg]:h-5 [&_svg]:w-5">
          {icon}
        </span>
        <div>
          <p className="font-semibold text-[#201a19]">{title}</p>
          <p className="text-sm text-[#5f5f59]">{detail}</p>
        </div>
      </div>
      {badge ? (
        <Badge className="rounded-full bg-[#70585b]/10 text-[#70585b] hover:bg-[#70585b]/10">
          {badge}
        </Badge>
      ) : null}
    </div>
  );
}

function AddressCard({
  title,
  detail,
  badge,
}: {
  title: string;
  detail: string;
  badge?: string;
}) {
  return (
    <div className="rounded-[1rem] border border-[#ede0dd] bg-[#fff8f6] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-['Quicksand'] text-xl font-semibold text-[#70585b]">
            {title}
          </h3>
          <p className="mt-2 leading-7 text-[#4f4445]">{detail}</p>
        </div>
        {badge ? (
          <Badge className="rounded-full bg-[#fadadd] text-[#70585b] hover:bg-[#fadadd]">
            {badge}
          </Badge>
        ) : null}
      </div>
      <div className="mt-4 flex gap-2">
        <Button variant="outline" size="sm" className="rounded-full border-[#d2c3c4] text-[#70585b]">
          Edit
        </Button>
        <Button variant="ghost" size="sm" className="rounded-full text-[#807475] hover:bg-[#f8ebe8]">
          Jadikan Utama
        </Button>
      </div>
    </div>
  );
}

function PreferenceCard({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-4 rounded-[1rem] border border-[#ede0dd] bg-[#fff8f6] p-5">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#fadadd] text-[#70585b] [&_svg]:h-5 [&_svg]:w-5">
        {icon}
      </span>
      <div>
        <h3 className="font-['Quicksand'] text-lg font-semibold text-[#70585b]">
          {title}
        </h3>
        <p className="mt-1 text-sm leading-6 text-[#4f4445]">{text}</p>
      </div>
      <span className="ml-auto mt-1 h-6 w-11 rounded-full bg-[#70585b] p-1">
        <span className="block h-4 w-4 translate-x-5 rounded-full bg-white" />
      </span>
    </div>
  );
}

function QuantityPicker({
  quantity,
  onDecrease,
  onIncrease,
}: {
  quantity: number;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  return (
    <div className="flex items-center rounded-full border border-[#ede0dd] bg-[#f8ebe8] px-1 py-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onDecrease}
        className="h-8 w-8 rounded-full hover:bg-white"
        aria-label="Kurangi jumlah"
      >
        <Minus className="h-4 w-4" />
      </Button>
      <span className="w-8 text-center text-sm font-semibold">{quantity}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onIncrease}
        className="h-8 w-8 rounded-full hover:bg-white"
        aria-label="Tambah jumlah"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}

function PriceRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: number;
  strong?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between text-sm text-[#4f4445]",
        strong && "font-['Quicksand'] text-xl font-bold text-[#70585b]",
      )}
    >
      <span>{label}</span>
      <span>{formatCurrency(value)}</span>
    </div>
  );
}

function InvoiceInfo({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-['Plus_Jakarta_Sans'] text-[11px] font-bold uppercase tracking-wider text-[#807475]">
        {label}
      </p>
      <p className="mt-1 font-semibold leading-6 text-[#70585b]">{value}</p>
    </div>
  );
}

function CheckoutField({
  label,
  placeholder,
  type = "text",
  className,
  value,
  onChange,
  required,
}: {
  label: string;
  placeholder?: string;
  type?: string;
  className?: string;
  value?: string;
  onChange?: (value: string) => void;
  required?: boolean;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label className="ml-1 font-['Plus_Jakarta_Sans'] text-[11px] uppercase tracking-wider text-[#4f4445]">
        {label}
        {required ? <span className="ml-1 text-red-700">*</span> : null}
      </Label>
      <Input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        required={required}
        className="h-12 rounded-[1rem] border-[#d2c3c4]/70 bg-[#fff8f6] px-5 placeholder:text-[#807475]/50 focus-visible:ring-[#70585b]"
      />
    </div>
  );
}

function CheckoutSelect({
  label,
  placeholder,
  value,
  options,
  onChange,
  disabled,
  required,
  className,
}: {
  label: string;
  placeholder: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label className="ml-1 font-['Plus_Jakarta_Sans'] text-[11px] uppercase tracking-wider text-[#4f4445]">
        {label}
        {required ? <span className="ml-1 text-red-700">*</span> : null}
      </Label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        required={required}
        className="h-12 w-full rounded-[1rem] border border-[#d2c3c4]/70 bg-[#fff8f6] px-5 text-sm text-[#201a19] outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus:border-[#70585b] focus:ring-2 focus:ring-[#70585b]/20 [&:invalid]:text-[#807475]/50 [&_option]:bg-white [&_option]:text-[#201a19]"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function TrustPill({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-[0.85rem] border border-white/70 bg-white/50 p-3 text-[#70585b]">
      <span className="[&_svg]:h-4 [&_svg]:w-4">{icon}</span>
      <div>
        <p className="font-['Plus_Jakarta_Sans'] text-[10px] font-bold uppercase leading-tight">
          {title}
        </p>
        <p className="text-[10px] text-[#5f5f59]">{text}</p>
      </div>
    </div>
  );
}

function ContactCard({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-4 rounded-[1.25rem] border border-white/70 bg-white/70 p-5 shadow-[0_8px_24px_rgba(74,66,64,0.04)]">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#fadadd] text-[#70585b] [&_svg]:h-5 [&_svg]:w-5">
        {icon}
      </span>
      <div>
        <h3 className="font-['Quicksand'] text-lg font-semibold text-[#70585b]">
          {title}
        </h3>
        <p className="mt-1 leading-6 text-[#4f4445]">{text}</p>
      </div>
    </div>
  );
}

function InfoTile({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1rem] border border-[#ede0dd] bg-white p-3">
      <div className="flex items-center gap-2 text-[#807475] [&_svg]:h-4 [&_svg]:w-4">
        {icon}
        <span className="font-['Plus_Jakarta_Sans'] text-xs font-semibold uppercase">
          {label}
        </span>
      </div>
      <p className="mt-2 font-semibold text-[#70585b]">{value}</p>
    </div>
  );
}

function FooterColumn({
  title,
  links,
  onSection,
  onNavigate,
}: {
  title: string;
  links: Array<[string, View | `section:${SectionTarget}` | `https://${string}`]>;
  onSection?: (section: SectionTarget) => void;
  onNavigate?: (view: View) => void;
}) {
  return (
    <div>
      <h3 className="font-['Plus_Jakarta_Sans'] text-sm font-bold uppercase tracking-widest text-[#70585b]">
        {title}
      </h3>
      <div className="mt-4 flex flex-col gap-3">
        {links.map(([label, target]) => {
          if (target.startsWith("https://")) {
            return (
              <a
                key={`${title}-${label}`}
                href={target}
                target="_blank"
                rel="noreferrer"
                className="w-fit text-[#4f4445] underline-offset-4 hover:text-[#70585b] hover:underline"
              >
                {label}
              </a>
            );
          }

          return (
            <button
              key={`${title}-${label}`}
              type="button"
              onClick={() => {
                if (target.startsWith("section:")) {
                  onSection?.(target.replace("section:", "") as SectionTarget);
                  return;
                }

                onNavigate?.(target as View);
              }}
              className="w-fit text-[#4f4445] underline-offset-4 hover:text-[#70585b] hover:underline"
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function InvoicePrint({ order }: { order: Order }) {
  return (
    <div
      id="invoice-print"
      className="fixed -left-[9999px] top-0 w-[760px] bg-white p-8 text-[#201a19]"
    >
      <div className="flex items-start justify-between border-b pb-6">
        <div>
          <div className="flex items-center gap-2 font-['Quicksand'] text-3xl font-bold text-[#70585b]">
            Putisserie
          </div>
          <p className="mt-2 text-sm text-[#5f5f59]">
            Sophisticated sweetness, freshly baked daily.
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-[#5f5f59]">Invoice</p>
          <p className="mt-1 font-['Quicksand'] text-lg font-bold">{order.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 py-6 text-sm">
        <div>
          <p className="font-semibold text-[#70585b]">Pembeli</p>
          <p className="mt-2">{order.customer}</p>
          <p className="mt-1 text-[#5f5f59]">{order.address}</p>
        </div>
        <div>
          <p className="font-semibold text-[#70585b]">Pembayaran</p>
          <p className="mt-2">{order.payment}</p>
          <p className="mt-1 text-[#5f5f59]">{order.date}</p>
        </div>
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b bg-[#f8ebe8] text-left">
            <th className="p-3">Produk</th>
            <th className="p-3 text-center">Qty</th>
            <th className="p-3 text-right">Harga</th>
            <th className="p-3 text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item) => (
            <tr key={`print-${order.id}-${item.name}`} className="border-b">
              <td className="p-3">{item.name}</td>
              <td className="p-3 text-center">{item.quantity}</td>
              <td className="p-3 text-right">{formatCurrency(item.price)}</td>
              <td className="p-3 text-right">
                {formatCurrency(item.price * item.quantity)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="ml-auto mt-6 w-72 space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Status</span>
          <span className="font-semibold">{order.status}</span>
        </div>
        <div className="flex justify-between border-t pt-3 font-['Quicksand'] text-xl font-bold">
          <span>Total</span>
          <span>{formatCurrency(order.total)}</span>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-3 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-[#70585b]" />
          {storeAddress}
        </div>
        <div className="flex items-center gap-2">
          <ReceiptText className="h-4 w-4 text-[#70585b]" />
          {order.id}
        </div>
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-[#70585b]" />
          Email sent
        </div>
      </div>
    </div>
  );
}
