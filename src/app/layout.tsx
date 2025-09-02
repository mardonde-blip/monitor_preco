import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lucre Na Promo - Compare Preços e Encontre as Melhores Ofertas",
  description: "Sistema de comparação de preços em tempo real. Encontre as melhores ofertas em Amazon, Mercado Livre, Americanas, Carrefour e Casas Bahia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
