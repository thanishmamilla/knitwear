import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ThreadFlow | Tiruppur Knitwear Production & Early Delay Engine",
  description:
    "Early delay detection for Tiruppur knitwear exporters using real floor updates and run-rate intelligence.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-slate-50">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col`}
      >
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>
              <span className="font-semibold text-slate-700">ThreadFlow SaaS</span> &bull; Company A Tiruppur Knitwear
              Operations &bull; 900 Floor Workers, 35 Merchandising Staff
            </div>
            <div className="flex items-center space-x-3 text-slate-400">
              <span>Run-Rate Delay Engine</span>
              <span>&bull;</span>
              <span>Tamil AI Floor Notes</span>
              <span>&bull;</span>
              <span>Zero-Leak Buyer Portal</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
