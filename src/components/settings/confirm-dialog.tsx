"use client";

import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ConfirmDialog({
  title,
  description,
  confirmLabel = "Delete",
  onCancel,
  onConfirm,
}: {
  title: string;
  description: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[3px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <section
        aria-labelledby="confirm-title"
        aria-modal="true"
        className="auth-enter w-full max-w-[25rem] rounded-panel border border-border bg-surface p-5 shadow-popover sm:p-6"
        role="alertdialog"
      >
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-danger-muted text-danger">
            <AlertTriangle aria-hidden="true" size={19} />
          </span>
          <div className="min-w-0 flex-1">
            <h2
              className="pr-7 text-sm font-semibold text-foreground"
              id="confirm-title"
            >
              {title}
            </h2>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              {description}
            </p>
          </div>
          <button
            aria-label="Close dialog"
            className="-mr-1 -mt-1 inline-flex size-8 shrink-0 items-center justify-center rounded-control text-muted-foreground transition hover:bg-surface-muted"
            onClick={onCancel}
            type="button"
          >
            <X aria-hidden="true" size={16} />
          </button>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button onClick={onCancel} variant="ghost">
            Cancel
          </Button>
          <Button
            className="bg-danger text-white hover:bg-danger/90"
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </section>
    </div>
  );
}
