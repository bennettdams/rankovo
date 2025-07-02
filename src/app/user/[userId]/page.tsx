import { DateTime } from "@/components/date-time";
import { queries } from "@/data/queries";

export default async function PageUser({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  const user = await queries.userForId(userId);

  return (
    <div>
      <h1 className="text-2xl font-bold">{user.name}</h1>
      <h1 className="">
        Created account at{" "}
        <DateTime date={user.createdAt} format="YYYY-MM-DD" />
      </h1>
      <h1 className="">
        Last updated at <DateTime date={user.updatedAt} format="YYYY-MM-DD" />
      </h1>
    </div>
  );
}
