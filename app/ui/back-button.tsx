"use client";

import { useRouter } from "next/navigation";
import React from "react";

export default function BackButton({ href }: { href?: string }) {
  const router = useRouter();

  function handleClick() {
    try {
      // Try native history back first
      router.back();
    } catch {
      if (href) router.push(href);
      else router.push("/");
    }
  }

  return (
    <button
      aria-label="戻る"
      onClick={handleClick}
      className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1 text-sm font-medium text-foreground shadow-sm hover:bg-accent/80"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="h-4 w-4"
        aria-hidden
      >
        <path
          fillRule="evenodd"
          d="M7.707 14.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L4.414 9H18a1 1 0 110 2H4.414l3.293 3.293a1 1 0 010 1.414z"
          clipRule="evenodd"
        />
      </svg>
      <span>戻る</span>
    </button>
  );
}
