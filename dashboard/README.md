# GridSense AI - web client

Two pages, one Vite build:

| Route | Entry | What it is |
|---|---|---|
| `/` (`index.html`) | `src/site/main.jsx` | Product site - dark, asymmetric bento overview of the forecasting system |
| `/dashboard.html` | `src/main.jsx` | Live forecasting console (Recharts) |

## Running

```bash
npm install
npm run dev      # http://localhost:5173/  -> site   .   /dashboard.html -> console
npm run build    # emits both pages into dist/
npm run preview  # serve the production build
npm run lint     # oxlint
```

The console reads the API base URL from `VITE_API_URL` (see `.env`, default
`http://127.0.0.1:8000`). Start the API from the repo root with
`uvicorn src.serving.app:app --reload`.

## Site design system (`src/site`)

- **Canvas** - zinc-950 base, a fine 68px engineering grid masked radially, a coarser 272px
  baseline grid, and an SVG fractal-noise grain overlay (`.grid-layer`, `.noise-layer` in `site.css`).
- **Glass** - every card is `bg-zinc-900/40 backdrop-blur-md border border-white/10`, with a
  top-edge hairline and a cursor-following radial spotlight (`GlassCard`).
- **Pointer spotlight** - pointer position is written to `--mx` / `--my` and drives
  `.spotlight-layer` (`useCursorSpotlight` in `Site.jsx`).
- **Layout** - asymmetric 12-column bento: `col-span-12` on mobile, then
  `md:col-span-8` / `md:col-span-5` / `md:col-span-4` so card weights stay deliberately uneven.
- **Type** - Inter Tight for display, IBM Plex Sans for body, IBM Plex Mono for the
  `text-xs font-mono tracking-widest uppercase` section badges.
- **Motion** - Framer Motion: staggered page-load choreography, `whileInView` scroll reveals,
  spring lifts on cards, magnetic + press feedback on buttons, and animated `pathLength` chart
  traces and rail lines. The shared easing curve and variants live in `motion.js`.

## Files

```
src/site/
  main.jsx        entry
  Site.jsx        composition, cursor spotlight, atmosphere layers
  Nav.jsx         scroll-aware glass nav, progress rail, mobile sheet
  Hero.jsx        asymmetric hero + 24h horizon panel (hand-rolled SVG)
  Bento.jsx       benchmark, model card, features, drift, accuracy, API, CI
  Pipeline.jsx    seven-stage architecture rail + feedback loop
  Integrity.jsx   engineering log (found -> fixed -> tested), limits, stack
  Closing.jsx     dispatch CTA + footer
  primitives.jsx  GlassCard, Reveal, Badge, CountUp, MagneticButton, marquee
  motion.js       shared easing + stagger variants
  siteData.js     all content, traced to the README, test suite and MLflow runs
```
