# agriQ — Backend Architecture & Risk Logic

**Task 1 — Design Document** | Author: Jonathan (Yoni) Ripp | Facility: Harish 7, Emek Hefer Industrial Park

---

## 1. System Architecture

**Context.** One reading every 12h × 30 sensors × 4 piles = **240 readings/day/facility**. Even at 1,000 facilities this is ~3 readings/second — not a Big Data problem. The design avoids Kafka and microservices; instead it prioritizes **reliability under intermittent connectivity** (wireless sensors buried in grain) and **separating signal from noise in the risk engine**.

### Architecture Diagram

```
 ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐
 │ Sensor balls │───▶│ Cell gateway │───▶│  MQTT broker     │
 │  (S01–S30)   │    │  (LoRa/BLE)  │    │  (EMQX / HiveMQ) │
 └──────────────┘    └──────┬───────┘    └─────────┬────────┘
                            │                      │
                            ▼                      ▼
                    ┌──────────────┐      ┌────────────────┐
                    │  Gateway     │      │  Ingestion svc │
                    │  ambient T/H │      │  (Node.js/TS)  │
                    └──────────────┘      └────────┬───────┘
                                                   │ validate + persist
                                                   ▼
                                        ┌──────────────────────┐
  ┌───────────────┐    ┌───────────┐    │    PostgreSQL        │
  │ Weather API   │───▶│ Scheduled │───▶│  (readings,          │
  │ (Open-Meteo)  │    │ jobs      │    │   partitioned by     │
  └───────────────┘    │ (cron)    │    │   month)             │
  ┌───────────────┐    │           │    └──────────┬───────────┘
  │ CBOT prices   │───▶│           │               │
  └───────────────┘    └───────────┘               ▼
                                        ┌──────────────────────┐
                                        │   Risk engine        │
                                        │   (runs per reading  │
                                        │    + 12h batch)      │
                                        └──────────┬───────────┘
                                                   │
                              ┌────────────────────┼─────────────────┐
                              ▼                    ▼                 ▼
                      ┌──────────────┐   ┌──────────────┐   ┌───────────────┐
                      │  REST API    │   │  WebSocket   │   │  Notifications│
                      │  (Fastify)   │   │  (live push) │   │  Twilio / SES │
                      └──────┬───────┘   └──────┬───────┘   └───────────────┘
                             └───────┬──────────┘
                                     ▼
                           ┌───────────────────┐
                           │ Operator dashboard│
                           │  (React 19)       │
                           └───────────────────┘
```

### Why MQTT, not HTTP

Sensor balls are battery-powered and buried in grain. MQTT is the IoT standard: persistent TCP connections are cheaper than HTTPS handshakes, QoS levels 1 and 2 guarantee delivery, and the protocol natively supports offline buffering on the gateway. If the upstream link drops, readings queue locally and flush on reconnect — critical when downtime equals grain spoilage.

### Why PostgreSQL, not TimescaleDB

At 240 readings/day/facility, plain Postgres with monthly partitioning on `readings` and a compound index on `(sensor_id, recorded_at DESC)` handles years of history comfortably before specialization is needed. Postgres also gives `jsonb` flexibility, strong relational modeling, and a single database to operate. When scale demands it, migrating `readings` to TimescaleDB is a one-command hypertable conversion — we lose nothing by starting simple.

### Data Flow: Sensor to Alert

1. Sensor ball publishes every 12h; gateway adds ambient reading.
2. Ingestion service validates and writes to `readings` / `gateway_readings`.
3. On each write, fast-path checks run (absolute thresholds). A 12h batch job runs the full risk engine.
4. New/upgraded alerts written to `alerts` table, pushed to dashboards via WebSocket.
5. If severity ≥ `critical`, notification service sends SMS/email per operator on-call config.

### External Data Sources

- **Sensor ball readings** — temperature + moisture in-pile (primary signal).
- **Gateway readings** — ambient temp/humidity inside cell (baseline for differential analysis).
- **Weather API (Open-Meteo)** — 7-day forecast enables predictive alerts before conditions reach the pile.
- **CBOT prices** — future financial dashboards (not risk logic).
- **CO₂ sensor** (phase 2) — independent of spatial coverage, detects biological activity throughout pile.

---

## 2. Risk Logic

### The Coverage Problem

Grain is one of the best natural insulators known. Research from Iowa State University and classical work establish that a hot spot 1.8m away from a sensor may go completely undetected for 5+ weeks. A 50 × 25 × 10m cell is 12,500 m³; with 30 sensors that's one sensor per ~417 m³, giving **~1% effective coverage**. This is why agriQ's wireless ball approach exists (cables are worse). The risk engine cannot rely on any single sensor reading a scary number — it must **infer from sparse signals**.

