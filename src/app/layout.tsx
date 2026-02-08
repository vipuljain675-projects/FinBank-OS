import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CurrencyProvider } from "@/context/CurrencyContext"; 
import TanstackProvider from "@/providers/TanstackProvider"; 

const inter = Inter({ subsets: ["latin"] });

// 👇 UPDATED METADATA
export const metadata: Metadata = {
  title: "FinBank OS | AI Financial Advisor",
  description: "The AI-Powered Financial Operating System with Real-Time Market Data and Portfolio Intelligence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <TanstackProvider>
          <CurrencyProvider>
            {children}
          </CurrencyProvider>
        </TanstackProvider>
      </body>
    </html>
  );
}