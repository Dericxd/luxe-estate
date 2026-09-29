'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

export function Pagination({ currentPage, totalPages }: PaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(page));
    return `${pathname}?${params.toString()}`;
  };

  // Build page numbers to show: always first, last, current ± 1, with ellipsis
  const getPageRange = () => {
    const pages: (number | 'ellipsis')[] = [];
    const delta = 1;

    const range: number[] = [];
    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (range[0] > 2) pages.push(1, 'ellipsis');
    else pages.push(1);

    pages.push(...range);

    if (range[range.length - 1] < totalPages - 1)
      pages.push('ellipsis', totalPages);
    else if (totalPages > 1) pages.push(totalPages);

    return pages;
  };

  const pages = getPageRange();

  return (
    <nav
      aria-label="Property pagination"
      className="mt-12 flex items-center justify-center gap-1"
    >
      {/* Previous */}
      {currentPage > 1 ? (
        <Link
          href={createPageUrl(currentPage - 1)}
          aria-label="Previous page"
          className="flex items-center justify-center w-10 h-10 rounded-lg bg-white dark:bg-white/5 border border-nordic-dark/10 dark:border-white/10 text-nordic-dark dark:text-white hover:border-mosque hover:text-mosque transition-all"
        >
          <span className="material-icons text-lg">chevron_left</span>
        </Link>
      ) : (
        <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-white dark:bg-white/5 border border-nordic-dark/10 dark:border-white/10 text-nordic-muted opacity-40 cursor-not-allowed">
          <span className="material-icons text-lg">chevron_left</span>
        </span>
      )}

      {/* Pages */}
      {pages.map((page, idx) =>
        page === 'ellipsis' ? (
          <span
            key={`ellipsis-${idx}`}
            className="flex items-center justify-center w-10 h-10 text-nordic-muted"
          >
            ···
          </span>
        ) : (
          <Link
            key={page}
            href={createPageUrl(page)}
            aria-label={`Go to page ${page}`}
            aria-current={page === currentPage ? 'page' : undefined}
            className={`flex items-center justify-center w-10 h-10 rounded-lg text-sm font-medium transition-all ${
              page === currentPage
                ? 'bg-mosque text-white shadow-md'
                : 'bg-white dark:bg-white/5 border border-nordic-dark/10 dark:border-white/10 text-nordic-dark dark:text-white hover:border-mosque hover:text-mosque'
            }`}
          >
            {page}
          </Link>
        )
      )}

      {/* Next */}
      {currentPage < totalPages ? (
        <Link
          href={createPageUrl(currentPage + 1)}
          aria-label="Next page"
          className="flex items-center justify-center w-10 h-10 rounded-lg bg-white dark:bg-white/5 border border-nordic-dark/10 dark:border-white/10 text-nordic-dark dark:text-white hover:border-mosque hover:text-mosque transition-all"
        >
          <span className="material-icons text-lg">chevron_right</span>
        </Link>
      ) : (
        <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-white dark:bg-white/5 border border-nordic-dark/10 dark:border-white/10 text-nordic-muted opacity-40 cursor-not-allowed">
          <span className="material-icons text-lg">chevron_right</span>
        </span>
      )}
    </nav>
  );
}
