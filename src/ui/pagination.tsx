import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
  currentPage,
  totalPages,
  basePath,
}: {
  currentPage: number;
  totalPages: number;
  basePath: string;
}) {
  if (totalPages <= 1) return null;

  const pages: (number | "...")[] = [];
  const delta = 1;
  const start = Math.max(2, currentPage - delta);
  const end = Math.min(totalPages - 1, currentPage + delta);

  pages.push(1);
  if (start > 2) pages.push("...");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < totalPages - 1) pages.push("...");
  if (totalPages > 1) pages.push(totalPages);

  return (
    <nav aria-label="Pagination" className="mt-6 flex items-center justify-center gap-1.5">
      {currentPage > 1 ? (
        <Link
          href={`${basePath}?page=${currentPage - 1}`}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border transition-colors hover:bg-surface-muted"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
      ) : (
        <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-muted-foreground/40">
          <ChevronLeft className="h-4 w-4" />
        </span>
      )}

      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`ellipsis-${i}`} className="flex h-9 w-9 items-center justify-center text-sm text-muted-foreground">
            ...
          </span>
        ) : (
          <Link
            key={p}
            href={`${basePath}?page=${p}`}
            className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
              p === currentPage
                ? "bg-primary text-primary-foreground"
                : "border border-border hover:bg-surface-muted"
            }`}
            aria-current={p === currentPage ? "page" : undefined}
            aria-label={`Page ${p}`}
          >
            {p}
          </Link>
        ),
      )}

      {currentPage < totalPages ? (
        <Link
          href={`${basePath}?page=${currentPage + 1}`}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border transition-colors hover:bg-surface-muted"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-muted-foreground/40">
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </nav>
  );
}
