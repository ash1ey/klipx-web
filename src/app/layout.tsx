import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/providers/auth-provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Klipx - AI Video Generator",
    template: "%s | Klipx",
  },
  description: "Create stunning AI-generated videos, images, and music in seconds. Powered by Sora 2, Veo 3, and more.",
  keywords: ["AI video generator", "text to video", "image to video", "AI music", "Sora 2", "Veo 3"],
  authors: [{ name: "Klipx" }],
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://klipx.ai",
    siteName: "Klipx",
    title: "Klipx - AI Video Generator",
    description: "Create stunning AI-generated videos, images, and music in seconds.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Klipx - AI Video Generator",
    description: "Create stunning AI-generated videos, images, and music in seconds.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground`}>
        <AuthProvider>
          {children}
          <Toaster position="top-center" richColors />
        </AuthProvider>
      </body>
    </html>
  );
}
