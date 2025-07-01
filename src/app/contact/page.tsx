export default function PageContact() {
  return (
    <div className="mx-auto space-y-10 px-10 pt-24 text-lg md:px-96">
      <div>
        <h1 className="text-3xl font-bold text-primary">Contact</h1>
        <p>I would love to hear your ideas or answer your questions!</p>
        <p className="mt-6">At the moment you can do that via X:</p>
        <a
          href="https://x.com/bennettdams"
          target="_blank"
          rel="noreferrer"
          className="mt-2 text-primary underline"
        >
          Bennett Dams
        </a>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-primary">About</h1>
        <p>This website is created and maintained by one person.</p>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-primary">Privacy policy</h1>
        <p>
          We don&apos;t store any personal data besides the one used for
          authentication.
        </p>
        <p>
          When you sign in via Google, this includes the mail address, open ID
          and public profile.
        </p>
      </div>
    </div>
  );
}
