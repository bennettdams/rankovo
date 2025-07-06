import { DateTime } from "@/components/date-time";
import { ReviewsList } from "@/components/reviews-list";
import { Label } from "@/components/ui/label";
import { queries } from "@/data/queries";

export default async function PageUser({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  const user = await queries.userForId(userId);
  const reviews = await queries.reviews(1, userId);

  return (
    <div className="pt-20">
      <div className="flex max-w-xl flex-col justify-between rounded-md bg-white p-8">
        <div>
          <h1 className="text-2xl font-bold">{user.name}</h1>
        </div>
        <div className="mt-4 flex flex-row justify-between">
          <div>
            <Label>Number of reviews</Label>
            <p>{reviews.length}</p>
          </div>
          <div>
            <Label>Created account at</Label>
            <p>
              <DateTime date={user.createdAt} format="YYYY-MM-DD" />
            </p>
          </div>
          <div>
            <Label>Last updated at</Label>
            <p>
              <DateTime date={user.updatedAt} format="YYYY-MM-DD" />
            </p>
          </div>
        </div>
      </div>

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
