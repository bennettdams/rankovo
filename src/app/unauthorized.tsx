import { ErrorCard } from "@/components/error-card";

export default function UnauthorizedPage() {
  return (
    <ErrorCard title="Unauthorized">
      <p className="text-xl">Please sign in first</p>
    </ErrorCard>
  );
}
