import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

import "./globals.css";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://leafwise-scan.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "Leafwise — crop disease detection that works offline",
    template: "%s · Leafwise",
  },
  description:
    "Point a phone at a leaf and get a diagnosis in under a second, with no network. A 9 MB MobileNetV2 runs entirely in the browser over 38 disease classes across 14 crops, with field guidance and measured cross-dataset accuracy.",
  keywords: [
    "crop disease detection",
    "plant disease classifier",
    "offline AI",
    "edge AI",
    "on-device inference",
    "ONNX Runtime Web",
    "PWA",
    "PlantVillage",
    "PlantDoc",
    "agriculture",
  ],
  authors: [{ name: "Shahriar Ahmed Seam" }],
  creator: "Somokolon Labs",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Leafwise", statusBarStyle: "default" },
  openGraph: {
    type: "website",
    url: SITE,
    siteName: "Leafwise",
    title: "Leafwise — crop disease detection that works offline",
    description:
      "On-device leaf diagnosis: 38 classes, 14 crops, ~9 MB model, no server, no upload. Includes honest cross-dataset accuracy numbers.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Leafwise — crop disease detection that works offline",
    description: "38 classes, 14 crops, ~9 MB model, entirely on-device. Cross-dataset accuracy published.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#f5f3ec",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body className="min-h-dvh bg-bone-50 font-sans antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-leaf-600 focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to content
        </a>
        {children}
        <script
          // Registering here keeps the service worker out of the React tree; it only ever
          // caches the app shell and the model file.
          dangerouslySetInnerHTML={{
            __html: `if ('serviceWorker' in navigator) { window.addEventListener('load', function () { navigator.serviceWorker.register('/sw.js').catch(function(){}); }); }`,
          }}
        />
      </body>
    </html>
  );
}
