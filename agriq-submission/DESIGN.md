# agriQ — Backend Architecture & Risk Logic

**Task 1 — Design Document**
Author: Jonathan (Yoni) Ripp
Facility: Harish 7, Emek Hefer Industrial Park — 4 wheat piles × 30 sensors × 2 readings/day

---

## 1. Context & Scale

Before choosing a stack, it's worth grounding the design in the actual data volume. One reading every 12 hours × 30 sensors × 4 piles = **240 readings per day per facility**. Even at 1,000 facilities this is ~3 readings per second — small by modern standards. This is explicitly **not** a Big Data problem, and the design avoids the reflex to reach for Kafka, TimescaleDB, or microservices. Simple, reliable, and boring will serve agriQ better than distributed and clever.

The real engineering challenge is not throughput. It's **reliability under intermittent connectivity** (wireless balls buried in grain), **making sense of sparse spatial coverage** (more on this below), and **separating signal from noise in the risk engine**.

---

## 2. System Architecture

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

### Why MQTT and not HTTP

Sensor balls are battery-powered and buried in grain. MQTT is the IoT standard for a reason: persistent TCP connections are cheaper than repeated HTTPS handshakes, QoS levels 1 and 2 give delivery guarantees, and the protocol natively supports offline buffering on the gateway — if the upstream link drops, readings queue locally and flush when it returns. This is essential for a facility where downtime is measured in grain spoilage, not uptime SLAs.

### Why PostgreSQL (and not TimescaleDB)

At 240 readings/day/facility, a plain Postgres table with monthly partitioning on `readings` and a compound index on `(sensor_id, recorded_at DESC)` comfortably handles years of history for hundreds of facilities before a specialized time-series DB becomes justified. Postgres also gives us `jsonb` for flexible external-data storage, strong relational modeling for sites/piles/sensors, and a single database to operate. **When** scale eventually demands it, migrating the `readings` table to TimescaleDB is a one-command hypertable conversion — we lose nothing by starting simple.

### Database schema (core tables)

```sql
sites          (id, name, address, geo_lat, geo_lng, timezone)
piles          (id, site_id, name, grain_type, tonnage, dims_json, installed_at)
sensors        (id, pile_id, code, layer, position_x, position_y, position_z,
                status ENUM('active','suspect','faulty','retired'), installed_at)
readings       (id, sensor_id, recorded_at, temp_c, moisture_pct, battery_pct,
                rssi) -- PARTITIONED BY RANGE (recorded_at), monthly
gateway_rdgs   (id, pile_id, recorded_at, ambient_temp_c, ambient_humidity_pct)
external_data  (id, pile_id, source, recorded_at, payload JSONB)
alerts         (id, pile_id, severity, rule_fired, context JSONB, status,
                created_at, acknowledged_at, resolved_at, acknowledged_by)
users / sites_users  -- RBAC
```

The `alerts.context` JSONB field stores the reasoning snapshot — which sensors fired, which stage of the pipeline flagged it, slope values, the ambient temperature at the time. This is critical for operator trust: every alert can answer the question *"why did you wake me up?"*.

### Data flow: from sensor to alert

1. Sensor ball publishes `pile/{pile_id}/sensor/{sensor_code}` every 12h.
2. Gateway aggregates and forwards over MQTT, adding its own ambient reading.
3. Ingestion service validates schema, writes to `readings` / `gateway_readings`.
4. On each write, a lightweight check runs (fast path — hard thresholds). In parallel, a 12h batch job runs the full risk engine against the latest window.
5. New or upgraded alerts are written to `alerts` and pushed to connected dashboards via WebSocket.
6. If severity ≥ `critical`, the notification service sends SMS/email based on operator on-call config.

### External data sources

- **Sensor ball readings** — temperature + moisture in-pile (primary signal).
- **Gateway readings** — ambient temp/humidity inside the cell but outside the pile. Essential baseline for differential analysis (see §3.3).
- **Weather API (Open-Meteo or similar)** — current + **7-day forecast** for Emek Hefer. Forecast is the important part: an incoming heatwave plus already-elevated moisture enables *predictive* alerts days before conditions reach the pile.
- **CBOT commodity prices** — for future financial dashboards (not risk logic). Pulled daily.
- **Proposed additional source: CO₂ concentration from a cell-level sensor.** Per Iowa State University grain-storage research, CO₂ from insect and mold respiration rises measurably *before* temperature does, because grain is such a strong thermal insulator. Even one CO₂ sensor per cell would materially improve early detection. Recommended as a phase-2 hardware addition.

### Where ERP and commodity integration fit later

The ingestion service and risk engine are deliberately **decoupled** from outbound integrations. When ERP integration (SAP, Priority, Oracle) lands, it slots in as an additional consumer of the REST API or as a subscriber to a new `events` topic on the same MQTT broker — no changes to the core pipeline. CBOT-driven pricing logic (e.g., "this pile is worth $X, risk score is Y, insurance recommendation is Z") lives as a separate service that joins `piles` with `external_data` — again, zero coupling to the core.

