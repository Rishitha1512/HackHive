import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HackHive | Find Your People. Build a Buzz.",
  description:
    "Discover approved hackathons, find teammates and build something amazing with HackHive.",
  icons: {
    icon: [
      { url: "/favicon-512-v3.png", type: "image/png", sizes: "512x512" },
      { url: "/favicon.ico?v=3", sizes: "16x16 32x32 48x48 64x64 128x128 256x256 512x512" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}