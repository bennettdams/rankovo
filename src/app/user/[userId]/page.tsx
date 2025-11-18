import { FormUsernameChange } from "@/app/welcome/form-username-change";
import { Box } from "@/components/box";
import { DateTime } from "@/components/date-time";
import { ReviewsList } from "@/components/reviews-list";
import { Label } from "@/components/ui/label";
import { queries } from "@/data/queries";
import { getUserAuth } from "@/lib/auth-server";
import { routes } from "@/lib/navigation";
import { headers } from "next/headers";

export default async function PageUser({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  const [user, reviews, userAuth] = await Promise.all([
    queries.userForId(userId),
    queries.reviews(1, userId),
    getUserAuth(await headers()),
  ]);

  const isOwnProfile = userAuth?.id === userId;

  return (
    <div className="pt-20">
      <Box
        variant="lg"
        className="mx-auto flex max-w-xl flex-col justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-primary">{user.name}</h1>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <Label>Number of reviews</Label>
            <p className="text-xl">{reviews.length}</p>
          </div>
          <div>
            <Label>Created account at</Label>
            <p className="text-xl">
              <DateTime date={user.createdAt} format="YYYY-MM-DD" />
            </p>
          </div>
          <div>
            <Label>Last updated at</Label>
            <p className="text-xl">
              <DateTime date={user.updatedAt} format="YYYY-MM-DD" />
            </p>
          </div>
        </div>

        {isOwnProfile && (
          <div className="mt-6 border-t pt-6">
            <h2 className="mb-4 text-xl font-semibold">Change username</h2>
            <FormUsernameChange redirectTo={routes.user(userId)} />
          </div>
        )}
      </Box>

      {/* <h1 className="mt-10 text-xl">Rankings</h1>
      <div className="basis-full overflow-y-hidden md:basis-2/3">
        <Suspense fallback={<RankingsListSkeleton />}>
          <RankingsList filters={{}} />
        </Suspense>
      </div> */}

      <h1 className="mt-10 text-xl">All reviews</h1>
      <div>
        <ReviewsList reviews={reviews} />
      </div>
    </div>
  );
}
