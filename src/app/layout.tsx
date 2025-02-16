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
          "min-h-screen bg-gradient-to-br from-bg to-orange-200 font-sans text-fg antialiased caret-primary accent-primary selection:bg-primary selection:text-white",
          fontSans.variable,
          fontSerif.variable,
        )}
      >
        <Analytics />
        <Navbar />

        <main className="mb-52 min-h-full pb-40">
          <div className="container mx-auto">{children}</div>
        </main>

        <footer className="py-8 text-center">
          <p className="text-gray-500 text-sm">
            <span>© 2025 Rankovo | Built by </span>

            <a
              href="https://x.com/bennettdams"
              target="_blank"
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
