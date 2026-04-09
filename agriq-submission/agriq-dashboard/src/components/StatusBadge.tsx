import { Check, AlertTriangle, XCircle, Siren } from 'lucide-react';
import type { Status } from '../types';
import { statusColor, statusLabel } from '../lib/risk';

const statusIcon = {
  ok:        Check,
  warning:   AlertTriangle,
  critical:  XCircle,
  emergency: Siren,
} as const;

export default function StatusBadge({ status, size = 'md' }: { status: Status; size?: 'sm' | 'md' | 'lg' }) {
  const colors = statusColor[status];
  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  }[size];
  const iconSize = { sm: 'w-2.5 h-2.5', md: 'w-3 h-3', lg: 'w-3.5 h-3.5' }[size];
  const Icon = statusIcon[status];

  return (
    <span
      className={`inline-flex items-center font-bold uppercase tracking-wider rounded-full border ${colors.bg} ${colors.border} ${colors.text} ${sizeClasses}`}
    >
      <Icon className={`${iconSize} shrink-0`} strokeWidth={2.5} />
      {statusLabel[status]}
    </span>
  );
}
