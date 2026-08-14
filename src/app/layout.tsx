import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import PwaRegistration from "@/components/PwaRegistration";

import MainLayoutWrapper from "@/components/MainLayoutWrapper";

// Fonts are bundled locally so the build works without internet access.
const workSans = localFont({
  src: [
    {
      path: "../../public/fonts/work-sans-latin.woff2",
      weight: "100 900",
      style: "normal",
    },
  ],
  variable: "--font-work-sans",
  display: "swap",
});

const fraunces = localFont({
  src: [
    {
      path: "../../public/fonts/fraunces-latin.woff2",
      weight: "100 900",
      style: "normal",
    },
    {
      path: "../../public/fonts/fraunces-latin-italic.woff2",
      weight: "100 900",
      style: "italic",
    },
  ],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SHAKTHI YOGA — Mindful Movement",
  description: "Thoughtfully sequenced yoga classes for every body and every stage of practice.",
  keywords: "yoga, online yoga classes, meditation, wellness, mindfulness, yoga instructor",
  openGraph: {
    title: "SHAKTHI YOGA — Mindful Movement",
    description: "Thoughtfully sequenced yoga classes for every body and every stage of practice.",
    type: "website",
  },
  applicationName: "Shakthi Yoga",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Shakthi Yoga",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport = {
  themeColor: "#557A5B",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className={`${workSans.variable} ${fraunces.variable} antialiased`} suppressHydrationWarning={true}>
        <PwaRegistration />
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
