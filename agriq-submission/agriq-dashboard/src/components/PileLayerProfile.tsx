import { Layers } from 'lucide-react';

/**
 * Shows a vertical cross-section of the pile with all 3 layers labeled with height ranges.
 * The pile is 10m high, divided into 3 layers of ~3.3m each.
 */
export default function PileLayerProfile() {
  const layers = [
    { name: 'Top layer', sensors: 'S21–S30', height: '6.7–10m' },
    { name: 'Middle layer', sensors: 'S11–S20', height: '3.3–6.7m' },
    { name: 'Bottom layer', sensors: 'S01–S10', height: '0–3.3m' },
  ];

  return (
    <div className="bg-ink-900 border border-ink-700 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Layers className="w-4 h-4 text-ink-400" />
        <div className="text-[10px] uppercase tracking-widest text-ink-400">Pile cross-section</div>
      </div>

      {/* Vertical cross-section diagram */}
      <div className="flex gap-2 items-end">
        {/* Height ruler on the left */}
        <div className="flex flex-col justify-between text-[9px] text-ink-400 font-mono pr-2 select-none" style={{ height: '180px' }}>
          <span>10m</span>
          <span>6.7m</span>
          <span>3.3m</span>
          <span>0m</span>
        </div>

        {/* Layer boxes */}
        <div className="flex gap-2 flex-1" style={{ height: '180px' }}>
          {layers.reverse().map((layer, idx) => (
            <div
              key={layer.name}
              className="flex-1 border border-ink-600 rounded-lg bg-ink-950 p-2 flex flex-col justify-center items-center relative group hover:border-ink-500 transition"
              style={{
                borderLeft: idx === 0 ? '3px solid #a1ff00' : idx === 1 ? '3px solid #ffb400' : '3px solid #ff4444',
              }}
            >
              <div className="text-[9px] font-bold text-ink-100 text-center leading-tight">
                {layer.name}
              </div>
              <div className="text-[8px] text-ink-400 mt-1 font-mono">{layer.sensors}</div>
              <div className="text-[8px] text-ink-500 mt-0.5">{layer.height}</div>

              {/* Hover tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded bg-ink-950 border border-ink-600 opacity-0 invisible group-hover:opacity-100 group-hover:visible pointer-events-none whitespace-nowrap text-[8px] text-ink-300 z-10">
                {layer.name}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pile dimensions summary */}
      <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-ink-700">
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
