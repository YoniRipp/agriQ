import { Info } from 'lucide-react';

interface Props {
  length: number;
  width: number;
  height: number;
  tonnage: number;
  sensorCount: number;
}

/**
 * A side-profile visualization of the pile that communicates real-world scale
 * to the operator. A human silhouette at 1.75m is drawn at the same scale as
 * the pile, so the viewer immediately sees how large the storage cell is and
 * how sparse 30 sensors are across this volume.
 *
 * This is honest UX: showing the operator what the system can and cannot see
 * builds trust. It also mirrors the coverage-physics section of DESIGN.md.
 */
export default function ScaleDiagram({ length, width, height, tonnage, sensorCount }: Props) {
  const volume = length * width * height;
  const volumePerSensor = Math.round(volume / sensorCount);
  // Effective coverage: ~1 m radius per sensor → ~4 m³ each → small fraction
  const effectiveCoverage = ((sensorCount * 4) / volume * 100).toFixed(1);

  // SVG coordinate system: 1 unit = 1 meter
  // Side view: length (50m) × height (10m), plus a little margin
  const padX = 4;
  const padY = 3;
  const svgW = length + padX * 2;
  const svgH = height + padY * 2 + 2; // extra for baseline

  const humanHeight = 1.75;

  return (
    <div className="bg-ink-900 border border-ink-700 rounded-xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-ink-400">Storage cell</div>
          <h4 className="text-base font-bold text-ink-100">Physical dimensions</h4>
        </div>
        <div className="font-mono text-xs text-ink-300 text-right">
          <div>{length}m × {width}m × {height}m</div>
          <div className="text-ink-400">~{tonnage.toLocaleString()} tonnes · {volume.toLocaleString()} m³</div>
        </div>
      </div>

      {/* Side-profile SVG diagram */}
      <div className="bg-ink-950 border border-ink-700 rounded-lg p-3 mb-3">
        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="grain-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d4a84a" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#8b6914" stopOpacity="0.35" />
            </linearGradient>
            <pattern id="grain-texture" width="0.4" height="0.4" patternUnits="userSpaceOnUse">
              <circle cx="0.2" cy="0.2" r="0.08" fill="#d4a84a" fillOpacity="0.25" />
            </pattern>
          </defs>

          {/* Baseline (ground) */}
          <line
            x1={0}
            y1={padY + height}
            x2={svgW}
            y2={padY + height}
            stroke="#3b443e"
            strokeWidth="0.08"
          />

          {/* The pile — a rectangle representing the 50x10m side view */}
          <rect
            x={padX}
            y={padY}
            width={length}
            height={height}
            fill="url(#grain-fill)"
            stroke="#5c6660"
            strokeWidth="0.1"
            rx="0.2"
          />
          <rect
            x={padX}
            y={padY}
            width={length}
            height={height}
            fill="url(#grain-texture)"
          />

          {/* Layer dividers */}
          {[1 / 3, 2 / 3].map((frac, i) => (
            <line
              key={i}
              x1={padX}
              y1={padY + height * frac}
              x2={padX + length}
              y2={padY + height * frac}
              stroke="#5c6660"
              strokeWidth="0.06"
              strokeDasharray="0.4 0.4"
            />
          ))}

          {/* Layer labels inside the pile */}
          <text x={padX + 0.5} y={padY + height * (1/6) + 0.4} fontSize="0.8" fill="#8a938d" fontFamily="monospace">TOP</text>
          <text x={padX + 0.5} y={padY + height * (3/6) + 0.4} fontSize="0.8" fill="#8a938d" fontFamily="monospace">MID</text>
          <text x={padX + 0.5} y={padY + height * (5/6) + 0.4} fontSize="0.8" fill="#8a938d" fontFamily="monospace">BOT</text>

          {/* Sample sensor balls: 3 dots per layer for the side view */}
          {[1/6, 3/6, 5/6].map((yFrac) =>
            [0.25, 0.5, 0.75].map((xFrac, j) => (
              <circle
                key={`${yFrac}-${j}`}
                cx={padX + length * xFrac}
                cy={padY + height * yFrac}
                r="0.25"
                fill="#22c55e"
                opacity="0.85"
              />
            ))
          )}

          {/* Human silhouette next to the pile, drawn at real scale (1.75m) */}
          <g transform={`translate(${padX + length + 1}, ${padY + height - humanHeight})`}>
            {/* head */}
            <circle cx="0.4" cy="0.25" r="0.22" fill="#8a938d" />
            {/* body */}
            <rect x="0.15" y="0.48" width="0.5" height="0.85" rx="0.1" fill="#8a938d" />
            {/* legs */}
            <rect x="0.18" y="1.3" width="0.18" height="0.45" fill="#8a938d" />
            <rect x="0.44" y="1.3" width="0.18" height="0.45" fill="#8a938d" />
            <text x="0.85" y="1.1" fontSize="0.55" fill="#8a938d" fontFamily="monospace">1.75m</text>
          </g>

          {/* Height dimension arrow on left */}
          <g stroke="#5c6660" strokeWidth="0.07" fill="none">
            <line x1={padX - 0.6} y1={padY} x2={padX - 0.6} y2={padY + height} />
            <line x1={padX - 0.8} y1={padY} x2={padX - 0.4} y2={padY} />
            <line x1={padX - 0.8} y1={padY + height} x2={padX - 0.4} y2={padY + height} />
          </g>
          <text x={padX - 1.2} y={padY + height / 2 + 0.2} fontSize="0.7" fill="#8a938d" fontFamily="monospace" textAnchor="end">{height}m</text>

          {/* Length dimension arrow below */}
          <g stroke="#5c6660" strokeWidth="0.07" fill="none">
            <line x1={padX} y1={padY + height + 0.8} x2={padX + length} y2={padY + height + 0.8} />
            <line x1={padX} y1={padY + height + 0.6} x2={padX} y2={padY + height + 1.0} />
            <line x1={padX + length} y1={padY + height + 0.6} x2={padX + length} y2={padY + height + 1.0} />
          </g>
          <text x={padX + length / 2} y={padY + height + 1.7} fontSize="0.8" fill="#8a938d" fontFamily="monospace" textAnchor="middle">{length}m</text>
        </svg>
      </div>

      {/* Coverage info */}
      <div className="flex items-start gap-2 bg-ink-950 border border-ink-700 rounded-lg p-3">
        <Info className="w-4 h-4 text-ok mt-0.5 shrink-0" />
        <div className="text-xs text-ink-300 leading-relaxed">
          <div className="font-semibold text-ink-100 mb-0.5">Coverage reality check</div>
          Each of the {sensorCount} sensor balls reliably monitors roughly a 1-meter radius around itself.
          That's about <span className="font-mono text-ink-100">{volumePerSensor} m³</span> of grain per sensor,
          with effective detection coverage near{' '}
          <span className="font-mono text-ink-100">{effectiveCoverage}%</span> of the pile volume.
          The risk engine compensates by combining signals across sensors — cluster analysis, gradient detection,
          and trend tracking — rather than trusting any single reading.
        </div>
      </div>
    </div>
  );
}
