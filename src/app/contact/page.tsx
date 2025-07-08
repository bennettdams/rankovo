export default function PageContact() {
  return (
    <div className="container mx-auto w-10/12 space-y-10 pt-24 text-lg lg:w-6/12">
      <div>
        <h1 className="text-3xl font-bold text-primary">Contact</h1>
        <p>I would love to hear your ideas or answer your questions!</p>
        <p className="mt-6">At the moment you can do that in two ways:</p>

        <div className="flex flex-col gap-x-10 lg:flex-row">
          <div>
            <p className="font-bold text-secondary">Mail</p>
            <a
              href="mailto:hirankovo@gmail.com"
              className="mt-2 text-primary underline"
            >
              hirankovo@gmail.com
            </a>
          </div>
          <div>
            <p className="font-bold text-secondary">X</p>
            <a
              href="https://x.com/bennettdams"
              target="_blank"
              rel="noreferrer"
              className="mt-2 text-primary underline"
            >
              https://x.com/bennettdams
            </a>
          </div>
        </div>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-primary">About</h1>
        <p>This website is created and maintained by one person.</p>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-primary">Legal</h1>
        <p>
          You can find our{" "}
          <a href="/privacy-policy" className="text-primary underline">
            Privacy Policy here
          </a>
          .
        </p>
      </div>
    </div>
  );
}
