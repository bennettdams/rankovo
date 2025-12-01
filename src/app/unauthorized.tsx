import { ErrorCard } from "@/components/error-card";

export default function UnauthorizedPage() {
  return (
    <ErrorCard title="Nicht autorisiert">
      <p className="text-xl">Logge dich zuerst ein</p>
    </ErrorCard>
  );
}
