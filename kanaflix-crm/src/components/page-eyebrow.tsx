import { BackButton } from "@/components/back-button";

export function PageEyebrow({ children, className = "" }: Readonly<{ children: React.ReactNode; className?: string }>) {
  return (
    <div className={`flex items-center gap-2 text-sm font-medium text-brand ${className}`}>
      <BackButton compact />
      <span>{children}</span>
    </div>
  );
}