---

## 3. Risk Logic

The hardest requirement in this assignment is **not** computing thresholds — it's building logic that a grain operator will actually trust and act on. An alert ignored is worse than no alert at all. The design below reflects how this is actually done in the grain-storage research literature and industry practice.

### 3.0 The coverage problem (why the logic has to be smart)

This is worth stating upfront because it drives every decision below.

Grain is one of the best natural thermal insulators known. Research from Iowa State University (Maier et al., 2022) and classical work by Singh et al. (1983) establish that:

- A hot spot **0.9 m** from a sensor takes ~2 weeks to register even a **0.1°C** change.
- A hot spot **1.8 m** or more from a sensor may go **completely undetected for 5+ weeks**, during which the actual hot spot can rise by 15°C or more.
- The academically ideal sensor spacing for reliable early detection is **~0.5 m** — impossible in practice.

A 50 × 25 × 10 m cell is **12,500 m³**. With 30 sensors, that's one sensor per ~417 m³, giving an effective "sees clearly" coverage on the order of **1% of pile volume**. This is not an agriQ weakness — this is the fundamental physics of monitoring stored grain, and it is exactly why agriQ's wireless ball approach exists (cables are even worse: they cover lines, not volumes). But it does mean the risk engine cannot rely on any single sensor reading a scary number. It has to **infer** from sparse signals.

The five-stage pipeline below is designed around that constraint.

### 3.1 Stage 1 — Sensor health validation

Before a reading influences any risk calculation, we ask: *do we believe this sensor right now?*

- **Physical impossibility check.** Bulk wheat is thermally inert. A change of more than ~8°C between two consecutive 12-hour readings from the same sensor is not physically possible in undisturbed grain — it's almost certainly electronics failure or a ball that was disturbed. Flag as `faulty`.
- **Neighbor consistency.** Compare each sensor against the other 9 sensors in its layer. If a sensor consistently deviates by >X standard deviations across 3+ readings while its neighbors remain stable, flag as `suspect`.
- **Missing data.** A sensor silent for >24h (two missed readings) is flagged `suspect`.

Suspect/faulty readings are **excluded from risk calculations** but **generate their own maintenance alert** ("Sensor S28 producing erratic readings — inspect"). This is the S28 case the mock data intentionally plants: it must not be silenced, and it must not poison the pile-level risk score.

### 3.2 Stage 2 — Absolute thresholds (the baseline check)

This is the spec-provided baseline: temperature and moisture ranges produce `OK` / `Warning` / `Critical` per sensor. Necessary, but insufficient on its own — on sparse coverage, the first hot spot to show up in absolute terms is already a developed fire risk. We need earlier signals.

### 3.3 Stage 3 — Differential / gradient detection

This is the industry-standard early-warning method, and it's the stage where most candidates' designs stop being generic and start being informed. Per the grain-monitoring literature, **a differential exceeding ~5.5°C between two sensors that should read similarly indicates active spoilage — even when both sensors are still in the "OK" absolute range.**

Three differentials are computed on every risk pass:

1. **Within-layer gradient.** Each sensor vs the median of the other 9 in its layer. Large deviations = localized hot spot forming.
2. **Between-layer gradient.** Layer medians vs each other. Normal behavior is top > middle > bottom in warm weather (heat from roof + ambient). If the *middle* layer becomes the hottest, that's an anomaly — it means heat is being generated inside the pile rather than entering from outside.
3. **In-pile vs ambient gradient.** Pile median vs gateway ambient reading. If the pile is tracking ambient, conditions are externally driven (manageable). If the pile is diverging *upward* from ambient, the heat is internal — spoilage or biological activity. This is the single most powerful early signal in the system.

### 3.4 Stage 4 — Combined temperature + moisture risk score

The spec explicitly warns that high temperature and high moisture together are far more dangerous than either alone. The risk score reflects this as a non-linear combined term:

```
risk = α · temp_score + β · moisture_score + γ · (temp_score × moisture_score)
```

The multiplicative term is the key — it's what turns "warning + warning" into "critical" rather than "warning + warning = still warning." Weights α, β, γ are tunable per grain type (wheat vs corn vs soybeans have different spoilage curves) and stored as configuration, not hard-coded.

### 3.5 Stage 5 — Temporal analysis (gradual vs sudden)

Two parallel tracks, deliberately different:

- **Slow track — rolling trend.** On each sensor, compute the slope of temperature and moisture over a 7-day rolling window. A sustained rise of ~1°C/day, even while absolute values remain in the `OK` range, produces a **predictive warning** — "this sensor is on a trajectory that will reach Warning in ~5 days." This is the most valuable alert type from an operator's perspective because it buys time.
- **Fast track — sudden change.** Any sensor whose reading jumps >5°C or whose moisture jumps >1.5% in a single 12h interval triggers an immediate alert regardless of absolute value. The fast track exists because real spoilage events can accelerate nonlinearly once they start.

