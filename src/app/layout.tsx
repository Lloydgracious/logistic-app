import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { StoreHydrator } from "@/components/StoreHydrator";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "KT Logistic & Trading - Logistics & Inventory",
  description: "Export, import, transportation, order tracking, and inventory management system.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${outfit.variable} min-h-screen bg-background text-foreground overflow-hidden font-sans`}>
        <main className="flex-1 flex flex-col h-screen overflow-hidden relative z-10 bg-background">
          <StoreHydrator />
          <Navbar />
          <Sidebar />
          <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 lg:pl-32 pt-24 mt-16 custom-scrollbar">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
