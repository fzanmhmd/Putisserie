export type ProductCategory =
  | "All"
  | "Cakes"
  | "Fresh Bakes"
  | "Macarons"
  | "Gift Boxes"
  | "Gluten-Free";

export type Product = {
  id: string;
  name: string;
  category: Exclude<ProductCategory, "All">;
  short: string;
  description: string;
  price: number;
  compareAt?: number;
  image: string;
  badge?: string;
  prepTime: string;
  stock: number;
  rating: number;
  tags: string[];
};

export type CartItem = {
  product: Product;
  quantity: number;
};

export type OrderStatus =
  | "Menunggu Pembayaran"
  | "Dibayar"
  | "Baking"
  | "Cooling"
  | "Siap Diambil"
  | "Selesai";

export type OrderItem = {
  name: string;
  quantity: number;
  price: number;
  image: string;
};

export type Order = {
  id: string;
  date: string;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  customer: string;
  address: string;
  payment: string;
};

export const products: Product[] = [
  {
    id: "signature-strawberry-rose",
    name: "Signature Strawberry Rose Cake",
    category: "Cakes",
    short: "Rose chiffon, wild strawberry, vanilla cream",
    description:
      "Layer cake lembut dengan rosewater chiffon, kompot stroberi, Madagascar vanilla cream, dan blush ganache.",
    price: 250000,
    compareAt: 315000,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDo3EZd0kh6AVjwiLyGDVAwPU53BvgZr9t_jE58Z1wdmtZNcpbsWEqjR30T96ADy0cv2a7x4t35JyIrUQvPgMOLVpngFk-PLqAxEC5Fj4whiPy0jNrljwq6qwp5sTOBKzewCdHNVksJlKdgnU3hmrSBSUVejErgM11569pg-vvY0G3benhA6FMLzEFEUDDNcR3-H3M6anynWbOz9--fVNPrHoC7ZLgMJ1XAQAHlEQqGAEKkzbPbvFK3YBIIan_cNVbGrNOLMfVXtRc",
    badge: "Chef's Choice",
    prepTime: "4 jam",
    stock: 8,
    rating: 4.9,
    tags: ["Limited Edition", "Celebration", "Best Seller"],
  },
  {
    id: "classic-butter-croissant",
    name: "Belgian Chocolate Ganache Cake",
    category: "Cakes",
    short: "Dark chocolate sponge, ganache, cocoa nibs",
    description:
      "Cake cokelat premium dengan sponge lembap, ganache Belgian chocolate, dan taburan cocoa nibs renyah.",
    price: 275000,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCL2qZog9ypVG9lYzaiycyqT954KOu1Huk0qUmxiPIe0r_53k2MRIH4FIsamuRC1a0SsTVdXFyAm4EU8k66cENiII6xAi16437Wq4XD-FkMqt3ZOvJ8kfL1fMxv8vKsFl-qbygs56Av06DsifkaL_pRMhZEiiHZpaQTEIbKayBQRxmzO2MzNObHgkm4qXkXU7ablONkbrKFt8tH_UgnelvNWmNkeRVx68K7v0aa_gYmn5aRLi2jT4KwkqmxG4PECeTHeaw9LNdfjI4",
    badge: "New",
    prepTime: "Siap hari ini",
    stock: 24,
    rating: 4.8,
    tags: ["Chocolate", "Birthday", "Best Seller"],
  },
  {
    id: "pain-au-chocolat",
    name: "Vanilla Berry Chantilly Cake",
    category: "Cakes",
    short: "Vanilla sponge, berry compote, chantilly cream",
    description:
      "Layer cake vanilla lembut dengan berry compote segar, chantilly cream ringan, dan dekorasi buah musiman.",
    price: 260000,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAya1Me5NTj71J3zhg0ncpsAvY2_auwXAADjj19MAvV42P3KCXK6Zor37OQWIQ9F6j5wuV1eU08ZnekVoOkoqiA-x2V7ex2pD_7xjgai9OR90ErpfAA9COU1-OxXZ3I_ZReUXQkDerKUWin5rPAOQB5YrabhD9bmFF7DyF_4_LGAgRt9v1Q-7fW5rj0BSygpI5GOenu5iIJx5XRpofknnzjZqqDfl9_NgXjsLtcvygQdEYgpBkFeklOY1Xl0FDclyDnoi6WNaJIMZ4",
    prepTime: "Siap hari ini",
    stock: 18,
    rating: 4.7,
    tags: ["Berry", "Celebration", "Soft Cream"],
  },
  {
    id: "raspberry-crown",
    name: "Raspberry Crown Cheesecake",
    category: "Cakes",
    short: "Cream cheese, raspberry glaze, biscuit base",
    description:
      "Cheesecake creamy dengan raspberry glaze glossy, base biskuit butter, dan crown berry sebagai centerpiece.",
    price: 285000,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDwLUaS9tyJnCnNXEBpDIp6TeVehLlDNADRzjAPYJJ9oCbreoLqFbzXtbjzXHXMOWR9opMQDvxcwIv0BSMck5l7WyGW1_vr4t5JaxtvksziVdoxvCzW7pYHAUmx-RSFsjB_rvN5X-uaBO-ID2X4yOE_rUH1j2RsxSYQ1xpGNwiPz2ABxqTrQW0ReRs-MWzIXiMU8FbcSXxr8l5h8p5GUkNo8OnMJB8BjO8X18MIdx8qQAy4jEySIVobkaBv56Pox50IaE56pwhpKx4",
    badge: "Chef's Choice",
    prepTime: "Siap hari ini",
    stock: 15,
    rating: 4.9,
    tags: ["Cheesecake", "Berry", "Chef's Choice"],
  },
  {
    id: "spinach-feta-roll",
    name: "Matcha Pistachio Layer Cake",
    category: "Cakes",
    short: "Matcha sponge, pistachio cream, white ganache",
    description:
      "Cake matcha dengan pistachio cream, white chocolate ganache, dan rasa earthy yang elegan.",
    price: 295000,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAt6n9OZZt7Uot8WBgBRv3baYj5yiO_YU1tRV7rY1nY7aaPxy89x8hSnmo4veEl2-NidMpdu9N1-OUWtA0oAyn6AF2UWh3STjuCTInAPOQ4GXEPg_MSxlDRy7sYO_acuI7Pvfl1jQxULlS6SJBRlmlew2VDhI8JBAEfYN8n1vtoZjH2Gu1v-q3HUgG1fuWb9UkyyM7YZT-NygsZbqI5TuSPztGHSQJO-XhdMqp64Q5OtAcHRvT6kKQh3NEoeGEMb1j7OXz3mw3WHYQ",
    prepTime: "Siap hari ini",
    stock: 14,
    rating: 4.6,
    tags: ["Matcha", "Pistachio", "Premium"],
  },
  {
    id: "almond-frangipane",
    name: "Almond Frangipane Cake",
    category: "Cakes",
    short: "Almond sponge, frangipane cream, apricot glaze",
    description:
      "Cake almond dengan frangipane lembut, almond panggang, dan apricot glaze yang memberi kilau hangat.",
    price: 245000,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD7xxyLnFryjV3Vh-wz3epSJ7Fk-t3SjE3mv-FR6FQSHPiom0Ub-55-hmOqg7QRNBO0hsYWFWtfENcSCFkXe1EdOAffacze2wjo5qLl8m8jEqNudUpJf_dwtuCXdVGtTd9D11dVvhE02qEIzJz7XbXuHy2VKJXMFhIlAcCvTwdsPjh-rN9TXwsY-L18Pipi2zZ6yAyXX-uMTYGhromGkRwP9mDM5Zs0OaCLl5ySETlJaovULgiqDSpMWsp69tSnyg11leBjCXTqKeI",
    prepTime: "2 jam",
    stock: 10,
    rating: 4.8,
    tags: ["Nutty", "Tea Time"],
  },
  {
    id: "gluten-free-morning-bun",
    name: "Gluten-Free Cinnamon Apple Cake",
    category: "Gluten-Free",
    short: "Apple compote, cinnamon sponge, pecan crumble",
    description:
      "Cake bebas gluten dengan apple compote, cinnamon sponge, pecan crumble, dan tekstur moist.",
    price: 255000,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCpqKCIwGqLTkMIiLnBwPhRMaSxaf7AqlcQPhZBPqTllHutYHYCRZ4I8TYSI6nq2GVnnKGaK_fvixA5BfflppgoGSbpvHrIuDY4xP6Zx32DETB3l0Z4dg_gSRNFrlCqC6vvV-vF8-fT4eKjzZr8jG7kh7_PeK5L7USZpY5582pxybKzXH7do81yCr8KiFgR8EoACeothtAYGQLc4hMX0rTXriB0W7ZBZLX0Vdekr2TzPYgpjuQrsBKKp9gAUOzz3SBTmXWYLE3F6xA",
    badge: "GF",
    prepTime: "Siap hari ini",
    stock: 9,
    rating: 4.7,
    tags: ["Gluten-Free", "Apple", "Cinnamon"],
  },
  {
    id: "parisian-macaron-box",
    name: "Parisian Macaron Cake",
    category: "Macarons",
    short: "Macaron shell, vanilla mousse, seasonal berries",
    description:
      "Cake bergaya macaron besar dengan vanilla mousse, seasonal berries, dan shell almond yang ringan.",
    price: 235000,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAAy1qF4xghSa0do4raX8v1UdHDthjLj_v3UFyUHNr2N-y5C8Ulb-Cz5GLr4d6KFDiH9MtUL70zX2QTC-W8Vqe3M1uElz2zq5XIPF-ep1wifQbA0LonVZssMLZ-p-FiR-RG_07GvDV5PmyK5Eop60gOZOPujjq3Zi6czXaxLBj5pmU6KmCr5JV66SDi6TQa_QJ8MBDlEmsgr3cMc0iCAHoQjz73olrYhKcozcJLiLmbzGO-3_trL0dFaLYFWYaLNb501Amve-o-lWU",
    badge: "Best Seller",
    prepTime: "1 jam",
    stock: 12,
    rating: 4.9,
    tags: ["Macaron", "Giftable", "Elegant"],
  },
  {
    id: "sweet-gift-box",
    name: "Sweet Celebration Gift Cake",
    category: "Gift Boxes",
    short: "Mini cake set, greeting card, ribbon box",
    description:
      "Gift cake set berisi mini cake premium, kartu ucapan, pita blush, dan packaging rapi untuk hadiah.",
    price: 250000,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDmlZMgq5n4nBWZzDA_TKHbNjMlPeOL5Bxx6D4HoaAvfXDVP7lTOxu3VNNUYRA6oCNE8z1WChv8NyCBkdgiwuQxLd2dYQ4O8PgWnqga73tglKMY5RiGewBR3wvdxwkP2ooKq3Kf4xrZmJsyv_T8lU0GS9V9cwlJaKJ1lfsS5KdcOPgsekvBSInR8CzoyvXRPmGijjse3U7GJ6GGwdBCnKuRvfHObFYeUe-8lifcnP8NDgU6-mMm4NBYfig-vALM2PZZnP4cX_KpHe4",
    badge: "Gift",
    prepTime: "1 hari",
    stock: 7,
    rating: 4.8,
    tags: ["Hampers", "Greeting Card"],
  },
];

