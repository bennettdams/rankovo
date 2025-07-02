import { CircleX, SearchX } from "lucide-react";
import type { ReactNode } from "react";

const icons = {
  error: CircleX,
  notFound: SearchX,
};

export function ErrorCard({
  title,
  children,
  variant = "error",
}: {
  title: string;
  children: ReactNode;
  variant?: keyof typeof icons;
}) {
  const Icon = icons[variant];
  return (
    <div className="flex size-full items-center justify-center text-left">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col gap-6 overflow-y-auto bg-white p-8 shadow-sm">
        <Icon className="size-16 stroke-error" />
        <h1 className="text-2xl">{title}</h1>
        {children}
      </div>
    </div>
  );
}
