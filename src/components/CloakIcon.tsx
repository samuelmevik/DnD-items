type CloakIconProps = {
  className?: string;
  "aria-hidden"?: boolean;
};

/** Hooded cloak icon, drawn in the same style as the lucide icons. */
export function CloakIcon({ className, ...rest }: CloakIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...rest}
    >
      {/* Hood and flared cloak body */}
      <path d="M12 2C9 2 7 4.5 7 8L3 21H21L17 8C17 4.5 15 2 12 2Z" />
      {/* Shadowed face opening in the hood */}
      <path d="M9.5 8.5C9.5 6.9 10.6 5.6 12 5.6C13.4 5.6 14.5 6.9 14.5 8.5C14.5 9.6 13.5 10.5 12 10.5C10.5 10.5 9.5 9.6 9.5 8.5Z" />
      {/* Front opening of the cloak */}
      <path d="M12 10.5V21" />
    </svg>
  );
}
