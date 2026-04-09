import { useState } from 'react';
import type { Pile, Sensor } from '../types';
import SensorLayer from './SensorLayer';
import ScaleDiagram from './ScaleDiagram';
import StatusBadge from './StatusBadge';
import { X, Thermometer, Droplets, Wrench } from 'lucide-react';

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
      <div className="flex items-start justify-between bg-ink-900 border border-ink-700 rounded-xl p-5">
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

      {/* Scale diagram — shows physical size with human for comparison */}
      <ScaleDiagram
        length={pile.dimensions.length}
        width={pile.dimensions.width}
        height={pile.dimensions.height}
        tonnage={pile.tonnage}
        sensorCount={pile.sensors.length}
      />

      {/* Selected sensor detail panel */}
      {selectedSensor && <SensorDetail sensor={selectedSensor} onClose={() => setSelectedSensor(null)} />}

      {/* Three layers — top first (the operator looks down into the pile) */}
      <div className="space-y-4">
        <SensorLayer
          layerLabel="Top layer"
          layerSubtitle="S21 – S30"
          sensors={top}
          onSensorClick={handleSensorClick}
          selectedSensorCode={selectedSensor?.code}
        />
        <SensorLayer
          layerLabel="Middle layer"
          layerSubtitle="S11 – S20"
          sensors={middle}
          onSensorClick={handleSensorClick}
          selectedSensorCode={selectedSensor?.code}
        />
        <SensorLayer
          layerLabel="Bottom layer"
          layerSubtitle="S01 – S10"
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
        <div className="flex items-start gap-3 bg-warn/10 border border-warn/40 rounded-lg p-3">
          <Wrench className="w-4 h-4 text-warn mt-0.5 shrink-0" />
          <div className="text-sm text-ink-200">
            <div className="font-semibold text-warn mb-1">Faulty sensor — readings excluded</div>
            {sensor.note ?? 'This sensor has been flagged as faulty and is excluded from risk calculations.'}
          </div>
        </div>
      ) : (
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
      )}
    </div>
  );
}
