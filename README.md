# agriQ — Take-Home Assignment Submission

**Author:** Jonathan (Yoni) Ripp
**Date:** April 2026

This repository contains both deliverables for the agriQ Full Stack Developer take-home assignment.

## Contents

- **`DESIGN.md`** / **`DESIGN.pdf`** — Task 1: backend architecture and risk-logic design document.
- **`agriq-dashboard/`** — Task 2: React 19 + TypeScript operator dashboard.

## Task 1 — Backend architecture

A 5-page design document covering:

1. System architecture with diagram (MQTT → Node.js → PostgreSQL → REST/WebSocket → React)
2. Database schema and data flow
3. External data sources (sensors, gateway, weather API, CBOT, proposed CO₂)
4. ERP and commodity-market integration approach
5. **5-stage risk engine** designed around the realities of grain monitoring:
   - Stage 1: sensor health validation (faulty / suspect detection)
   - Stage 2: absolute thresholds (the spec baseline)
   - Stage 3: differential / gradient detection (the industry-standard early warning)
   - Stage 4: combined temperature + moisture risk score
   - Stage 5: temporal analysis (gradual vs sudden change)
6. **Coverage physics section** grounded in Iowa State University grain-storage research, explaining why the risk logic has to be smart about sparse spatial coverage.
7. **Limitations and trade-offs**, each paired with concrete mitigations.

Read `DESIGN.pdf` for the rendered version, or `DESIGN.md` for the source.

## Task 2 — Operator dashboard

See `agriq-dashboard/README.md` for full details and run instructions.

```bash
cd agriq-dashboard
npm install
npm run dev
# open http://localhost:5173
```

The dashboard has two pages:

- **Sites & Piles** — overview of all four wheat piles with status, temperature, moisture, and a drilldown to a per-pile detail view showing three layers of sensor balls with interactive tooltips. Faulty sensors are visually distinct from real pile conditions.
- **Alerts** — sorted by severity, each card answers the four questions an operator actually has: which pile, which sensors, what the reading is, and what to do next. Each alert is also traceable to the specific stage of the risk engine that detected it.

Built with React 19, TypeScript, Vite 6, Tailwind CSS, and React Router 7.
