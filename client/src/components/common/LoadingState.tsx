import React from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';

interface LoadingStateProps {
  message?: string;
  className?: string;
  light?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading data...',
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-[4px] border border-slate-200 bg-white p-10 text-center shadow-blade-sm animate-pulse',
        className
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-[4px] bg-blue-50 text-[#0D94FB]">
        <RefreshCw className="h-5 w-5 animate-spin" />
      </div>
      <p className="mt-3 text-xs font-semibold text-slate-600">
        {message}
      </p>
    </div>
  );
};
