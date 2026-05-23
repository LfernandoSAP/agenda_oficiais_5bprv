import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Agenda Semanal de Comandantes do 5º BPRv",
  description: "Sistema de agenda semanal dos oficiais do 5º BPRv",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className={`${inter.className} min-h-full`}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
