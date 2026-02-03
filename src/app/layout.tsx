import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CurrencyProvider } from "@/context/CurrencyContext"; 
import TanstackProvider from "@/providers/TanstackProvider"; // 👈 1. Import New Provider

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FinBank OS",
  description: "The AI-Powered Financial Operating System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* 👈 2. Wrap Tanstack on the OUTSIDE */}
        <TanstackProvider>
          {/* 👈 3. Keep CurrencyProvider on the INSIDE */}
          <CurrencyProvider>
            {children}
          </CurrencyProvider>
        </TanstackProvider>
      </body>
    </html>
  );
}