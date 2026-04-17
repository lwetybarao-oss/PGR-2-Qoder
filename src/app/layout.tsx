import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "PGR - Sistema de Gestão de Arguidos",
  description: "Sistema de Gestão de Arguidos em Prisão Preventiva - Procuradoria-Geral da República",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased bg-gray-50 text-gray-900">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
