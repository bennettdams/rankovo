export function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex animate-appear flex-col items-center pb-6 pt-16">
      <div className="flex items-center gap-2">
        <h2 className="text-center text-4xl font-extrabold tracking-tight text-primary">
          {children}
        </h2>
      </div>
      <span className="mt-2 block h-1 w-52 rounded-full bg-gradient-to-r from-primary to-secondary opacity-80" />
    </div>
  );
}
