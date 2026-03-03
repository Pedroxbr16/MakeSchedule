import type { Metadata } from "next";
import { Space_Grotesk, Fraunces } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const headingFont = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"]
});

const bodyFont = Fraunces({
  variable: "--font-body",
  subsets: ["latin"]
});

export const metadata: Metadata = {
  title: "Gerador de Escala",
  description: "Monte escalas e acompanhe o preview em tempo real."
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${headingFont.variable} ${bodyFont.variable}`}>{children}</body>
    </html>
  );
}
