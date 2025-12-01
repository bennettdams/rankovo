"use client";

import { cn } from "@/lib/utils";
import { type ReactNode, useEffect, useState } from "react";

const products = [
  { name: "Cheeseburger", prefix: "den besten" },
  { name: "Döner", prefix: "den besten" },
  { name: "Salami Pizza", prefix: "die beste" },
  { name: "Fried Chicken", prefix: "das beste" },
  { name: "Chickenburger", prefix: "den besten" },
  { name: "Pizza Tonno", prefix: "die beste" },
];
const cities = [
  "Hamburg",
  "Berlin",
  "München",
  "Köln",
  "Frankfurt",
  "Düsseldorf",
];

export function HeaderQuestion() {
  const [productIdx, setProductIdx] = useState(0);
  const [cityIdx, setCityIdx] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setProductIdx((i) => (i + 1) % products.length);
        setCityIdx((i) => (i + 1) % cities.length);
        setIsAnimating(false);
      }, 400); // animation duration
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center gap-y-2 text-2xl">
      <div>
        Finde <span>{products[productIdx]?.prefix}</span>
      </div>
      <div className="text-center text-3xl">
        <SentenceTopic isAnimating={isAnimating}>
          {products[productIdx]?.name}
        </SentenceTopic>
      </div>
      <div>in der Nähe von</div>
      <div className="text-center text-3xl">
        <SentenceTopic isAnimating={isAnimating}>
          {cities[cityIdx]}
        </SentenceTopic>
      </div>
    </div>
  );
}

function SentenceTopic({
  isAnimating,
  children,
}: {
  isAnimating: boolean;
  children: ReactNode;
}) {
  return (
    <span>
      <span
        className={cn(
          "inline-block text-nowrap rounded bg-gradient-to-r from-primary to-secondary bg-clip-text px-2 font-extrabold text-transparent drop-shadow-lg transition-all ease-in-out",
          isAnimating
            ? "-translate-y-2 opacity-0"
            : "translate-y-0 opacity-100",
        )}
      >
        {children}
      </span>
    </span>
  );
}
