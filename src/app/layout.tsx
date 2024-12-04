import { Navbar } from "@/components/navbar";
import { cn } from "@/lib/utils";
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
          "min-h-screen bg-gradient-to-br from-bg to-orange-100 font-sans text-fg antialiased",
          fontSans.variable,
          fontSerif.variable,
        )}
      >
        <Navbar />

        <main className="mb-52 min-h-full">
          <div className="container mx-auto">{children}</div>
        </main>
      </body>
    </html>
  );
}
