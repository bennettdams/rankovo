import { isDevLoginEnabled } from "@/lib/dev-login";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DevLoginForm } from "./dev-login.client";

export const metadata: Metadata = {
  title: "Rankovo | Dev login",
  robots: { index: false, follow: false },
};

export default function PageDevLogin() {
  return (
    <Suspense fallback={null}>
      <DevLoginContent />
    </Suspense>
  );
}

async function DevLoginContent() {
  if (!isDevLoginEnabled()) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl pt-16">
      <h1 className="mb-4 text-center text-4xl font-bold text-primary">
        Development sign-in
      </h1>
      <p className="mb-10 text-center text-lg">
        Dev accounts from <code>bun run db:seed</code>. Not available in
        production.
      </p>
      <DevLoginForm />
    </div>
  );
}
