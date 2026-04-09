import type { Status } from '../types';
import { statusColor, statusLabel } from '../lib/risk';

export default function StatusBadge({ status, size = 'md' }: { status: Status; size?: 'sm' | 'md' | 'lg' }) {
  const colors = statusColor[status];
  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-2',
    lg: 'text-sm px-3 py-1.5 gap-2',
  }[size];
  const dotSize = { sm: 'w-1.5 h-1.5', md: 'w-2 h-2', lg: 'w-2.5 h-2.5' }[size];

  return (
    <span
      className={`inline-flex items-center font-bold uppercase tracking-wider rounded-full border ${colors.bg} ${colors.border} ${colors.text} ${sizeClasses}`}
    >
      <span className={`${dotSize} rounded-full ${colors.dot} ${colors.glow}`} />
      {statusLabel[status]}
    </span>
  );
}
