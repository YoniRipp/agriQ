# agriQ — Operator Dashboard

Take-home assignment for agriQ. Frontend dashboard for grain storage operators monitoring wireless sensor balls distributed across wheat piles.

**Live mock facility:** Harish 7, Emek Hefer Industrial Park — 4 wheat piles × 30 sensors per pile across 3 layers (bottom, middle, top).

This repository contains both deliverables:

- **`DESIGN.md`** / **`DESIGN.pdf`** — Task 1: backend architecture design, risk logic, limitations and trade-offs.
- **`agriq-dashboard/`** — Task 2: the React 19 operator dashboard (this project).

---

## Quick start

Requirements: **Node.js 20.19+ or 22.12+** (Vite 6 requirement), npm 10+.

```bash
cd agriq-dashboard
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in a browser.

To build for production:

```bash
npm run build
npm run preview
```

---

## What you're looking at

The dashboard has two pages, accessible from the left sidebar:

### 1. Sites & Piles (`/sites`)

Shows all four piles as cards with current status, temperature, moisture, and a one-line headline written for a human operator. Click a pile to drill down into:

- **A side-profile scale diagram** of the pile with a human silhouette drawn to scale (1.75m next to the 10m-tall pile). This exists to give the operator a visceral sense of how large the cell is and — more importantly — how much grain sits between the 30 sensors. The card below the diagram makes that explicit: with 30 balls in a 12,500 m³ cell, each sensor effectively monitors ~1% of the volume.
- **Three floor plans** — one per layer (top, middle, bottom) — showing the 10 sensor balls of that layer on a 50 × 25 m grid. Sensors are color-coded by status. Click any sensor for its exact reading.
- **Sensor S28 in Emek East is intentionally faulty** (gray with a wrench icon). It's excluded from the pile risk score and gets its own maintenance alert on the Alerts page — which is the correct way to handle the "erratic readings, possible faulty sensor" edge case from the spec.

### 2. Alerts (`/alerts`)

Built for the operator who walks in and needs to act now. Alerts are sorted by severity (critical → warning), and each card answers the four questions an operator actually has:

1. **Which pile?** Pile name at the top.
2. **Which sensors?** Listed in monospace, always visible.
3. **What's the reading?** Displayed prominently in the top-right of each card.
4. **What do I do about it?** Recommended action in its own highlighted box.

Each alert also shows which stage of the risk engine detected it (Stage 1 health validation, Stage 2 absolute thresholds, Stage 3 cluster detection, Stage 4 combined score, Stage 5 trend analysis), so the operator — or the person debugging a false positive later — can trace the alert back to its logic.

---

## Design decisions

### Aesthetic: industrial control room

A dark theme with high-contrast status colors (green/amber/red) and a subtle grid background. Typography: **Manrope** for UI, **JetBrains Mono** for numeric readings. This isn't a consumer app — it's a tool that someone glances at under warehouse lighting while deciding whether to dispatch a technician. The visual language is closer to Bloomberg terminal than Linear.

### Human-first copy

Every headline, every alert title, and every recommended action is written the way you'd speak to a colleague, not the way a system logs events. Compare:

- ❌ `Sensor S14: 51°C, threshold exceeded`
- ✅ `Fire risk in middle layer — five sensors at 51°C / 18.4% moisture. Dispatch a technician immediately.`

This is the single most important thing about designing for non-technical users, and it matters more than any framework choice.

### Honest coverage communication

The scale diagram and its accompanying text do not hide the fact that the system cannot see everything inside the pile. Grain is an extreme thermal insulator — that's documented in the design doc — and a system that oversells its coverage will be distrusted the first time it's wrong. Telling the operator up front what the system can and cannot see builds the trust the product needs.

### Consistency with the design document

The risk engine stages referenced in every alert card (e.g., "Detected by: Stage 3 (cluster detection) + Stage 5 (rising trend)") match the 5-stage pipeline described in `DESIGN.md` exactly. The frontend and the backend design tell the same story.

---

## Project structure

```
agriq-dashboard/
├── src/
│   ├── main.tsx                  # entry
│   ├── App.tsx                   # router
│   ├── index.css                 # tailwind + custom
│   ├── types.ts                  # Pile, Sensor, Alert, Status
│   ├── data/
│   │   └── mockData.ts           # hardcoded facility + generated sensors
│   ├── lib/
│   │   └── risk.ts               # status classifier + color mapping
│   ├── components/
│   │   ├── Layout.tsx            # sidebar + main
│   │   ├── StatusBadge.tsx       # reusable status pill
│   │   ├── PileCard.tsx          # summary card on Sites page
│   │   ├── PileDetail.tsx        # drilldown view
│   │   ├── ScaleDiagram.tsx      # 50×25×10m visual with human for scale
│   │   ├── SensorLayer.tsx       # one layer's floor plan with 10 sensor balls
│   │   └── AlertCard.tsx         # big actionable alert card
│   └── pages/
│       ├── SitesPage.tsx
│       └── AlertsPage.tsx
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
└── tsconfig.json
```

---

## Tech stack

- **React 19** with TypeScript
- **Vite 6** for dev server and build
- **React Router 7** for navigation
- **Tailwind CSS 3** for styling (custom theme with ink/ok/warn/crit palettes)
- **Lucide React** for icons
- Fonts loaded from Google Fonts: Manrope + JetBrains Mono

No backend, no external API calls — all data is hardcoded in `src/data/mockData.ts` per the assignment brief.

---

## Author

Jonathan (Yoni) Ripp — Full-stack developer, Israel.
