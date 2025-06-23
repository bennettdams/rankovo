import { FormUsernameChange } from "./form-username-change";

export default async function PageWelcome() {
  return (
    <div className="pt-8 text-center md:pt-12">
      <h1 className="text-5xl">
        Welcome to <span className="font-bold text-primary">Rankovo</span>!
      </h1>

      <p className="mt-10 text-2xl">Select your unique username:</p>

      <div className="mt-10 flex items-center justify-center">
        <FormUsernameChange />
      </div>
    </div>
  );
}
