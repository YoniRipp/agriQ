import type { Sensor } from '../types';
import { sensorStatus, statusColor } from '../lib/risk';
import { AlertTriangle, Thermometer, Droplets, Wrench } from 'lucide-react';

interface Props {
  layerLabel: string;
  layerSubtitle: string;
  sensors: Sensor[];
  onSensorClick?: (sensor: Sensor) => void;
  selectedSensorCode?: string;
}

/**
 * Renders one horizontal layer of the pile as a floor plan,
 * with 10 sensor balls in a 5×2 grid.
 *
 * Numbering: bottom-left is the lowest sensor number, top-right is the highest.
 * S01-S05 appear in the bottom row, S06-S10 in the top row.
 */
export default function SensorLayer({
  layerLabel,
  layerSubtitle,
  sensors,
  onSensorClick,
  selectedSensorCode,
}: Props) {
  const faultyCount = sensors.filter(s => s.health === 'faulty').length;
  const pileIssueCount = sensors.filter(s => s.health !== 'faulty' && sensorStatus(s) !== 'ok').length;

  return (
    <div className="bg-ink-900 border border-ink-700 rounded-xl p-4">
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-ink-400">{layerSubtitle}</div>
          <h4 className="text-base font-bold text-ink-100">{layerLabel}</h4>
        </div>
        <LayerSummary sensors={sensors} />
      </div>

      {/* Floor plan */}
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

        {/* Sensor balls in a 5×2 grid — bottom-left S01, top-right S10 */}
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

      {/* Legend + status counts */}
      <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
        <div className="flex items-center gap-3 text-[10px] text-ink-400">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-ok inline-block" />
            OK
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-warn inline-block" />
            Pile warning
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-crit inline-block" />
            Pile critical
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-ink-600 inline-block" />
            Sensor fault
          </span>
        </div>
        {(pileIssueCount > 0 || faultyCount > 0) && (
          <div className="flex gap-2 text-[10px] font-mono">
            {pileIssueCount > 0 && (
              <span className="text-warn font-semibold">
                {pileIssueCount} pile {pileIssueCount === 1 ? 'issue' : 'issues'}
              </span>
            )}
            {faultyCount > 0 && (
              <span className="text-ink-400">
                {faultyCount} sensor {faultyCount === 1 ? 'fault' : 'faults'}
              </span>
            )}
          </div>
        )}
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
      <div className="flex items-center gap-1">
        <Thermometer className="w-3 h-3 text-ink-400" />
        <span className="text-ink-400">avg</span>
        <span className="text-ink-100 font-bold">{avgTemp}°C</span>
      </div>
      <div className="flex items-center gap-1">
        <Droplets className="w-3 h-3 text-ink-400" />
        <span className="text-ink-400">avg</span>
        <span className="text-ink-100 font-bold">{avgMoist}% moisture</span>
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

  const tooltipLabel = isFaulty
    ? 'Sensor fault — hardware issue, readings excluded from risk'
    : status !== 'ok'
    ? `Pile condition: ${status.toUpperCase()} — ${sensor.tempC}°C · ${sensor.moisturePct}% moisture`
    : `${sensor.tempC}°C · ${sensor.moisturePct}% moisture`;

  return (
    <button
      onClick={onClick}
      className={`relative group rounded-full w-9 h-9 flex items-center justify-center font-mono text-[10px] font-bold border-2 transition-transform hover:scale-110 focus:outline-none ${
        isFaulty
          ? 'bg-ink-600 border-ink-400 text-ink-200'
          : `${colors.dot} ${colors.glow} border-ink-100/20 text-ink-950`
      } ${isSelected ? 'scale-110 ring-2 ring-ink-100 ring-offset-2 ring-offset-ink-950' : ''}`}
      aria-label={`Sensor ${sensor.code}: ${tooltipLabel}`}
    >
      {isFaulty ? <Wrench className="w-3.5 h-3.5" /> : sensor.code.replace('S', '')}

      {/* Hover tooltip */}
      <div className="absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg bg-ink-950 border border-ink-600 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible pointer-events-none whitespace-nowrap transition-opacity">
        <div className="font-bold text-ink-100 text-xs">{sensor.code}</div>
        {isFaulty ? (
          <div className="text-[10px] text-ink-400 font-medium flex items-center gap-1">
            <Wrench className="w-3 h-3" />
            Sensor fault — readings excluded
          </div>
        ) : status !== 'ok' ? (
          <>
            <div className={`text-[10px] font-semibold uppercase tracking-wider mb-0.5 ${colors.text}`}>
              Pile condition: {status}
            </div>
            <div className="text-[10px] text-ink-300 font-mono">
              {sensor.tempC}°C · {sensor.moisturePct}% moisture
            </div>
          </>
        ) : (
          <div className="text-[10px] text-ink-300 font-mono">
            {sensor.tempC}°C · {sensor.moisturePct}% moisture
          </div>
        )}
      </div>
    </button>
  );
}
