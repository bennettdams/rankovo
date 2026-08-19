import { ErrorCard } from "@/components/error-card";
import { Button } from "@/components/ui/button";
import { routes } from "@/lib/navigation";
import { House } from "lucide-react";
import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <div className="mt-10">
      <ErrorCard title="Kein Zugriff">
        <p className="text-xl">Du hast keine Berechtigung für diese Seite</p>
        <p>Nur Admins.</p>
        <Link href={routes.home}>
          <Button>
            <House /> Zurück zur Startseite
          </Button>
        </Link>
      </ErrorCard>
    </div>
  );
}
