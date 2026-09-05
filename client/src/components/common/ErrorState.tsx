import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
  light?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'An error occurred while communicating with the recovery server.',
  onRetry,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-[4px] border border-rose-200 bg-white p-10 text-center shadow-blade-sm',
        className
      )}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-[4px] border border-rose-200 bg-rose-50 text-rose-600">
        <AlertCircle className="h-5 w-5" />
      </div>
      <h3 className="mt-3.5 text-sm font-bold font-heading text-[#0C2651]">
        {title}
      </h3>
      <p className="mt-1 max-w-md text-xs text-slate-500 leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 rounded-[4px] border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98]"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry Request
        </button>
      )}
    </div>
  );
};
