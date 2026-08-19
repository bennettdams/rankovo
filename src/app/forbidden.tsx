import { ErrorCard } from "@/components/error-card";

export default function ForbiddenPage() {
  return (
    <ErrorCard title="Kein Zugriff">
      <p className="text-xl">Du hast keine Berechtigung für diese Seite</p>
    </ErrorCard>
  );
}
