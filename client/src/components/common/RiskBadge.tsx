import React from 'react';
import { cn } from '../../lib/utils';
import { ShieldAlert, ShieldCheck, Shield } from 'lucide-react';

interface RiskBadgeProps {
  level: 'HIGH' | 'MEDIUM' | 'LOW' | string;
  score?: number;
  size?: 'sm' | 'md';
  showIcon?: boolean;
  className?: string;
  light?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level,
  score,
  size = 'md',
  showIcon = true,
  className,
}) => {
  const normLevel = (level || '').toUpperCase();

  const getRiskConfig = () => {
    switch (normLevel) {
      case 'HIGH':
      case 'CRITICAL':
        return {
          label: normLevel,
          classes: 'bg-rose-50 text-rose-800 border-rose-200',
          icon: ShieldAlert,
          iconColor: 'text-rose-600',
        };
      case 'MEDIUM':
      case 'MODERATE':
        return {
          label: normLevel,
          classes: 'bg-amber-50 text-amber-900 border-amber-200',
          icon: Shield,
          iconColor: 'text-amber-600',
        };
      case 'LOW':
      case 'SAFE':
        return {
          label: normLevel,
          classes: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          icon: ShieldCheck,
          iconColor: 'text-emerald-600',
        };
      default:
        return {
          label: normLevel,
          classes: 'bg-slate-50 text-slate-700 border-slate-200',
          icon: Shield,
          iconColor: 'text-slate-500',
        };
    }
  };

  const config = getRiskConfig();
  const IconComponent = config.icon;

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[10px] gap-1',
    md: 'px-2 py-0.5 text-xs gap-1.5 font-medium',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-[4px] border transition-colors duration-150',
        config.classes,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <IconComponent className={cn(iconSizes[size], config.iconColor)} />}
      <span>{config.label}{score !== undefined ? ` • ${score}` : ''}</span>
    </span>
  );
};
