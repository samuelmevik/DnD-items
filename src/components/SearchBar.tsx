import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  inputRef?: React.RefObject<HTMLInputElement>;
  className?: string;
}

export default function SearchBar({
  searchTerm,
  onSearchChange,
  inputRef,
  className,
}: SearchBarProps) {
  return (
    <div className={cn("relative w-full", className)}>
      <Search
        aria-hidden
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        ref={inputRef}
        type="text"
        placeholder="Search items by name or description…"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape" && searchTerm) {
            e.preventDefault();
            onSearchChange("");
          }
        }}
        aria-label="Search items"
        className="h-10 w-full px-9"
      />
      {searchTerm && (
        <button
          type="button"
          onClick={() => onSearchChange("")}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
