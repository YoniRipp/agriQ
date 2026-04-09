export type Status = 'ok' | 'warning' | 'critical' | 'emergency';
export type Layer = 'bottom' | 'middle' | 'top';
export type SensorHealth = 'active' | 'suspect' | 'faulty';

export interface Sensor {
  code: string;           // "S01"..."S30"
  layer: Layer;
  tempC: number;
  moisturePct: number;
  health: SensorHealth;
  note?: string;          // e.g. "erratic readings, possible faulty sensor"
}

export interface Pile {
  id: string;
  name: string;
  status: Status;
  grainType: string;
  tonnage: number;
  dimensions: { length: number; width: number; height: number }; // meters
  sensors: Sensor[];
  summary: { tempC: number; moisturePct: number };
  // human-readable description of the current state
  headline: string;
}

export interface Site {
  id: string;
  name: string;
  address: string;
  piles: Pile[];
}

export interface Alert {
  id: string;
  pileId: string;
  pileName: string;
  severity: Status;
  title: string;
  detail: string;
  sensorsInvolved: string[];
  reading: string;            // e.g. "51°C / 18.4% moisture"
  recommendedAction: string;
  triggeredAt: Date;
  stage: string;              // which stage of the risk engine fired (for traceability)
}
