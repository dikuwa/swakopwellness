"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { useCallback, useRef } from "react";

export function SearchInput({ placeholder = "Search..." }: { placeholder?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const currentQ = searchParams.get("q") ?? "";

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = new FormData(e.currentTarget);
      const q = form.get("q") as string;
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      params.set("page", "1");
      router.push(`?${params.toString()}`);
    },
    [router],
  );

  const handleClear = useCallback(() => {
    if (inputRef.current) inputRef.current.value = "";
    router.push("?");
  }, [router]);

  return (
    <form onSubmit={handleSubmit} className="relative flex items-center">
      <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground/50" aria-hidden="true" />
      <input
        ref={inputRef}
        type="search"
        name="q"
        defaultValue={currentQ}
        placeholder={placeholder}
        className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-8 text-sm transition-colors placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/10"
      />
      {currentQ && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2 flex h-6 w-6 items-center justify-center rounded-lg text-muted-foreground/50 transition-colors hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
      <button type="submit" className="sr-only">Search</button>
    </form>
  );
}
