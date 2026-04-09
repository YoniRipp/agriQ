import type { Sensor } from '../types';
import { sensorStatus, statusColor } from '../lib/risk';
import { AlertTriangle } from 'lucide-react';

interface Props {
  layerLabel: string;
  layerSubtitle: string;
  sensors: Sensor[];
  onSensorClick?: (sensor: Sensor) => void;
  selectedSensorCode?: string;
}

/**
 * Renders one horizontal layer of the pile as a 50×25m floor plan,
 * with 10 sensor balls distributed across it.
 *
 * Layout: we arrange 10 sensors in a 5×2 grid (wide along the 50m axis,
 * two rows across the 25m axis). This mirrors roughly how you'd distribute
 * balls across the pile floor to maximize coverage.
 */
export default function SensorLayer({
  layerLabel,
  layerSubtitle,
  sensors,
  onSensorClick,
  selectedSensorCode,
}: Props) {
  return (
    <div className="bg-ink-900 border border-ink-700 rounded-xl p-4">
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-ink-400">{layerSubtitle}</div>
          <h4 className="text-base font-bold text-ink-100">{layerLabel}</h4>
        </div>
        <LayerSummary sensors={sensors} />
      </div>

      {/* The floor plan — 50m wide × 25m deep rectangle, aspect ratio 2:1 */}
      <div className="relative w-full rounded-lg bg-ink-950 border border-ink-700 overflow-hidden" style={{ aspectRatio: '2.5 / 1' }}>
        {/* Grid overlay for scale */}
        <svg className="absolute inset-0 w-full h-full opacity-20" preserveAspectRatio="none">
          <defs>
            <pattern id={`grid-${layerLabel}`} width="10%" height="20%" patternUnits="userSpaceOnUse">
              <path d="M 0 0 L 0 100" stroke="#5c6660" strokeWidth="0.5" fill="none" />
              <path d="M 0 0 L 100 0" stroke="#5c6660" strokeWidth="0.5" fill="none" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#grid-${layerLabel})`} />
        </svg>

        {/* Dimension labels */}
        <div className="absolute top-1.5 left-2 text-[9px] font-mono text-ink-400 uppercase tracking-wider pointer-events-none">
          50m
        </div>
        <div className="absolute top-1.5 right-2 text-[9px] font-mono text-ink-400 pointer-events-none">
          ← length →
        </div>
        <div className="absolute bottom-1.5 left-2 text-[9px] font-mono text-ink-400 uppercase tracking-wider pointer-events-none">
          25m width
        </div>

        {/* Sensor balls positioned in a 5×2 grid */}
        {/* Reorder so bottom-left is sensor 1 and top-right is sensor 10:
            Bottom row: sensors 0-4 (S01-S05, S11-S15, S21-S25)
            Top row: sensors 5-9 (S06-S10, S16-S20, S26-S30) */}
        <div className="absolute inset-0 grid grid-cols-5 grid-rows-2 p-4 gap-2">
          {[...sensors.slice(5), ...sensors.slice(0, 5)].map((s) => (
            <div key={s.code} className="relative flex items-center justify-center">
              <SensorBall
                sensor={s}
                onClick={() => onSensorClick?.(s)}
                isSelected={selectedSensorCode === s.code}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LayerSummary({ sensors }: { sensors: Sensor[] }) {
  const validSensors = sensors.filter(s => s.health !== 'faulty');
  const avgTemp = validSensors.length
    ? Math.round((validSensors.reduce((a, s) => a + s.tempC, 0) / validSensors.length) * 10) / 10
    : 0;
  const avgMoist = validSensors.length
    ? Math.round((validSensors.reduce((a, s) => a + s.moisturePct, 0) / validSensors.length) * 10) / 10
    : 0;

  return (
    <div className="flex gap-3 text-xs font-mono">
      <div>
        <span className="text-ink-400">avg </span>
        <span className="text-ink-100 font-bold">{avgTemp}°C</span>
      </div>
      <div>
        <span className="text-ink-400">avg </span>
        <span className="text-ink-100 font-bold">{avgMoist}%</span>
      </div>
    </div>
  );
}

function SensorBall({
  sensor,
  onClick,
  isSelected,
}: {
  sensor: Sensor;
  onClick?: () => void;
  isSelected?: boolean;
}) {
  const isFaulty = sensor.health === 'faulty';
  const status = sensorStatus(sensor);
  const colors = statusColor[status];

  return (
    <button
      onClick={onClick}
      className={`relative group rounded-full w-9 h-9 flex items-center justify-center font-mono text-[10px] font-bold border-2 transition-transform hover:scale-110 focus:outline-none ${
        isFaulty
          ? 'bg-ink-600 border-ink-400 text-ink-200'
          : `${colors.dot} ${colors.glow} border-ink-100/20 text-ink-950`
      } ${isSelected ? 'scale-110 ring-2 ring-ink-100 ring-offset-2 ring-offset-ink-950' : ''}`}
      aria-label={`Sensor ${sensor.code}: ${sensor.tempC}°C, ${sensor.moisturePct}% moisture`}
    >
      {isFaulty ? <AlertTriangle className="w-3.5 h-3.5" /> : sensor.code.replace('S', '')}

      {/* Hover tooltip */}
      <div className="absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg bg-ink-950 border border-ink-600 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible pointer-events-none whitespace-nowrap transition-opacity">
        <div className="font-bold text-ink-100 text-xs">{sensor.code}</div>
        {isFaulty ? (
          <div className="text-[10px] text-warn font-medium max-w-[180px] whitespace-normal">
            Faulty — readings excluded
          </div>
        ) : (
          <div className="text-[10px] text-ink-300 font-mono">
            {sensor.tempC}°C · {sensor.moisturePct}%
          </div>
        )}
      </div>
    </button>
  );
}
