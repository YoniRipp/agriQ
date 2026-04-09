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

- **Three floor plans** — one per layer (top, middle, bottom) — showing the 10 sensor balls of that layer on a 50 × 25 m grid with explicit height ranges (0–3.3m, 3.3–6.7m, 6.7–10m). Sensors are color-coded by status. Click any sensor for its exact reading.
- **Faulty vs pile condition distinction** — Sensor S28 in Emek East is intentionally faulty (gray with a wrench icon). It's excluded from the pile risk score and gets its own maintenance alert — which is the correct way to handle the "erratic readings, possible faulty sensor" edge case from the spec. Orange sensors indicate a real pile condition, gray sensors indicate hardware issues.

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

Clean, professional design with a **light/dark mode toggle** (defaults to light). High-contrast status colors (green/amber/red) and a subtle grid background work in both modes. Typography: **Manrope** for UI, **JetBrains Mono** for numeric readings. Status badges include icons (✓/△/✕) for color-blind accessibility. This isn't a consumer app — it's a tool that someone glances at under warehouse lighting while deciding whether to dispatch a technician.

### Human-first copy

Every headline, every alert title, and every recommended action is written the way you'd speak to a colleague, not the way a system logs events. Compare:

- ❌ `Sensor S14: 51°C, threshold exceeded`
- ✅ `Fire risk in middle layer — five sensors at 51°C / 18.4% moisture. Dispatch a technician immediately.`

This is the single most important thing about designing for non-technical users, and it matters more than any framework choice.

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
│   ├── context/
│   │   └── ThemeContext.tsx      # light/dark mode provider
│   ├── lib/
│   │   └── risk.ts               # status classifier + color mapping
│   ├── components/
│   │   ├── Layout.tsx            # sidebar + main
│   │   ├── StatusBadge.tsx       # reusable status pill with icon
│   │   ├── PileCard.tsx          # summary card on Sites page
│   │   ├── PileDetail.tsx        # drilldown view
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