export const heroImages = {
  cake:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDIuSdReTvigAnGi6yzVtlkEj2omdThUrOg1i5S-Qhazrm8Oxux7tPSeVTu_bErpea2vfc_KZbv8psvsQpmJEXXnfmxQaTgL8Mt7LEX_ZG_DHuFWcocivrClDIlrx3PjDZJiLtvyznXuB0X4wyDaeVktFLVGUMYpFfDCvVVkxzzmNPOt6YS1hKNxD4ikacHbt2if-oLhcV8n9gIvnHubyLbxPnfKsKQ5A088hybfIMwU39xBkraruJj8JTS6kw5c8-79_aoSODxVV4",
  macarons:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuD4coPZhhnLgPXnYXSKtyQCjT6QxOu6Xb5vmQIW48DfiP0rWAV1nWsVPRrYNkd9Iq31pxEAnAzTsUbSKMWZbrk8tDP-m98qwddYnM9oLQNpfT6SzqAKTGZ8QVSgR5KZCnOYA80ETxGAThl47dHGfLN5-gg4ar_66IOOwSZjCvQmyGglI652fYBiKymX6pghcn1R8oYSzL41SuGFhyHL5ax5PboocipIRsX50vwY4jsC9QiHja6qUYJVm8Kk5BSfRomRdkW-YiGAFR0",
  breads:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCmsz9n222Ndhbrzyw9uTiLzfPx6n7IrmKrIUvSHkIUlFfS-mpNzVPQ9x8ZIpD4JVVFHfcqXEsNRz0HcO2SbS3WkJMFTDOTZ5OtZXqOCtlQonNSBxkucnd-d0ZHreKn5hc64gLCL3ExywIiLnVGcWQetOiTe3pug2R_LqhEb8VcYcquuBQXX52-jjzxBH_sJm8BvXIQsFVFkNaRwY2sbMNLtFLCeIel09RYhJS_66Juv82hRIXd1x7ACLqyk2PQojBj6TvrQvnEs9I",
  cupcake:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDZsJOgWCXmC_h-pgjvaSjdIjqtkQUrWQzb1KaHzgeBIIIm-39uMZvUxU94emx-hlBqoZxGSBTB77Ohu-WyYbebh8h0MeT1e263TNaRh2TMZwRQ2ycDBpQ2CUiceEJpmDQ0p5IYnd-2bPlK7iMDMYX_Jq6DDvY7IFmQv9pOw9MB-3PTomUPQfInViKVwcs-zXRMJ0GXYGI8UZFdsCWux6XYyEaODPzq1pAlQS03sB6eWsTlYFDmbhAZqy7cxVpQXagfDLfQudOmiTQ",
  catering:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAs0jLt3R3RcWlRCjtyD5tBRUwRyFw8EIprcyQrY4pq7F0WrOzeimNNySErvNLYmIAZqLp6Bw19zklMRYU3MzRNG4RVY1JoprGldQW6XkY8LuUydqbgXsMrFzyTNaoV01ukOf79Sv9hc6GPhpzY2jusNpOXhNGdCPqMOqA77sfpNrgZLWlJlg6K2HOWpfym2vZmDJaEcB1_ItTONhDH3n0drPN0HEIlFjxsLh2yqSWjdSqan9eeaVyBtAzokZ_68HOZobLhpi2E4C8",
  chef:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCTKBGYOuToeM54FQh4AvGvxdPAIPH6bGWMYd3R23X2lfU-n7mlGMH_M40x0RHr77d-etRakHRm3dAySvDkXHKM0ilJ_WbQ8xzlHZjKVYMVnaCJ9h-V3Tsq5InPVw-Nm6x-gJ9mMD-AEh_AmQ1vXVmErAhqsyLGaU9pQSzBTNlAQlZ0JgYSsj11LOArukVEjj_QcOYVKKiXY7leLmBdl2K30r5rNXjP16cezD1iO9AUGz1lA3y2f0UP_4kFrcLoOh2pIO945wTvVTM",
  profile:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuALgjjFGTCu_dWChvDF2YcXYWFUVlPgOY6ZRs1ozR0AHvlyYHdxPyrqJpTFhmd1z7JNOc4WfNMzfmaLL42GhnY_mj3nEgVEXiUjylXHyytio0lQQhsWtPcHUT8zQmIUuinPDbgaO7JxVKhM70aFRD9KHGMXRFGPFN4veDxsZQW6Uy9RrIPsd_hE7qId8cZQoMtUcCddaKD1Xkvaz8doOTxSf6gvdRISq7CSAqF4-5U8b0-wcaJyleVdpsRsWZ7ta4AGz3tDIwvGMVI",
};

