import Link from "next/link";
import { Layers } from "lucide-react";

type BrandProps = {
  className?: string;
};

export function Brand({ className = "" }: BrandProps) {
  return (
    <Link
      aria-label="CampusFlow home"
      className={`inline-flex items-center gap-2.5 rounded-control ${className}`}
      href="/"
    >
      <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <Layers aria-hidden="true" size={19} strokeWidth={2.2} />
      </span>
      <span className="text-[1.05rem] font-bold tracking-tight text-foreground">
        Campus<span className="text-primary">Flow</span>
      </span>
    </Link>
  );
}
