import { alerts } from '../data/mockData';
import AlertCard from '../components/AlertCard';
import { Siren, CheckCircle2 } from 'lucide-react';
import type { Status } from '../types';

// Sort order: emergency > critical > warning > info > ok
const severityRank: Record<Status, number> = {
  emergency: 0,
  critical: 1,
  warning: 2,
  ok: 3,
};

export default function AlertsPage() {
  const sorted = [...alerts].sort((a, b) => {
    const rankDiff = severityRank[a.severity] - severityRank[b.severity];
    if (rankDiff !== 0) return rankDiff;
    return b.triggeredAt.getTime() - a.triggeredAt.getTime();
  });

  const criticalCount = alerts.filter(a => a.severity === 'critical' || a.severity === 'emergency').length;
  const warningCount = alerts.filter(a => a.severity === 'warning').length;

  const hasCritical = criticalCount > 0;

  return (
    <div className="p-6 max-w-[1100px] mx-auto">
      {/* Header */}
      <header className="mb-6">
        <div className="text-[10px] uppercase tracking-widest text-ink-400 mb-1">Active alerts</div>
        <div className="flex items-end justify-between flex-wrap gap-4">
          <h1 className="text-3xl font-extrabold text-ink-100 tracking-tight flex items-center gap-3">
            <Siren className={`w-7 h-7 ${hasCritical ? 'text-crit pulse-crit rounded-full' : 'text-ink-300'}`} />
            Alerts
          </h1>
          <div className="flex gap-3 text-xs font-mono">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-crit/40 bg-crit/10">
              <span className="font-bold text-base text-crit">{criticalCount}</span>
              <span className="text-ink-300 uppercase tracking-wider text-[10px]">Critical</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-warn/40 bg-warn/10">
              <span className="font-bold text-base text-warn">{warningCount}</span>
              <span className="text-ink-300 uppercase tracking-wider text-[10px]">Warning</span>
            </div>
          </div>
        </div>
      </header>

      {/* Priority banner for critical */}
      {hasCritical && (
        <div className="mb-5 rounded-xl bg-crit/10 border-2 border-crit/40 p-4 flex items-center gap-3 fade-up">
          <Siren className="w-5 h-5 text-crit shrink-0" />
          <div className="text-sm text-ink-100">
            <span className="font-bold text-crit">Immediate action required.</span>{' '}
            {criticalCount} critical {criticalCount === 1 ? 'alert' : 'alerts'} {criticalCount === 1 ? 'is' : 'are'} active. Review and act on the items below.
          </div>
        </div>
      )}

      {/* Alert list */}
      <div className="space-y-4">
        {sorted.length === 0 ? (
          <div className="rounded-xl border border-ink-700 bg-ink-900 p-10 text-center">
            <CheckCircle2 className="w-12 h-12 text-ok mx-auto mb-3" />
            <div className="font-bold text-ink-100">No active alerts</div>
            <div className="text-sm text-ink-400 mt-1">All piles are stable.</div>
          </div>
        ) : (
          sorted.map((alert, i) => (
            <div key={alert.id} style={{ animationDelay: `${i * 80}ms` }}>
              <AlertCard alert={alert} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
