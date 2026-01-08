import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // <--- THIS IMPORT IS CRITICAL FOR STYLES TO WORK

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MatriBandhob - Maternal Health AI",
  description: "Accessible, Safe, and AI-Assisted Maternal Healthcare",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>{children}</body>
    </html>
  );
}