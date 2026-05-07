import type { Metadata } from "next";
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import "./globals.css";
import { RootProvider } from "./providers";

export const metadata: Metadata = {
  title: "PostForge",
  description: "Production-grade personal video scheduling tool",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans antialiased">
        <RootProvider>
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
