import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GarageFlow - Logistics & Inventory",
  description: "Smart garage logistics, vehicle tracking, and inventory management system.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-[#0a0a0a] text-white overflow-hidden`}>
        <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
          <Navbar />
          <div className="flex-1 overflow-y-auto p-4 md:p-10 pt-40 custom-scrollbar">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
