import { IconRankovo } from "@/components/icons";
import { Rankings } from "@/components/rankings";
import { Star } from "lucide-react";

export default function Home() {
  return (
    <div className="pt-8 md:pt-12">
      <HeroSection />

      <div className="flex min-h-full flex-col md:flex-row">
        <div className="w-full md:w-1/2">Map</div>

        <div className="w-full md:w-1/2">
          <Rankings />
        </div>
      </div>
    </div>
  );
}

function HeroSection() {
  return (
    <section className="w-full pb-12 md:pb-24">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center space-y-4 text-center">
          <IconRankovo className="h-12 w-12" />

          <h1 className="text-4xl font-extrabold tracking-tight text-fg md:text-5xl lg:text-6xl">
            <span className="block text-primary">Rankovo</span>
          </h1>

          <p className="mx-auto line-clamp-2 max-w-[600px] text-xl text-fg md:text-2xl">
            <span className="block md:inline">No surprises.</span>
            <span className="block md:ml-2 md:inline">Just the best.</span>
          </p>

          <div className="flex justify-center space-x-2">
            <Star className="h-6 w-6 fill-current text-primary" />
            <Star className="h-6 w-6 fill-current text-primary" />
            <Star className="h-6 w-6 fill-current text-primary" />
            <Star className="h-6 w-6 fill-current text-primary" />
            <Star className="h-6 w-6 fill-current text-primary" />
          </div>
        </div>
      </div>
    </section>
  );
}
