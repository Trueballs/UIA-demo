import type { Metadata } from "next";
// Removed unused Geist_Mono import
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";

import { Geist, Lexend, Crimson_Text } from "next/font/google";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin"],
});

const crimsonText = Crimson_Text({
  variable: "--font-crimson-text",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Myunibanner — Create your custom LinkedIn banner",
  description: "Create a professional LinkedIn background banner for your university in seconds. Free, one-click download.",
  openGraph: {
    title: "Myunibanner — Create your custom LinkedIn banner",
    description: "Personalized LinkedIn banners for students and alumni.",
    type: "website",
    url: "https://myunibanner.vercel.app",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script 
          async 
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2231701309996004"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={`${geist.variable} ${lexend.variable} ${crimsonText.variable} font-lexend antialiased`}
      >
        <LanguageProvider>
          {children}
        </LanguageProvider>
        <Analytics />
      </body>
    </html>
  );
}
