import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Porsa - EGX Portfolio Tracker",
  description:
    "Track your Egyptian stock market portfolio with real-time prices and profit/loss calculations",
  keywords: [
    "EGX",
    "Egyptian Stock Market",
    "Portfolio Tracker",
    "Stock Tracker",
  ],
  authors: [{ name: "Porsa Team" }],
  robots: "index, follow",
  openGraph: {
    title: "Porsa - EGX Portfolio Tracker",
    description:
      "Track your Egyptian stock market portfolio with real-time prices",
    type: "website",
    locale: "en_US",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
