import { Clock, ArrowRight, CheckCircle2, ShieldAlert } from 'lucide-react';
import type { Alert } from '../types';
import { statusColor } from '../lib/risk';
import StatusBadge from './StatusBadge';

function timeAgo(date: Date): string {
  const ms = Date.now() - date.getTime();
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

export default function AlertCard({
  alert,
  onAcknowledge,
  onViewPile,
}: {
  alert: Alert;
  onAcknowledge: () => void;
  onViewPile: () => void;
}) {
  const colors = statusColor[alert.severity];
  const isCritical = alert.severity === 'critical' || alert.severity === 'emergency';

  return (
    <div
      className={`rounded-xl border-2 overflow-hidden fade-up ${
        isCritical ? `${colors.border} bg-ink-900` : 'border-ink-700 bg-ink-900'
      }`}
    >
      {/* Severity stripe */}
      <div className={`h-1 ${colors.dot}`} />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <StatusBadge status={alert.severity} size="sm" />
              <span className="flex items-center gap-1 text-xs text-ink-400">
                <Clock className="w-3 h-3" />
                {timeAgo(alert.triggeredAt)}
              </span>
            </div>
            <h3 className="text-lg font-extrabold text-ink-100 tracking-tight leading-snug">
              {alert.title}
            </h3>
            <div className="text-xs text-ink-400 mt-0.5">
              <span className="font-semibold text-ink-200">{alert.pileName}</span>
              {' · '}
              Sensors: <span className="font-mono">{alert.sensorsInvolved.join(', ')}</span>
            </div>
          </div>

          {/* Big reading block */}
          <div className={`text-right shrink-0 font-mono ${colors.text}`}>
            <div className="text-[10px] uppercase tracking-widest text-ink-400">Reading</div>
            <div className="text-base font-bold leading-tight">{alert.reading}</div>
          </div>
        </div>

        {/* Detail */}
        <p className="text-sm text-ink-200 leading-relaxed mb-4">{alert.detail}</p>

        {/* Action box */}
        <div className={`rounded-lg p-3 border ${colors.border} ${colors.bg} mb-3`}>
          <div className={`flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold mb-1.5 ${colors.text}`}>
            <ShieldAlert className="w-3 h-3" />
            Recommended action
          </div>
          <p className="text-sm text-ink-100 leading-relaxed">{alert.recommendedAction}</p>
        </div>

        {/* Footer: traceability + action buttons */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-ink-700">
          <div className="text-[10px] text-ink-400 font-mono">Detected by: {alert.stage}</div>
          <div className="flex gap-2">
            <button
              onClick={onAcknowledge}
              className="px-3 py-1.5 rounded-md text-xs font-semibold border border-ink-600 text-ink-200 hover:bg-ink-800 hover:text-ink-100 transition flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3 h-3" />
              Acknowledge
            </button>
            <button
              onClick={onViewPile}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 ${
                isCritical
                  ? 'bg-crit text-ink-100 hover:bg-crit/80'
                  : 'bg-ink-700 text-ink-100 hover:bg-ink-600'
              }`}
            >
              View pile
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
