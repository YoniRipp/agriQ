import type { Sensor, Status } from '../types';

/**
 * Per-sensor status according to the assignment spec thresholds.
 *
 * Temperature: <30 OK,  30-45 Warning,  >45 Critical
 * Moisture:    <14% OK, 14-17% Warning, >17% Critical
 *
 * If either metric is in a worse range, the sensor takes that range
 * (the worse of the two wins). The combined temp+moisture danger is
 * handled at the PILE level via the risk engine (stages 3-4) rather
 * than at the per-sensor level — otherwise the four-level severity
 * scheme would collapse to two for any baseline-warm pile.
 */
export function sensorStatus(sensor: Sensor): Status {
  if (sensor.health === 'faulty') return 'warning'; // handled separately as maintenance
  const t = sensor.tempC;
  const m = sensor.moisturePct;
  const tStatus: Status = t >= 45 ? 'critical' : t >= 30 ? 'warning' : 'ok';
  const mStatus: Status = m >= 17 ? 'critical' : m >= 14 ? 'warning' : 'ok';
  const rank = { ok: 0, warning: 1, critical: 2, emergency: 3 };
  return rank[tStatus] >= rank[mStatus] ? tStatus : mStatus;
}

export const statusLabel: Record<Status, string> = {
  ok: 'OK',
  warning: 'Warning',
  critical: 'Critical',
  emergency: 'Emergency',
};

export const statusColor: Record<Status, { text: string; bg: string; border: string; dot: string; glow: string }> = {
  ok:        { text: 'text-ok',        bg: 'bg-ok/10',        border: 'border-ok/40',        dot: 'bg-ok',        glow: 'glow-ok' },
  warning:   { text: 'text-warn',      bg: 'bg-warn/10',      border: 'border-warn/40',      dot: 'bg-warn',      glow: 'glow-warn' },
  critical:  { text: 'text-crit',      bg: 'bg-crit/10',      border: 'border-crit/40',      dot: 'bg-crit',      glow: 'glow-crit pulse-crit' },
  emergency: { text: 'text-emergency', bg: 'bg-emergency/10', border: 'border-emergency/40', dot: 'bg-emergency', glow: 'glow-crit pulse-crit' },
};
