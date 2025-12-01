import { ErrorCard } from "@/components/error-card";
import { Button } from "@/components/ui/button";
import { routes } from "@/lib/navigation";
import { House } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mt-10">
      <ErrorCard title="Nutzer nicht gefunden" variant="notFound">
        <Link href={routes.home}>
          <Button>
            <House /> Zurück zur Startseite
          </Button>
        </Link>
      </ErrorCard>
    </div>
  );
}
