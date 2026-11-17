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
  title: "SIGI • Coldwell Banker México | Inteligencia Inmobiliaria",
  description:
    "Sistema Integral de Gestión Inmobiliaria (SIGI) Coldwell Banker México — Cartera Patrimonial, PropTech AI y Red Nacional MLS.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#F3F6FA] text-slate-900">
        {children}
      </body>
    </html>
  );
}
