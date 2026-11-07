import type { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className = "", ...props }: CardProps) {
  return (
    <div
      className={`rounded-card border border-border bg-surface shadow-card ${className}`}
      {...props}
    />
  );
}
