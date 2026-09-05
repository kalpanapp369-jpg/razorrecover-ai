import React from 'react';
import { cn } from '../../lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  action?: React.ReactNode;
  className?: string;
  light?: boolean;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  badge,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 pb-5 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200',
        className
      )}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0C2651] font-heading">
            {title}
          </h1>
          {badge && (
            <span className="inline-flex items-center rounded-[4px] border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-[#0D94FB]">
              {badge}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {action && (
        <div className="flex shrink-0 items-center gap-2.5">
          {action}
        </div>
      )}
    </div>
  );
};
