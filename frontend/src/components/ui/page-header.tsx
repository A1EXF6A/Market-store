import * as React from "react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  icon: Icon,
  actions,
  className,
}) => {
  return (
    <div
      className={cn(
        "mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between",
        className,
      )}
    >
      <div>
        <div className="inline-flex items-center gap-3 rounded-full border border-primary/10 bg-primary/5 px-3 py-1 text-xs font-medium text-primary shadow-sm">
          {Icon && (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon className="h-3.5 w-3.5" />
            </span>
          )}
          <span className="uppercase tracking-wide text-[0.7rem] text-primary/80">
            Panel de administración
          </span>
        </div>
        <h1 className="mt-3 bg-gradient-to-r from-slate-900 via-primary to-sky-500 bg-clip-text text-3xl font-bold tracking-tight text-slate-900 dark:from-slate-50 dark:via-primary dark:to-sky-300 dark:text-transparent">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
};
