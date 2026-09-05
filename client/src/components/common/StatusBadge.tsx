import React from 'react';
import { cn } from '../../lib/utils';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  AlertTriangle,
  PlayCircle,
  RefreshCw,
  Zap,
} from 'lucide-react';

export type StatusType =
  | 'PENDING'
  | 'PROCESSING'
  | 'ANALYZING'
  | 'COMPLETED'
  | 'SUCCESS'
  | 'FAILED'
  | 'OVERDUE'
  | 'PAID'
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'CANCELLED'
  | 'SCHEDULED'
  | 'DISPATCHED'
  | 'TRIGGERED'
  | 'EXECUTING'
  | 'SIMULATED'
  | 'STOPPED'
  | 'APPROVED'
  | 'REJECTED'
  | 'ESCALATED'
  | 'RECOMMENDED'
  | 'RECOVERED'
  | string;

interface StatusBadgeProps {
  status: StatusType;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
  light?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
  className,
}) => {
  const normStatus = (status || '').toUpperCase();

  const getStatusConfig = () => {
    switch (normStatus) {
      case 'PAID':
      case 'COMPLETED':
      case 'SUCCESS':
      case 'RECOVERED':
      case 'ACTIVE':
      case 'APPROVED':
        return {
          label: normStatus === 'PAID' ? 'Paid' : normStatus === 'RECOVERED' ? 'Recovered' : normStatus,
          classes: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          icon: CheckCircle,
          iconColor: 'text-emerald-600',
        };

      case 'PENDING':
      case 'PAST_DUE':
      case 'SCHEDULED':
      case 'RECOMMENDED':
        return {
          label: normStatus === 'RECOMMENDED' ? 'Action Proposed' : normStatus === 'PAST_DUE' ? 'Past Due' : normStatus,
          classes: 'bg-amber-50 text-amber-900 border-amber-200',
          icon: Clock,
          iconColor: 'text-amber-600',
        };

      case 'PROCESSING':
      case 'ANALYZING':
      case 'EXECUTING':
      case 'DISPATCHED':
      case 'TRIGGERED':
        return {
          label: normStatus === 'ANALYZING' ? 'AI Diagnosing' : normStatus === 'EXECUTING' ? 'Dispatching' : normStatus,
          classes: 'bg-blue-50 text-blue-800 border-blue-200',
          icon: normStatus === 'ANALYZING' ? Zap : RefreshCw,
          iconColor: 'text-blue-600',
        };

      case 'FAILED':
      case 'OVERDUE':
      case 'CANCELLED':
      case 'STOPPED':
      case 'REJECTED':
        return {
          label: normStatus === 'OVERDUE' ? 'Overdue' : normStatus,
          classes: 'bg-rose-50 text-rose-800 border-rose-200',
          icon: XCircle,
          iconColor: 'text-rose-600',
        };

      case 'ESCALATED':
        return {
          label: 'Escalated',
          classes: 'bg-purple-50 text-purple-800 border-purple-200',
          icon: AlertTriangle,
          iconColor: 'text-purple-600',
        };

      case 'SIMULATED':
        return {
          label: 'Simulated',
          classes: 'bg-slate-100 text-slate-700 border-slate-300',
          icon: PlayCircle,
          iconColor: 'text-slate-500',
        };

      default:
        return {
          label: normStatus,
          classes: 'bg-slate-50 text-slate-700 border-slate-200',
          icon: AlertCircle,
          iconColor: 'text-slate-500',
        };
    }
  };

  const config = getStatusConfig();
  const IconComponent = config.icon;

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[10px] gap-1',
    md: 'px-2 py-0.5 text-xs gap-1.5',
    lg: 'px-2.5 py-1 text-xs gap-1.5 font-semibold',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-[4px] border font-medium tracking-tight transition-colors duration-150',
        config.classes,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && (
        <IconComponent
          className={cn(
            iconSizes[size],
            config.iconColor,
            normStatus === 'PROCESSING' || normStatus === 'ANALYZING' ? 'animate-spin' : ''
          )}
        />
      )}
      <span>{config.label}</span>
    </span>
  );
};
