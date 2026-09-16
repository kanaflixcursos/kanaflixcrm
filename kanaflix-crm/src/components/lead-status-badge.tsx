import { leadStatusLabels, type LeadStatus } from "@/lib/lead-status";

const styles: Record<LeadStatus, string> = {
  new: "bg-brand-soft text-brand",
  reviewing: "bg-surface-muted text-foreground",
  qualified: "bg-success/10 text-success",
  follow_up: "bg-warning/10 text-warning",
  converted: "bg-success/10 text-success",
  discarded: "bg-danger/10 text-danger",
};

export function LeadStatusBadge({ status }: Readonly<{ status: LeadStatus }>) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${styles[status]}`}>
      {leadStatusLabels[status]}
    </span>
  );
}