export const categories: ProductCategory[] = [
  "All",
  "Cakes",
  "Macarons",
  "Gift Boxes",
  "Gluten-Free",
];

export const orderSteps: OrderStatus[] = [
  "Menunggu Pembayaran",
  "Dibayar",
  "Baking",
  "Cooling",
  "Siap Diambil",
  "Selesai",
];

export const initialOrders: Order[] = [
  {
    id: "INV-PUT-202605-041",
    date: "11 Mei 2026",
    status: "Baking",
    items: [
      {
        name: "Vanilla Berry Chantilly Cake",
        quantity: 2,
        price: 260000,
        image: products[2].image,
      },
      {
        name: "Belgian Chocolate Ganache Cake",
        quantity: 1,
        price: 275000,
        image: products[1].image,
      },
    ],
    total: 810000,
    customer: "Putri Amelia",
    address: "Jakarta",
    payment: "Midtrans - GoPay",
  },
  {
    id: "INV-PUT-202604-119",
    date: "27 April 2026",
    status: "Selesai",
    items: [
      {
        name: "Parisian Macaron Cake",
        quantity: 1,
        price: 235000,
        image: products[7].image,
      },
      {
        name: "Sweet Celebration Gift Cake",
        quantity: 1,
        price: 250000,
        image: products[8].image,
      },
    ],
    total: 500000,
    customer: "Putri Amelia",
    address: "Jakarta",
    payment: "Midtrans - Virtual Account",
  },
];

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
