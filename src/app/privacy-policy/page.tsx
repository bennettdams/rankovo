import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rankovo | Privacy Policy",
};

export default function PagePrivacyPolicy() {
  return (
    <div className="container mx-auto w-10/12 space-y-10 pt-24 text-lg lg:w-6/12">
      <div>
        <h1 className="text-3xl font-bold text-primary">Privacy Policy</h1>

        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Data We Collect</h2>
            <p>When you sign in via Google, we collect and store:</p>
            <ul className="ml-4 list-inside list-disc space-y-1">
              <li>Your email address</li>
              <li>
                Your Google profile name (modified with a unique identifier)
              </li>
              <li>Your profile picture (if publicly available)</li>
              <li>Your Google account ID for authentication</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold">Technical Data</h2>
            <p>For security and functionality, we automatically collect:</p>
            <ul className="ml-4 list-inside list-disc space-y-1">
              <li>Session information to keep you logged in</li>
              <li>Browser and device information (user agent)</li>
              <li>Account creation and last update timestamps</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold">User Content</h2>
            <p>
              Any content you create on our platform, including reviews,
              ratings, and other user-generated content.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold">How We Use Your Data</h2>
            <ul className="ml-4 list-inside list-disc space-y-1">
              <li>To provide and maintain our services</li>
              <li>To authenticate and secure your account</li>
              <li>To display your public profile and content</li>
              <li>To improve our platform</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold">Data Sharing</h2>
            <p>
              We do not sell, trade, or share your personal data with third
              parties, except as required by law.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold">Data Security</h2>
            <p>
              We implement appropriate security measures to protect your
              personal information against unauthorized access, alteration,
              disclosure, or destruction.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold">Your Rights</h2>
            <p>
              You have the right to access, update, or delete your personal
              information. Contact us via X to exercise these rights.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold">Updates</h2>
            <p>
              This privacy policy may be updated from time to time. Continued
              use of our services constitutes acceptance of any changes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
