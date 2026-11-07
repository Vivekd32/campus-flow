type ProgressTone = "primary" | "success" | "warning" | "danger";

type ProgressProps = {
  value: number;
  max?: number;
  label: string;
  tone?: ProgressTone;
  className?: string;
};

const tones: Record<ProgressTone, string> = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

export function Progress({
  value,
  max = 100,
  label,
  tone = "primary",
  className = "",
}: ProgressProps) {
  const safeMax = Math.max(max, 1);
  const percentage = Math.min(Math.max((value / safeMax) * 100, 0), 100);

  return (
    <div
      aria-label={label}
      aria-valuemax={safeMax}
      aria-valuemin={0}
      aria-valuenow={Math.min(Math.max(value, 0), safeMax)}
      className={`h-2.5 overflow-hidden rounded-pill bg-surface-muted ${className}`}
      role="progressbar"
    >
      <div
        className={`h-full rounded-pill transition-[width] duration-500 ${tones[tone]}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
