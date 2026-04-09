import { Layers } from 'lucide-react';

/**
 * Shows a vertical cross-section of the pile with all 3 layers stacked top to bottom.
 * The pile is 10m high, divided into 3 layers of ~3.3m each.
 */
export default function PileLayerProfile() {
  const layers = [
    { name: 'Top layer', sensors: 'S21–S30', height: '6.7–10m', colorBorder: 'border-crit' },
    { name: 'Middle layer', sensors: 'S11–S20', height: '3.3–6.7m', colorBorder: 'border-warn' },
    { name: 'Bottom layer', sensors: 'S01–S10', height: '0–3.3m', colorBorder: 'border-ok' },
  ];

  return (
    <div className="bg-ink-900 border border-ink-700 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <Layers className="w-4 h-4 text-ink-400" />
        <div className="text-[10px] uppercase tracking-widest text-ink-400">Pile elevation (10m height)</div>
      </div>

      {/* Vertical cross-section — top to bottom */}
      <div className="space-y-2 mb-4">
        {layers.map((layer) => (
          <div
            key={layer.name}
            className={`border-l-4 ${layer.colorBorder} bg-ink-950 rounded-lg p-3 flex items-center justify-between`}
          >
            <div>
              <div className="text-sm font-bold text-ink-100">{layer.name}</div>
              <div className="text-[9px] text-ink-400 font-mono mt-0.5">{layer.sensors}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-mono text-ink-300">{layer.height}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Pile dimensions summary */}
      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-ink-700">
        <div>
          <div className="text-[9px] uppercase tracking-wider text-ink-400">Length</div>
          <div className="text-sm font-mono font-bold text-ink-100">50m</div>
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-wider text-ink-400">Width</div>
          <div className="text-sm font-mono font-bold text-ink-100">25m</div>
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-wider text-ink-400">Height</div>
          <div className="text-sm font-mono font-bold text-ink-100">10m</div>
        </div>
      </div>
    </div>
  );
}
