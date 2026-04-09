import { Thermometer, Droplets, ChevronRight, Activity } from 'lucide-react';
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

  // A "problem sensor" is one reading meaningfully above the pile's own baseline.
  // We use a delta-based check (rather than the absolute spec thresholds) because
  // this is the number an operator actually wants: how many sensors are pulling
  // this pile's risk score up. A baseline-warm pile shouldn't show every sensor
  // as flagged just because it's warm overall.
  const TEMP_DELTA = 3;     // °C above baseline
  const MOIST_DELTA = 1.0;  // % above baseline
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

      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase tracking-widest text-ink-400 mb-1">Pile</div>
            <h3 className="text-xl font-extrabold text-ink-100 tracking-tight truncate">{pile.name}</h3>
            <div className="text-xs text-ink-400 mt-0.5">
              {pile.grainType} · {pile.tonnage.toLocaleString()} tonnes
            </div>
          </div>
          <div className="shrink-0">
            <StatusBadge status={pile.status} size="sm" />
          </div>
        </div>

        {/* Headline */}
        <p className="text-sm text-ink-200 leading-snug mb-4 min-h-[2.5rem]">{pile.headline}</p>

        {/* Readings */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-ink-950/60 border border-ink-700 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-ink-400 mb-1">
              <Thermometer className="w-3 h-3" />
              Temperature
            </div>
            <div className="font-mono text-xl font-bold text-ink-100">
              {pile.summary.tempC}
              <span className="text-sm text-ink-400 ml-0.5">°C</span>
            </div>
          </div>
          <div className="bg-ink-950/60 border border-ink-700 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-ink-400 mb-1">
              <Droplets className="w-3 h-3" />
              Moisture
            </div>
            <div className="font-mono text-xl font-bold text-ink-100">
              {pile.summary.moisturePct}
              <span className="text-sm text-ink-400 ml-0.5">%</span>
            </div>
          </div>
        </div>

        {/* Footer meta */}
        <div className="flex items-center justify-between pt-3 border-t border-ink-700">
          <div className="flex items-center gap-1.5 text-xs text-ink-300">
            <Activity className="w-3 h-3" />
            <span>
              <span className="font-semibold text-ink-100">{problemCount}</span>
              {' / '}
              <span>{pile.sensors.length}</span> problem sensors
            </span>
          </div>
          <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'rotate-90 text-ink-100' : 'text-ink-400'}`} />
        </div>
      </div>
    </button>
  );
}
