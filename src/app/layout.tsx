import { Navbar } from "@/components/navbar";
import { cn } from "@/lib/utils";
import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Domine } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rankovo",
  description: "Best finder for the best products",
};

const fontSans = localFont({
  variable: "--font-sans",
  src: "./fonts/GeistVF.woff",
});
const fontSerif = Domine({ variable: "--font-serif", subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={cn(
          "flex min-h-screen flex-col bg-gradient-to-r from-bg to-orange-200 font-sans text-fg antialiased caret-primary accent-primary selection:bg-primary selection:text-white",
          fontSans.variable,
          fontSerif.variable,
        )}
      >
        <Analytics />
        <Navbar />

        <main className="flex flex-1 flex-col">
          <div className="container mx-auto flex flex-1 flex-col">
            <div className="pb-20">{children}</div>
          </div>
        </main>

        <footer className="py-8 text-center">
          <p className="text-sm">
            <span>© 2025 Rankovo &mdash; Entwickelt von </span>

            <a
              href="https://x.com/bennettdams"
              target="_blank"
              rel="noreferrer"
              className="text-primary underline"
            >
              Bennett Dams
            </a>
          </p>
        </footer>
      </body>
    </html>
  );
}
