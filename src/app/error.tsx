"use client"; // Error boundaries must be Client Components

import { ErrorCard } from "@/components/error-card";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorCard title="Something went wrong">
      <div>
        <Button onClick={() => reset()}>Try again</Button>
      </div>
    </ErrorCard>
  );
}
