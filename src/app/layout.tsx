import type { Metadata } from "next";
import { Poppins, Inter, Anek_Malayalam } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const anekMalayalam = Anek_Malayalam({
  subsets: ["malayalam", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-anek-malayalam",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CML - Daily Mission Hub",
  description:
    "Cherupushpa Mission League — Your daily journey of faith & service",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${poppins.variable} ${inter.variable} ${anekMalayalam.variable}`}>
      <body className="antialiased bg-[#FAFAFC]" style={{ fontFamily: "var(--font-anek-malayalam), var(--font-inter), sans-serif" }}>{children}</body>
    </html>
  );
}
