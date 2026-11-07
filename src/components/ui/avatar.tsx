type AvatarSize = "sm" | "md" | "lg";

type AvatarProps = {
  name: string;
  src?: string;
  size?: AvatarSize;
  className?: string;
};

const sizes: Record<AvatarSize, string> = {
  sm: "size-8 text-[0.65rem]",
  md: "size-10 text-xs",
  lg: "size-12 text-sm",
};

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

export function Avatar({
  name,
  src,
  size = "md",
  className = "",
}: AvatarProps) {
  return (
    <span
      aria-label={name}
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-surface bg-secondary font-semibold text-secondary-foreground ring-1 ring-border ${sizes[size]} ${className}`}
      role="img"
      style={
        src
          ? {
              backgroundImage: `url("${src}")`,
              backgroundPosition: "center",
              backgroundSize: "cover",
            }
          : undefined
      }
    >
      {src ? <span className="sr-only">{getInitials(name)}</span> : getInitials(name)}
    </span>
  );
}
