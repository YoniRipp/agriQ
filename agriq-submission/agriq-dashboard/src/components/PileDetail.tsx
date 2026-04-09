import { useState } from 'react';
import type { Pile, Sensor } from '../types';
import SensorLayer from './SensorLayer';
import StatusBadge from './StatusBadge';
import { X, Thermometer, Droplets, Wrench, AlertTriangle } from 'lucide-react';
import { sensorStatus, statusColor } from '../lib/risk';

export default function PileDetail({ pile, onClose }: { pile: Pile; onClose: () => void }) {
  const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);

  const top = pile.sensors.filter(s => s.layer === 'top');
  const middle = pile.sensors.filter(s => s.layer === 'middle');
  const bottom = pile.sensors.filter(s => s.layer === 'bottom');

  const handleSensorClick = (s: Sensor) => {
    setSelectedSensor(prev => (prev?.code === s.code ? null : s));
  };

  return (
    <div className="fade-up space-y-4">
      {/* Header */}
      <div className="bg-ink-900 border border-ink-700 rounded-xl p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-ink-400 mb-1">Pile detail</div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-extrabold text-ink-100 tracking-tight">{pile.name}</h2>
              <StatusBadge status={pile.status} />
            </div>
            <p className="text-sm text-ink-200 mt-2 max-w-2xl">{pile.headline}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg border border-ink-700 text-ink-300 hover:text-ink-100 hover:border-ink-500 transition"
            aria-label="Close detail"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Readings + meta row */}
        <div className="flex items-center gap-6 pt-4 border-t border-ink-700">
          <div className="flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-ink-400" />
            <span className="font-mono text-xl font-bold text-ink-100">{pile.summary.tempC}°C</span>
          </div>
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-ink-400" />
            <span className="font-mono text-xl font-bold text-ink-100">{pile.summary.moisturePct}%</span>
            <span className="text-xs text-ink-400">moisture</span>
          </div>
          <div className="text-xs text-ink-400 ml-auto">
            {pile.grainType} · {pile.tonnage.toLocaleString()} tonnes · {pile.dimensions.length}m × {pile.dimensions.width}m × {pile.dimensions.height}m
          </div>
        </div>
      </div>

      {/* Selected sensor detail panel */}
      {selectedSensor && <SensorDetail sensor={selectedSensor} onClose={() => setSelectedSensor(null)} />}

      {/* Three layers — shown with explicit height ranges and dimensions */}
      <div className="space-y-4">
        <SensorLayer
          layerLabel="Top layer"
          layerSubtitle="S21 – S30"
          heightRange="6.7–10m"
          sensors={top}
          onSensorClick={handleSensorClick}
          selectedSensorCode={selectedSensor?.code}
        />
        <SensorLayer
          layerLabel="Middle layer"
          layerSubtitle="S11 – S20"
          heightRange="3.3–6.7m"
          sensors={middle}
          onSensorClick={handleSensorClick}
          selectedSensorCode={selectedSensor?.code}
        />
        <SensorLayer
          layerLabel="Bottom layer"
          layerSubtitle="S01 – S10"
          heightRange="0–3.3m"
          sensors={bottom}
          onSensorClick={handleSensorClick}
          selectedSensorCode={selectedSensor?.code}
        />
      </div>
    </div>
  );
}

function SensorDetail({ sensor, onClose }: { sensor: Sensor; onClose: () => void }) {
  const isFaulty = sensor.health === 'faulty';
  const status = sensorStatus(sensor);
  const colors = statusColor[status];
  const hasPileIssue = !isFaulty && status !== 'ok';

  return (
    <div className="bg-ink-900 border-2 border-ink-600 rounded-xl p-5 fade-up">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-ink-400">Sensor</div>
          <h3 className="text-xl font-extrabold text-ink-100 tracking-tight font-mono">{sensor.code}</h3>
          <div className="text-xs text-ink-400 mt-0.5 uppercase">{sensor.layer} layer</div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded text-ink-400 hover:text-ink-100 transition"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {isFaulty ? (
        /* Sensor hardware fault — not a pile problem */
        <div className="flex items-start gap-3 bg-ink-800 border border-ink-600 rounded-lg p-3">
          <Wrench className="w-4 h-4 text-ink-300 mt-0.5 shrink-0" />
          <div className="text-sm text-ink-200">
            <div className="font-semibold text-ink-100 mb-1">Sensor hardware fault</div>
            <div className="text-ink-400 text-xs mb-1">This is a hardware issue, not a pile condition. Readings are excluded from risk calculations.</div>
            {sensor.note && <div className="text-ink-300 text-xs">{sensor.note}</div>}
          </div>
        </div>
      ) : (
        <>
          {/* Pile condition banner if flagged */}
          {hasPileIssue && (
            <div className={`flex items-center gap-2 rounded-lg px-3 py-2 mb-3 border ${colors.border} ${colors.bg}`}>
              <AlertTriangle className={`w-4 h-4 shrink-0 ${colors.text}`} />
              <span className={`text-xs font-bold uppercase tracking-wider ${colors.text}`}>
                Pile condition: {status} — this reading indicates a real problem in the grain
              </span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-ink-950 border border-ink-700 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-ink-400 mb-1">
                <Thermometer className="w-3 h-3" />
                Temperature
              </div>
              <div className="font-mono text-2xl font-bold text-ink-100">
                {sensor.tempC}
                <span className="text-base text-ink-400 ml-0.5">°C</span>
              </div>
            </div>
            <div className="bg-ink-950 border border-ink-700 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-ink-400 mb-1">
                <Droplets className="w-3 h-3" />
                Moisture
              </div>
              <div className="font-mono text-2xl font-bold text-ink-100">
                {sensor.moisturePct}
                <span className="text-base text-ink-400 ml-0.5">%</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
