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
    <ErrorCard title="Etwas ist schief gelaufen">
      <div>
        <Button onClick={() => reset()}>Erneut versuchen</Button>
      </div>
    </ErrorCard>
  );
}
