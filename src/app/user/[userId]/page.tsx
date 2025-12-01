import { FormUsernameChange } from "@/app/welcome/form-username-change";
import { Box } from "@/components/box";
import { DateTime } from "@/components/date-time";
import { ReviewsList } from "@/components/reviews-list";
import { Label } from "@/components/ui/label";
import { queries, type UserForId } from "@/data/queries";
import { getUserAuth } from "@/lib/auth-server";
import { routes } from "@/lib/navigation";
import type { Metadata } from "next";
import { headers } from "next/headers";
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
    <div className="pt-20">
      <Suspense
        fallback={
          <UserPageHeader user={null} numOfReviews={null} isOwnProfile={null} />
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

  const [user, reviews, userAuth] = await Promise.all([
    queries.userForId(userId),
    queries.reviews(1, userId),
    getUserAuth(await headers()),
  ]);

  const isOwnProfile = userAuth?.id === userId;

  return (
    <>
      <UserPageHeader
        user={user}
        numOfReviews={reviews.length}
        isOwnProfile={isOwnProfile}
      />

      <h1 className="mt-10 text-xl">Alle Bewertungen</h1>
      <div>
        <ReviewsList reviews={reviews} />
      </div>
    </>
  );
}

function UserPageHeader({
  user,
  numOfReviews,
  isOwnProfile,
}: {
  user: UserForId | null;
  numOfReviews: number | null;
  isOwnProfile: boolean | null;
}) {
  return (
    <Box
      variant="lg"
      className="mx-auto flex max-w-3xl flex-col justify-between"
    >
      <div>
        <h1 className="text-2xl font-bold text-primary">{user?.name ?? "-"}</h1>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div>
          <Label>Anzahl der Bewertungen</Label>
          <p className="text-xl">
            {numOfReviews === null ? "-" : numOfReviews}
          </p>
        </div>
        <div>
          <Label>Account erstellt am</Label>
          <p className="text-xl">
            {user === null ? (
              "-"
            ) : (
              <DateTime date={user.createdAt} format="YYYY-MM-DD" />
            )}
          </p>
        </div>
        <div>
          <Label>Zuletzt aktualisiert am</Label>
          <p className="text-xl">
            {user === null ? (
              "-"
            ) : (
              <DateTime date={user.updatedAt} format="YYYY-MM-DD" />
            )}
          </p>
        </div>
      </div>

      {isOwnProfile === null || user === null
        ? null
        : isOwnProfile && (
            <div className="mt-6 border-t pt-6">
              <h2 className="mb-4 text-xl font-semibold">Nutzernamen ändern</h2>
              <FormUsernameChange redirectTo={routes.user(user.id)} />
            </div>
          )}
    </Box>
  );
}
