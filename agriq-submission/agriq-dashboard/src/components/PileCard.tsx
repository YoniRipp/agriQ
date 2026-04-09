import { ChevronRight, Activity } from 'lucide-react';
import type { Pile } from '../types';
import { statusColor } from '../lib/risk';
import StatusBadge from './StatusBadge';

interface Props {
  pile: Pile;
  isSelected: boolean;
  onClick: () => void;
}

export default function PileCard({ pile, isSelected, onClick }: Props) {
  const colors = statusColor[pile.status];

  const TEMP_DELTA = 3;
  const MOIST_DELTA = 1.0;
  const problemCount = pile.sensors.filter(s => {
    if (s.health === 'faulty') return true;
    return (
      s.tempC - pile.summary.tempC >= TEMP_DELTA ||
      s.moisturePct - pile.summary.moisturePct >= MOIST_DELTA
    );
  }).length;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl border-2 transition-all duration-200 fade-up ${
        isSelected
          ? `${colors.border} bg-ink-800 scale-[1.01] shadow-lg`
          : 'border-ink-700 bg-ink-900 hover:border-ink-600 hover:bg-ink-800'
      }`}
    >
      {/* Status stripe */}
      <div className={`h-1.5 rounded-t-[10px] ${colors.dot}`} />

      <div className="p-4">
        {/* Name + status */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <h3 className="text-lg font-extrabold text-ink-100 tracking-tight truncate">{pile.name}</h3>
          <StatusBadge status={pile.status} size="sm" />
        </div>

        {/* Grain info */}
        <div className="text-xs text-ink-400 mb-3">
          {pile.grainType} · {pile.tonnage.toLocaleString()} tonnes
        </div>

        {/* Readings — inline */}
        <div className="font-mono text-lg font-bold text-ink-100 mb-3">
          {pile.summary.tempC}°C
          <span className="text-ink-500 mx-1.5">/</span>
          {pile.summary.moisturePct}%
          <span className="text-xs font-normal text-ink-400 ml-1.5">moisture</span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-ink-700">
          <div className="flex items-center gap-1.5 text-xs text-ink-300">
            <Activity className="w-3 h-3" />
            <span>
              <span className={`font-semibold ${problemCount > 0 ? colors.text : 'text-ink-100'}`}>{problemCount}</span>
              {' / '}
              {pile.sensors.length} flagged
            </span>
          </div>
          <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'rotate-90 text-ink-100' : 'text-ink-400'}`} />
        </div>
      </div>
    </button>
  );
}
