import type { Site, Sensor, Layer, Alert } from '../types';

/**
 * Mock data for the Harish 7 facility.
 *
 * The assignment spec provides:
 *   Emek North — OK      — most 21°C / 12.5% — no problem sensors
 *   Emek South — Warning — most 28°C / 13.2% — S01-S04 bottom: 44°C / 16.1%
 *   Emek East  — Critical — most 26°C / 13.0% — S11-S15 middle: 51°C / 18.4%,
 *                                                S28 top: erratic (faulty)
 *   Emek West  — Warning — most 35°C / 14.8% — S06-S08 bottom: 39°C / 16.2%
 *
 * Each pile has 30 sensors: S01-S10 bottom, S11-S20 middle, S21-S30 top.
 * This data-generation function fills in every sensor according to the spec
 * rules, adding a little natural variation so the grids look realistic
 * rather than uniform.
 */

function layerOf(index: number): Layer {
  if (index < 10) return 'bottom';
  if (index < 20) return 'middle';
  return 'top';
}

function codeOf(index: number): string {
  return 'S' + String(index + 1).padStart(2, '0');
}

/** Tiny deterministic jitter so sensors don't all read identical values. */
function jitter(seed: number, magnitude: number): number {
  // simple LCG-style pseudo-random, deterministic per seed
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return ((x - Math.floor(x)) - 0.5) * 2 * magnitude;
}

interface PileDataSpec {
  baseTemp: number;
  baseMoisture: number;
  // Problem sensors: { indices: [...], temp, moisture, health?, note? }
  problems?: {
    indices: number[];
    temp: number;
    moisture: number;
    health?: 'active' | 'suspect' | 'faulty';
    note?: string;
  }[];
}

function buildSensors(spec: PileDataSpec, pileSeed: number): Sensor[] {
  const sensors: Sensor[] = [];
  for (let i = 0; i < 30; i++) {
    const code = codeOf(i);
    const layer = layerOf(i);
    // Default reading with small jitter
    let tempC = spec.baseTemp + jitter(pileSeed + i, 0.8);
    let moisturePct = spec.baseMoisture + jitter(pileSeed + i + 100, 0.2);
    let health: Sensor['health'] = 'active';
    let note: string | undefined;

    // Layer bias: top slightly warmer than bottom in warm weather (realistic)
    if (layer === 'top') tempC += 0.6;
    if (layer === 'bottom') tempC -= 0.4;

    // Apply problem overrides
    if (spec.problems) {
      for (const p of spec.problems) {
        if (p.indices.includes(i)) {
          tempC = p.temp + jitter(pileSeed + i + 200, 0.6);
          moisturePct = p.moisture + jitter(pileSeed + i + 300, 0.15);
          if (p.health) health = p.health;
          if (p.note) note = p.note;
        }
      }
    }

    sensors.push({
      code,
      layer,
      tempC: Math.round(tempC * 10) / 10,
      moisturePct: Math.round(moisturePct * 10) / 10,
      health,
      note,
    });
  }
  return sensors;
}

// Build each pile
const emekNorth = buildSensors({ baseTemp: 21, baseMoisture: 12.5 }, 1);

const emekSouth = buildSensors({
  baseTemp: 28,
  baseMoisture: 13.2,
  problems: [
    { indices: [0, 1, 2, 3], temp: 44, moisture: 16.1 }, // S01-S04
  ],
}, 2);

const emekEast = buildSensors({
  baseTemp: 26,
  baseMoisture: 13.0,
  problems: [
    { indices: [10, 11, 12, 13, 14], temp: 51, moisture: 18.4 }, // S11-S15
    { indices: [27], temp: 38.5, moisture: 9.2, health: 'faulty',
      note: 'Erratic readings — physically impossible delta since last cycle. Flagged for maintenance.' }, // S28
  ],
}, 3);

const emekWest = buildSensors({
  baseTemp: 35,
  baseMoisture: 14.8,
  problems: [
    { indices: [5, 6, 7], temp: 39, moisture: 16.2 }, // S06-S08
  ],
}, 4);

