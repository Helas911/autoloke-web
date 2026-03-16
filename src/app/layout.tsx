import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { BottomNav } from "@/components/BottomNav";
import { HtmlLang } from "@/components/HtmlLang";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://autoloke.lt"),
  title: "Autoloke",
  description: "Autoloke – lengvai rask transportą ir dalis aplink save. Autoloke DK – find nemt køretøjer og reservedele i nærheden.",
  applicationName: "Autoloke",
  alternates: {
    canonical: "/",
    languages: {
      "lt-LT": "https://autoloke.lt",
      "da-DK": "https://autoloke.dk",
      "x-default": "https://autoloke.lt",
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    title: "Autoloke",
    description: "Transporto ir dalių marketplace Lietuvai ir Danijai.",
    url: "https://autoloke.lt",
    siteName: "Autoloke",
    type: "website",
    locale: "lt_LT",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="lt" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-[#0b0b0d] text-white`}>
        <HtmlLang />
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(255,255,255,0.05),transparent_70%)]" />
        </div>

        <SiteHeader />
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
