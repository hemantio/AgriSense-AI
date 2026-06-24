import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "AgriSense AI — Intelligent Farm Management",
  description:
    "AI-powered agricultural management platform for small-scale farmers. Crop health analysis, weather intelligence, smart recommendations, and comprehensive farm management tools.",
  keywords: [
    "agriculture",
    "farming",
    "AI",
    "crop health",
    "weather",
    "farm management",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster theme="dark" position="bottom-right" richColors closeButton />
      </body>
    </html>
  );
}

