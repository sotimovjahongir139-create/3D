import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["600", "700", "800"],
});
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Arkon",
  description: "Ishlab chiqarish jarayonini kuzatish tizimi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz">
      <body
        className={`${jakarta.variable} ${inter.variable} font-sans antialiased bg-bg text-ink`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