export const site: Site = {
  id: 'harish-7',
  name: 'Harish 7',
  address: 'Emek Hefer Industrial Park, Israel',
  piles: [
    {
      id: 'emek-north',
      name: 'Emek North',
      status: 'ok',
      grainType: 'Wheat',
      tonnage: 3000,
      dimensions: { length: 50, width: 25, height: 10 },
      sensors: emekNorth,
      summary: { tempC: 21, moisturePct: 12.5 },
      headline: 'All sensors reading within safe range. Grain is stable.',
    },
    {
      id: 'emek-south',
      name: 'Emek South',
      status: 'warning',
      grainType: 'Wheat',
      tonnage: 3000,
      dimensions: { length: 50, width: 25, height: 10 },
      sensors: emekSouth,
      summary: { tempC: 28, moisturePct: 13.2 },
      headline: 'Hot spot forming in the bottom layer (S01–S04). Monitor closely.',
    },
    {
      id: 'emek-east',
      name: 'Emek East',
      status: 'critical',
      grainType: 'Wheat',
      tonnage: 3000,
      dimensions: { length: 50, width: 25, height: 10 },
      sensors: emekEast,
      summary: { tempC: 26, moisturePct: 13.0 },
      headline: 'Critical hot spot in the middle layer (S11–S15). Fire risk — act immediately.',
    },
    {
      id: 'emek-west',
      name: 'Emek West',
      status: 'warning',
      grainType: 'Wheat',
      tonnage: 3000,
      dimensions: { length: 50, width: 25, height: 10 },
      sensors: emekWest,
      summary: { tempC: 35, moisturePct: 14.8 },
      headline: 'Elevated baseline temperature. Cluster in bottom layer (S06–S08) needs attention.',
    },
  ],
};

// Alerts derived from the above — these are what the operator sees on the Alerts page
const now = new Date();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600 * 1000);

export const alerts: Alert[] = [
  {
    id: 'a-east-critical',
    pileId: 'emek-east',
    pileName: 'Emek East',
    severity: 'critical',
    title: 'Fire risk in middle layer',
    detail:
      'Five sensors in the middle layer (S11–S15) have reached 51°C with 18.4% moisture — well above the critical thresholds. This combination indicates active biological activity and rising fire risk.',
    sensorsInvolved: ['S11', 'S12', 'S13', 'S14', 'S15'],
    reading: '51°C / 18.4% moisture',
    recommendedAction:
      'Dispatch a technician to the pile immediately. Begin aeration if available. Consider partial unloading from the middle layer to break up the hot zone. Do not wait for the next reading cycle.',
    triggeredAt: hoursAgo(4),
    stage: 'Stage 2 (absolute thresholds) + Stage 3 (cluster detection)',
  },
  {
    id: 'a-east-faulty',
    pileId: 'emek-east',
    pileName: 'Emek East',
    severity: 'warning',
    title: 'Sensor S28 needs maintenance',
    detail:
      'Sensor S28 in the top layer is producing erratic readings. The delta between consecutive readings is physically impossible in undisturbed grain, indicating a faulty sensor or a ball that has been disturbed. The sensor has been excluded from the pile risk score.',
    sensorsInvolved: ['S28'],
    reading: 'Unreliable',
    recommendedAction:
      'Flag for replacement at next scheduled maintenance. Pile-level monitoring is unaffected — other sensors in the top layer continue to operate normally.',
    triggeredAt: hoursAgo(9),
    stage: 'Stage 1 (sensor health validation)',
  },
  {
    id: 'a-south-warning',
    pileId: 'emek-south',
    pileName: 'Emek South',
    severity: 'warning',
    title: 'Bottom-layer cluster forming',
    detail:
      'Sensors S01–S04 in the bottom layer are reading 44°C with 16.1% moisture — above the warning threshold on both metrics simultaneously. The combined temperature + moisture risk score is elevated.',
    sensorsInvolved: ['S01', 'S02', 'S03', 'S04'],
    reading: '44°C / 16.1% moisture',
    recommendedAction:
      'Increase inspection frequency to every 6 hours for this pile. Check aeration system and ambient conditions. If trend continues for 48h, consider active cooling.',
    triggeredAt: hoursAgo(12),
    stage: 'Stage 3 (within-layer cluster) + Stage 4 (combined risk score)',
  },
  {
    id: 'a-west-warning',
    pileId: 'emek-west',
    pileName: 'Emek West',
    severity: 'warning',
    title: 'Elevated baseline — bottom cluster',
    detail:
      'Whole-pile baseline is 35°C / 14.8% — near the warning threshold. A bottom-layer cluster (S06–S08) is reading 39°C / 16.2%, trending upward over the last three readings.',
    sensorsInvolved: ['S06', 'S07', 'S08'],
    reading: '39°C / 16.2% moisture',
    recommendedAction:
      'Check ambient conditions and aeration. Verify the weather forecast — if a heatwave is incoming, plan to move this pile to cooler storage if possible.',
    triggeredAt: hoursAgo(18),
    stage: 'Stage 3 (cluster) + Stage 5 (rising trend)',
  },
];
