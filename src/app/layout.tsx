import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Domine } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const fontSans = localFont({
  variable: "--font-sans",
  src: "./fonts/GeistVF.woff",
});
const fontSerif = Domine({ variable: "--font-serif", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Rankovo",
  description: "Best finder for the best products",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={cn(
          "antialiased font-sans",
          fontSans.variable,
          fontSerif.variable,
        )}
      >
        {children}
      </body>
    </html>
  );
}
