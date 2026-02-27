import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Autoloke – Marketplace",
  description: "Autoloke – Lengvai rask transportą ir dalis aplink save.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="lt">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-[#07070a] text-white`}
      >
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_0%,rgba(255,255,255,0.10),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(60%_40%_at_10%_30%,rgba(59,130,246,0.15),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(60%_40%_at_90%_20%,rgba(236,72,153,0.10),transparent_55%)]" />
        </div>
        {children}
      </body>
    </html>
  );
}
