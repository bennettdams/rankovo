import { routes } from "@/lib/navigation";
import type { Metadata } from "next";
import { FormUsernameChange } from "./form-username-change";

export const metadata: Metadata = {
  title: "Rankovo | Willkommen",
};

export default async function PageWelcome() {
  return (
    <div className="pt-8 text-center md:pt-12">
      <h1 className="text-5xl">
        Willkommen bei <span className="font-bold text-primary">Rankovo</span>!
      </h1>

      <p className="mt-10 text-2xl">Wähle deinen einzigartigen Nutzernamen:</p>

      <div className="mt-10 flex items-center justify-center">
        <FormUsernameChange redirectTo={routes.home} />
      </div>
    </div>
  );
}
