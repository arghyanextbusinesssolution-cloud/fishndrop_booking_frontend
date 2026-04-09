"use client";

import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, description, actionLabel, onAction }: Props) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-10 text-center">
      <Inbox className="mx-auto mb-4 h-10 w-10 text-[var(--text-secondary)]" />
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="mt-2 text-[var(--text-secondary)]">{description}</p>
      {actionLabel && onAction && (
        <Button className="mt-5 bg-[var(--accent)] text-black hover:bg-[var(--accent-hover)]" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
