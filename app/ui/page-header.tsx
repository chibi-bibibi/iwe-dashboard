"use client";

import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

export default function PageHeader({
  title,
  className,
}: {
  root?: string;
  parent?: string;
  title: string;
  className?: string;
}) {
  const router = useRouter();

  return (
    <header
      className={[
        "w-full shrink-0 bg-background",
        "px-2 py-1.5",
        className ?? "",
      ].join(" ")}
    >
      <div className="flex h-8 items-center gap-1.5">
        <button
          type="button"
          onClick={() => router.back()}
          className="
            flex h-8 w-8 shrink-0
            items-center justify-center
            text-muted-foreground
            hover:text-foreground
          "
          aria-label="戻る"
        >
          <ChevronRightIcon className="h-5 w-5 rotate-180" />
        </button>

        <h1 className="min-w-0 truncate text-lg font-semibold md:text-2xl">
          {title}
        </h1>
      </div>
    </header>
  );
}
