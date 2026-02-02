import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// 👇 IMPORT THIS
import { CurrencyProvider } from "@/context/CurrencyContext"; 

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
        {/* 👇 WRAP EVERYTHING HERE */}
        <CurrencyProvider>
          {children}
        </CurrencyProvider>
      </body>
    </html>
  );
}