### 3.6 Alert classification

Outputs from stages 2–5 feed into a small rule set:

| Severity | Triggering condition (any of) |
|---|---|
| **Info** | Trend track firing; absolute still OK |
| **Warning** | ≥2 neighboring sensors in absolute Warning; OR within-layer gradient >5.5°C; OR pile-vs-ambient divergence |
| **Critical** | Any sensor in absolute Critical; OR cluster of 2+ in Warning on a rising trend; OR risk score > critical threshold |
| **Emergency** | ≥5 sensors in Critical; OR an entire layer median in Critical; OR fast-track trigger on multiple sensors |

Each alert carries its full `context` (which stage fired, which sensors, what the ambient was, what the trend looked like) so operators can verify *why* before acting.

---

## 4. Limitations & Trade-offs

Stating these explicitly is how this design earns operator trust. A system that pretends to be omniscient will be distrusted the first time it's wrong.

### 4.1 Spatial coverage is fundamentally sparse

**Limitation.** Even with 30 sensors per pile, ~99% of the grain volume is outside any sensor's reliable detection radius. A small, isolated hot spot between sensors can grow for weeks before any single sensor sees it.

**Mitigations already in the design.** Stages 3 and 5 compensate by inferring from *patterns*, not individual readings — gradient divergence and trend slope fire before absolute thresholds do, which is how the system detects problems in the coverage gaps.

**Further mitigations worth adding.**

- **CO₂ sensor per cell** (phase 2 hardware). Independent of spatial coverage — detects biological activity throughout the pile via the gaseous byproducts.
- **Operator-facing coverage indicator** in the dashboard. Show plainly what the system can and cannot see, so the operator's mental model is calibrated.
- **Periodic manual-inspection reminders** triggered by the system when certain regions have had no notable readings for a long time — "you haven't heard from the middle layer of Emek North in a month, worth a physical check."

### 4.2 12-hour reading frequency limits fast-response capability

**Limitation.** Spec-defined cadence. A fast-moving event (e.g. a cable fault starting a localized hot zone) could develop meaningfully between readings.

**Trade-off.** Higher frequency drains sensor batteries proportionally. Battery life is the hard constraint for wireless balls buried in grain — you can't replace them without emptying the pile.

**Mitigations.**

- **Adaptive sampling.** When Stage 5 detects rising trends, the risk engine can command the gateway to request higher-frequency readings from the affected sensors (e.g. every 2h instead of 12h). Battery life is preserved in steady state and spent only when it matters.
- **Gateway-level ambient sensing** remains continuous (wall-powered) and provides a high-frequency baseline independent of ball battery constraints.

### 4.3 Risk engine is rule-based, not learned

**Limitation.** A trained model (e.g. the 3D-DenseNet approach in recent grain-storage literature, able to forecast mildew events ~5 days ahead) would almost certainly outperform hand-tuned rules.

**Trade-off.** ML requires labeled training data — specifically, historical readings from piles that *did* spoil, labeled as such. agriQ doesn't have that yet. Shipping rules first is the only responsible option. Every alert the system fires, and every operator response to it (acknowledged / dismissed / resolved), is training data for a future model.

**Mitigation.** Log everything with enough context that a future ML pipeline can bootstrap off it. `alerts.context` is designed for exactly this.

### 4.4 Single-region deployment

**Limitation.** A single-region cloud deployment creates a single point of failure.

**Trade-off.** Multi-region adds significant ops complexity and cost. For the current scale (tens to hundreds of facilities), the blast radius of a regional outage is "alerts delayed by hours" — serious but not catastrophic given grain's thermal inertia.

**Mitigation.** Gateway-level buffering means no data is lost during a cloud outage — readings queue locally and flush on reconnect. A health-check dashboard internal to agriQ flags when any facility hasn't reported in the expected window, so the operations team can act before customers notice.

### 4.5 Alert fatigue is the silent killer of monitoring systems

**Limitation.** If operators get too many alerts, or too many false positives, they stop reading them. The entire product value collapses.

**Mitigations baked into the design.**

- Stage 1's health validation prevents faulty sensors from generating noise.
- Stage 3's gradient analysis is specifically designed to suppress alerts when *everything* is drifting together (that's the weather, not a problem).
- Alert severity has only four levels, deliberately — Info alerts don't wake anyone up, they accumulate on the dashboard for when the operator checks it.
- Every alert has an explicit recommended action. An alert the operator can't act on is worse than silence.

---

## 5. Summary

The design is deliberately conservative on infrastructure (plain Postgres, MQTT, Node.js, cron) and deliberately thoughtful on the risk engine, because that's where the product's real value sits. The five-stage pipeline handles the cases the spec asks about — sensor faults, gradual vs sudden change, multi-sensor consensus — and the stated limitations reflect genuine engineering trade-offs, not oversights. Everything here is built to be operated by a small team and trusted by a non-technical grain operator.
