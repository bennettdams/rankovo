import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rankovo | Bewertung abgeben",
};

export default function ReviewCreateLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 pt-10 pb-32 md:pt-16">
      {children}
    </div>
  );
}
