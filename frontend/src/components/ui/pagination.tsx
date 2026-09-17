import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./button";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number | ((prev: number) => number)) => void;
  ariaLabel?: string;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  ariaLabel = "Pagination",
  className = "",
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label={ariaLabel}
      className={`mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 ${className}`}
    >
      <Button
        className="w-full sm:w-auto justify-center order-2 sm:order-none"
        disabled={currentPage === 1}
        onClick={() => onPageChange((value) => value - 1)}
        size="sm"
        variant="outline"
      >
        <ChevronLeft className="size-4 mr-1" />
        Previous page
      </Button>
      <span className="text-sm text-slate-600 self-center font-medium order-1 sm:order-none">
        Page {currentPage} of {totalPages}
      </span>
      <Button
        className="w-full sm:w-auto justify-center order-3 sm:order-none"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange((value) => value + 1)}
        size="sm"
        variant="outline"
      >
        Next page
        <ChevronRight className="size-4 ml-1" />
      </Button>
    </nav>
  );
}
