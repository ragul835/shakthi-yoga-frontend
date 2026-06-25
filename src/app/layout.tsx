import type { Metadata } from "next";
import { Work_Sans, Fraunces } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";

import MainLayoutWrapper from "@/components/MainLayoutWrapper";

const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SHAKTHI YOGA — Mindful Movement",
  description: "Thoughtfully sequenced yoga classes for every body and every stage of practice.",
  keywords: "yoga, online yoga classes, meditation, wellness, mindfulness, yoga instructor",
  openGraph: {
    title: "ZenYoga — Transform Your Life Through Yoga",
    description: "Premium online yoga classes with expert instructors.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className={`${workSans.variable} ${fraunces.variable} antialiased`} suppressHydrationWarning={true}>
        <AuthProvider>
          <Navbar />
          <MainLayoutWrapper>
            {children}
          </MainLayoutWrapper>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
