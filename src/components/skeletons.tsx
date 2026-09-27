export function ReviewCreateSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-hidden>
      <div className="h-10 w-2/3 rounded-lg bg-gray" />
      <div className="h-5 w-full rounded bg-gray/70" />
      <div className="h-12 w-full rounded-lg bg-gray/70" />
    </div>
  );
}

export function SkeletonList() {
  return (
    <div className="flex flex-col gap-y-6">
      {Array.from({ length: 10 }).map((_, index) => (
        <div className="mx-auto flex flex-row items-center" key={index}>
          <div className="size-12 animate-pulse rounded-full bg-white/80" />
          <div className="ml-10 h-12 w-72 animate-pulse rounded-lg bg-white/80" />
        </div>
      ))}
    </div>
  );
}
