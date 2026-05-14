import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Putisserie",
  description:
    "Prototype frontend Putisserie untuk katalog, keranjang, checkout, pembayaran, dan dashboard pembeli.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
