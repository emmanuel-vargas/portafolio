# Engineering Studio — React portfolio projects

Three interactive, independent demo screens sharing a React/Vite shell and a small component library. All data is fictional. No enterprise code, credentials, external API calls or internal system details are used.

## Run and build

Requires Node.js 22.12+ (developed with Node 24).

```sh
cd react-projects
npm ci
npm run dev
npm test
npm run build
```

The build writes only to `../demos/`. That directory is reserved for generated output; do not edit it manually. Commit the generated output alongside source changes so the existing GitHub Pages branch deployment can serve it without changing the portfolio's publishing configuration. Relative Vite assets and hash navigation support `/portafolio/demos/#integration`, `#production` and `#procurement`, including direct links and refreshes.

For a Pages-like local preview, serve the repository root with `python -m http.server 8000` and open `http://localhost:8000/demos/`.

## Projects

| Demo | Source | Try this |
| --- | --- | --- |
| Integration Lab | `src/IntegrationLab.jsx` | Validate the sample, send it with the default simulated outage, then retry the 503 delivery to get 201. Edit a quantity to a string and inspect validation. |
| Production Pulse | `src/ProductionPulse.jsx` | Start the simulation, stop Assembly A, filter the work cell, acknowledge its alert and restore output. |
| Procurement Desk | `src/ProcurementDesk.jsx` | Create a draft, advance it through approval, ordering and receipt, search/filter orders and export the visible rows to CSV. Refresh to check persistence. |

### Engineering decisions

- Domain rules live in `src/domain.js`, separate from React components, and are tested with Node's built-in runner.
- Integration payloads are validated before mapping. Totals use integer cents. Currency selection labels values; it is not exchange-rate conversion. Delivery responses are explicitly simulated, with no network traffic or real HTTP service.
- Production is a controllable simulation: each two-second tick represents ten minutes. Rate vs. target and quality are calculated from the selected work cells. These metrics are not OEE; availability is not modeled. Alerts can be acknowledged without concealing the active condition.
- Procurement enforces forward-only state transitions. Browser storage is validated on load and failures are reported. CSV fields are quoted and formula-like user input is neutralized.
- Hash routes avoid server rewrite requirements. Unknown routes have a recovery screen. React escapes user data; no raw HTML injection is used.
- Browser persistence is local to one browser profile, not a shared database. There is no authentication, real purchasing, connected hardware or backend. Integration activity is session-only; procurement supports up to 500 local demo orders.

## Verification

`npm test` covers invalid payloads, totals, retry behavior, invalid order transitions, order validation, CSV escaping/formula protection and stopped-cell output. Browser checks additionally cover complete user flows and responsive layouts. This is a demonstrator, not production-ready enterprise software.
