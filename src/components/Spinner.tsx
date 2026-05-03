import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        "size-8 animate-spin rounded-full border-b-2 border-primary",
        className,
      )}
    />
  );
}
