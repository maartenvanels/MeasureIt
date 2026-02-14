import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";
import "katex/dist/katex.min.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#e11d48",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "MeasureIt — Measure anything from a photo",
  description:
    "Set a known reference dimension on any image, then measure distances, angles, and areas. Free, open-source, runs entirely in your browser.",
  keywords: [
    "measure photo",
    "image measurement tool",
    "measure distance from image",
    "reference measurement",
    "pixel ruler",
    "angle measurement",
    "area measurement",
    "photo dimensions",
    "scale from image",
    "free measurement tool",
  ],
  authors: [{ name: "MeasureIt" }],
  creator: "MeasureIt",
  metadataBase: new URL("https://measure-it-omega.vercel.app"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://measure-it-omega.vercel.app",
    siteName: "MeasureIt",
    title: "MeasureIt — Measure anything from a photo",
    description:
      "Know one dimension? MeasureIt calculates the rest. Set a reference measurement on any image, then draw lines to get real-world distances, angles, and areas instantly.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MeasureIt — Measure anything from a photo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MeasureIt — Measure anything from a photo",
    description:
      "Know one dimension? MeasureIt calculates the rest. Free, open-source image measurement tool.",
    images: ["/og-image.png"],
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MeasureIt",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TooltipProvider delayDuration={300}>
          {children}
        </TooltipProvider>
        <Toaster position="bottom-right" />
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
