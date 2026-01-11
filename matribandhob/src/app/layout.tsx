import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { LanguageProvider } from "@/context/LanguageContext";


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MatriBandhob - Maternal Health AI",
  description: "Accessible, Safe, and AI-Assisted Maternal Healthcare",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <LanguageProvider>
          <ThemeProvider>
            {/* Wrap everything with PresenceWrapper to track online status globally */}
          
              {children}
            
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}