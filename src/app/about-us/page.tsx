import { Box } from "@/components/box";
import { FileText, Mail, MessageCircle, User } from "lucide-react";

export default function PageAboutUs() {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto max-w-4xl px-6 pb-20 pt-16">
        {/* Hero Section */}
        <div className="mb-16 text-center">
          <h1 className="mb-4 text-5xl font-bold text-primary">Get In Touch</h1>
          <p className="mx-auto max-w-2xl text-xl leading-relaxed">
            I would love to hear your ideas or answer your questions!
          </p>
        </div>

        {/* Contact Methods Section */}
        <div className="mb-20">
          <h2 className="mb-8 text-center text-2xl font-semibold text-fg">
            Choose Your Preferred Way to Connect
          </h2>

          <div className="mx-auto grid max-w-2xl gap-6 md:grid-cols-2">
            {/* Email Card */}
            <Box className="group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <div className="relative z-10">
                <div className="mb-4">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-white">
                    <Mail className="h-6 w-6" />
                  </div>
                </div>

                <h3 className="mb-2 text-lg font-semibold text-secondary">
                  Email
                </h3>
                <p className="mb-4 text-sm">
                  Send me a direct message for detailed discussions
                </p>

                <a
                  href="mailto:hirankovo@gmail.com"
                  className="inline-flex items-center font-medium text-primary transition-colors"
                >
                  hirankovo@gmail.com
                  <svg
                    className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </a>
              </div>
            </Box>

            {/* X/Twitter Card */}
            <Box className="hover:shadow-secondary/10 group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-secondary to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <div className="relative z-10">
                <div className="mb-4">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl text-secondary transition-all duration-300 group-hover:bg-secondary group-hover:text-white">
                    <MessageCircle className="h-6 w-6" />
                  </div>
                </div>

                <h3 className="mb-2 text-lg font-semibold text-secondary">
                  X (Twitter)
                </h3>
                <p className="text-fg/70 mb-4 text-sm">
                  Follow me for updates and quick conversations
                </p>

                <a
                  href="https://x.com/bennettdams"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center font-medium text-secondary transition-colors"
                >
                  @bennettdams
                  <svg
                    className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              </div>
            </Box>
          </div>
        </div>

        {/* Additional Info Section */}
        <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-2">
          {/* About Card */}
          <Box>
            <div className="mb-4">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl text-tertiary">
                <User className="h-6 w-6" />
              </div>
            </div>

            <h3 className="mb-3 text-xl font-semibold text-primary">About</h3>
            <p className="leading-relaxed">
              This website is created and maintained by one person who just
              likes to build things.
            </p>
          </Box>

          {/* Legal Card */}
          <Box>
            <div className="mb-4">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl text-dark-gray">
                <FileText className="h-6 w-6" />
              </div>
            </div>

            <h3 className="mb-3 text-xl font-semibold text-primary">Legal</h3>
            <p className="text-fg/80 leading-relaxed">
              Your privacy matters. Read our{" "}
              <a
                href="/privacy-policy"
                className="decoration-primary/30 font-medium text-primary underline transition-colors hover:decoration-primary"
              >
                Privacy Policy
              </a>{" "}
              to learn how we protect your data.
            </p>
          </Box>
        </div>
      </div>
    </div>
  );
}
