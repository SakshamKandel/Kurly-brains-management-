import type { Metadata } from "next";
import { Toaster } from "sonner";
import { SWRProvider } from "@/lib/swr-config";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Kurly Brains - Agency Management Dashboard",
    template: "%s | Kurly Brains",
  },
  description: "Internal staff management platform for Kurly Brains Agency. Manage invoices, clients, and team collaboration efficiently.",
  keywords: ["Kurly Brains", "Dashboard", "Agency Management", "Staff Portal", "Invoicing"],
  authors: [{ name: "Kurly Brains Team" }],
  creator: "Kurly Brains",
  metadataBase: new URL(process.env.NEXTAUTH_URL || "https://kurlybrains.com"),
  openGraph: {
    title: "Kurly Brains - Agency Management Dashboard",
    description: "Internal staff management platform for Kurly Brains Agency.",
    url: process.env.NEXTAUTH_URL || "https://kurlybrains.com",
    siteName: "Kurly Brains",
    images: [
      {
        url: "/og-image.png", // We should ensure this image exists or default to logo
        width: 1200,
        height: 630,
        alt: "Kurly Brains Dashboard",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kurly Brains - Agency Management Dashboard",
    description: "Internal staff management platform for Kurly Brains Agency.",
    images: ["/og-image.png"],
    creator: "@kurlybrains",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  robots: {
    index: true,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body suppressHydrationWarning className="font-sans">
        <SWRProvider>
          {children}
          <Toaster richColors position="top-center" />
        </SWRProvider>
      </body>
    </html>
  );
}
