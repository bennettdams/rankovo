import { FormUsernameChange } from "@/app/welcome/form-username-change";
import { Box } from "@/components/box";
import { DateTime } from "@/components/date-time";
import { NumberFormatted } from "@/components/number-formatted";
import { ReviewsList } from "@/components/reviews-list";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { queries, type UserForId } from "@/data/queries";
import {
  getAuthSession,
  getUserAuth,
  type AuthSession,
} from "@/lib/auth-server";
import { routes } from "@/lib/navigation";
import { getUserReviewStats, type UserReviewStats } from "@/lib/user-profile";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Rankovo | Profil",
};

export default async function PageUser({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  return (
    <div className="px-4 pt-20 sm:px-6 md:px-0">
      <Suspense
        fallback={
          <UserPageHeader user={null} stats={null} isOwnProfile={null} />
        }
      >
        <PageUserInternal params={params} />
      </Suspense>
    </div>
  );
}

async function PageUserInternal({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId: userIdRaw } = await params;
  const userId = decodeURIComponent(userIdRaw);

  const [user, reviews, userAuth, initialSession] = await Promise.all([
    queries.userForId(userId),
    queries.reviews(null, userId),
    getUserAuth(),
    getAuthSession(),
  ]);

  const isOwnProfile = userAuth?.id === userId;
  const stats = getUserReviewStats(reviews);

  return (
    <>
      <UserPageHeader
        user={user}
        stats={stats}
        isOwnProfile={isOwnProfile}
        initialSession={initialSession}
      />

      <section data-testid="user-reviews-section" className="mt-12">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="mt-1 text-3xl tracking-tight text-secondary md:text-4xl">
              Alle Bewertungen
            </h2>
          </div>
          <p className="text-sm text-dark-gray">
            {reviews.length}{" "}
            {reviews.length === 1
              ? "Bewertung insgesamt"
              : "Bewertungen insgesamt"}
          </p>
        </div>
        <div className="mt-4">
          <ReviewsList reviews={reviews} isOwnProfile={isOwnProfile} />
        </div>
      </section>
    </>
  );
}

function UserPageHeader({
  user,
  stats,
  isOwnProfile,
  initialSession,
}: {
  user: UserForId | null;
  stats: UserReviewStats | null;
  isOwnProfile: boolean | null;
  initialSession?: AuthSession | null;
}) {
  return (
    <Box
      variant="xl"
      className="mx-auto max-w-5xl"
      data-testid="user-profile-panel"
    >
      <div className="flex flex-col justify-between gap-6 border-b border-gray/70 pb-6 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="truncate text-3xl font-bold tracking-tight text-primary md:text-4xl">
              {user?.name ?? "-"}
            </h1>
            {isOwnProfile && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-auto rounded-full border-primary/30 px-3 py-1.5 text-sm font-medium text-secondary hover:bg-primary/10 hover:text-secondary"
                  >
                    Namen ändern
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  className="w-96 max-w-[calc(100vw-2rem)] rounded-2xl bg-bg p-4 shadow-xl ring-1 ring-gray/70"
                >
                  <h2 className="mb-1 text-base font-semibold text-secondary">
                    Nutzernamen ändern
                  </h2>
                  <p className="mb-4 text-sm text-dark-gray">
                    Dein neuer Name wird sofort auf deinem Profil angezeigt.
                  </p>
                  <FormUsernameChange
                    initialSession={initialSession}
                    redirectTo={routes.user(user?.id ?? "")}
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>
          <p className="mt-2 text-sm text-dark-gray">
            {user === null ? (
              "-"
            ) : (
              <>
                Mitglied seit{" "}
                <DateTime date={user.createdAt} format="YYYY-MM-DD" />
              </>
            )}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <ProfileMetric label="Bewertungen" value={stats?.count ?? null} />
        <ProfileMetric
          label="Durchschnitt"
          value={
            stats?.averageRating === null || stats === null ? null : (
              <NumberFormatted num={stats.averageRating} min={1} max={1} />
            )
          }
        />
        <ProfileMetric
          label="Bewertungsbereich"
          value={
            stats?.ratingLowest === null ||
            stats?.ratingHighest === null ||
            stats === null ? null : (
              <>
                <NumberFormatted num={stats.ratingLowest} min={1} max={1} />–
                <NumberFormatted num={stats.ratingHighest} min={1} max={1} />
              </>
            )
          }
        />
        <ProfileMetric
          label="Kategorien"
          value={stats?.categoryCount ?? null}
        />
        <ProfileMetric label="Orte" value={stats?.placeCount ?? null} />
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-sm text-dark-gray">
        <span>
          Zuletzt aktualisiert:{" "}
          {user === null ? (
            "-"
          ) : (
            <DateTime date={user.updatedAt} format="YYYY-MM-DD" />
          )}
        </span>
        {stats?.latestReviewedAt && (
          <span>
            Letzte Bewertung:{" "}
            <DateTime date={stats.latestReviewedAt} format="YYYY-MM-DD" />
          </span>
        )}
      </div>
    </Box>
  );
}

function ProfileMetric({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="min-w-0 border-gray/70 sm:border-r sm:pr-4 last:sm:border-r-0">
      <Label>{label}</Label>
      <p className="mt-1 truncate text-2xl font-semibold text-secondary">
        {value ?? "-"}
      </p>
    </div>
  );
}
