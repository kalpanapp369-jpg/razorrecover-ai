import React from 'react';
import { cn } from '../../lib/utils';
import { EmptyState } from './EmptyState';
import { LoadingState } from './LoadingState';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  className?: string;
  light?: boolean;
}

export function DataTable<T extends { id?: string | number }>({
  columns,
  data,
  isLoading = false,
  emptyTitle = 'No records found',
  emptyMessage = 'There are currently no items matching this criteria.',
  onRowClick,
  className,
}: DataTableProps<T>) {
  if (isLoading) {
    return <LoadingState message="Loading data..." />;
  }

  if (!data || data.length === 0) {
    return <EmptyState title={emptyTitle} message={emptyMessage} />;
  }

  return (
    <div
      className={cn(
        'overflow-x-auto rounded-[4px] border border-slate-200 bg-white shadow-blade-sm',
        className
      )}
    >
      <table className="w-full text-left text-xs text-slate-700">
        <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={cn('px-4 py-3', col.className)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((item, index) => (
            <tr
              key={item.id || index}
              onClick={() => onRowClick && onRowClick(item)}
              className={cn(
                'transition-colors duration-150',
                onRowClick
                  ? 'cursor-pointer hover:bg-slate-50/80 active:bg-slate-100/80'
                  : 'hover:bg-slate-50/50'
              )}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    'px-4 py-3 text-xs text-slate-800',
                    col.className
                  )}
                >
                  {col.render ? col.render(item) : (item as any)[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
