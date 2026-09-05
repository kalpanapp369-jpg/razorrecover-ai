import React from 'react';
import { Inbox, LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  light?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title = 'No records found',
  message = 'There are no active entries to display right now.',
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-[4px] border border-slate-200 bg-white p-10 text-center shadow-blade-sm',
        className
      )}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-[4px] border border-blue-200 bg-blue-50 text-[#0D94FB]">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-3.5 text-sm font-bold font-heading text-[#0C2651]">
        {title}
      </h3>
      <p className="mt-1 max-w-sm text-xs text-slate-500 leading-relaxed">
        {message}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 inline-flex items-center gap-2 rounded-[4px] bg-[#0D94FB] hover:bg-[#0B82DE] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