### Five-Stage Risk Pipeline

**Stage 1 — Sensor health validation.** Before any reading influences risk calculations: physical impossibility checks (>8°C per 12h = likely failure), neighbor consistency (outliers flagged `suspect`), missing data (>24h silent = flagged). Suspect/faulty readings excluded from risk but generate maintenance alerts.

**Stage 2 — Absolute thresholds.** Spec baseline: temperature <30°C = OK, 30–45°C = Warning, >45°C = Critical. Moisture <14% = OK, 14–17% = Warning, >17% = Critical. Necessary but insufficient on sparse coverage — first hot spot to show up is already a fire risk.

**Stage 3 — Differential / gradient detection.** Industry-standard early warning: a 5.5°C differential between two sensors that should read similarly indicates active spoilage even when both are still in OK range. Computed three ways: (1) within-layer vs median; (2) between-layer trends (if middle becomes hottest, heat is internal, not from roof); (3) in-pile vs ambient (divergence = internal heat, highest-value signal).

**Stage 4 — Combined temperature + moisture risk score.** Per spec, high T and high M together are far more dangerous than either alone. Non-linear combined term: `risk = α·temp + β·moisture + γ·(temp × moisture)`. The multiplicative term turns "warning + warning" into "critical." Weights tunable per grain type, configuration-driven.

**Stage 5 — Temporal analysis.** Two parallel tracks: (a) **slow track** — 7-day rolling trend slope. Sustained ~1°C/day rise produces predictive warning, giving operators ~5 days to act. (b) **fast track** — sudden jumps (>5°C or >1.5% moisture in 12h) trigger immediate alert regardless of absolute value.

### Alert Classification

| Severity | Triggering condition |
|---|---|
| **Info** | Trend track firing; absolute still OK |
| **Warning** | ≥2 neighboring sensors in absolute Warning; OR within-layer gradient >5.5°C; OR pile-vs-ambient divergence |
| **Critical** | Any sensor in absolute Critical; OR cluster of 2+ in Warning on rising trend; OR risk score exceeds critical threshold |
| **Emergency** | ≥5 sensors in Critical; OR entire layer median in Critical; OR fast-track trigger on multiple sensors |

Each alert carries full context (which stage fired, which sensors, ambient at time, trend) so operators verify *why* before acting.

---

## 3. Tradeoffs & Limitations

### 3.1 Spatial coverage is fundamentally sparse

**Limitation.** ~99% of grain volume is outside any sensor's reliable detection radius. Small hot spots between sensors can grow for weeks before detection.

**Mitigations in design.** Stages 3 and 5 infer from patterns (gradient and trend slope) rather than individual readings, detecting problems in coverage gaps before absolute thresholds fire.

**Further mitigations.** CO₂ sensor per cell (phase 2 hardware); operator-facing coverage indicator in dashboard; periodic manual-inspection reminders.

### 3.2 12-hour reading frequency limits fast response

**Limitation.** Fast-moving events could develop meaningfully between readings.

**Trade-off.** Higher frequency drains sensor batteries proportionally; battery life is the hard constraint for wireless balls buried in grain.

**Mitigation.** Adaptive sampling: when Stage 5 detects rising trends, risk engine commands higher-frequency reads from affected sensors (e.g. every 2h). Battery preserved in steady state, spent when it matters.

### 3.3 Risk engine is rule-based, not learned

**Limitation.** A trained model (e.g., 3D-DenseNet) would outperform hand-tuned rules.

**Trade-off.** ML requires labeled historical data of piles that *did* spoil — agriQ doesn't have that yet. Shipping rules first is the only responsible option.

**Mitigation.** Log everything with full context; `alerts.context` is designed for future ML bootstrap.

### 3.4 Single-region deployment

**Limitation.** Creates a single point of failure.

**Trade-off.** Multi-region adds significant ops complexity and cost; for current scale (tens to hundreds of facilities), outage impact is "alerts delayed by hours" — serious but not catastrophic given grain's thermal inertia.

**Mitigation.** Gateway-level buffering means no data lost during cloud outage; readings queue locally and flush on reconnect. Health-check dashboard flags when any facility hasn't reported in expected window.

### 3.5 Alert fatigue is the silent killer

**Limitation.** If operators get too many alerts or false positives, they stop reading them. Product value collapses.

**Mitigations in design.** Stage 1's health validation prevents faulty sensors from generating noise. Stage 3's gradient analysis suppresses alerts when *everything* drifts together (weather, not a problem). Only four alert severity levels — Info alerts don't wake anyone up. Every alert has an explicit recommended action.
