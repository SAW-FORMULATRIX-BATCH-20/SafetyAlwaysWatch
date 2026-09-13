# Safety Always Watch frontend

This standalone Safety Always Watch (SAW) frontend demonstrates the product's operational workflows and frontend boundary before a SAW backend is available.

## Demo boundary

Every interaction is deterministic and browser-local:

- Camera Sources and Live Monitoring frames are simulated; there are no RTSP streams, camera URLs, or real video.
- Violation Episodes, Violation Events, and Employees are fictional; no violation snapshot or real-person data is stored.
- Authentication is a demo-persona picker, not an account or credential system.
- Telegram notifications do not use a bot, token, raw Chat ID, or external message delivery.
- Browser storage preserves demo mutations until the user resets data to seed.

## Install and run

Use Node.js `^20.19.0` or `>=22.12.0`, then run:

```bash
npm ci
npm run dev
```

Vite prints the development URL, normally `http://localhost:5173`. For a production-build preview, run `npm run smoke`; it serves the build at `http://127.0.0.1:4173`. Run `npm run verify` for type checking, linting, tests, and a production build.

## Demo personas

No account or password is required.

- **Admin/Safety Officer** starts on Overview and can administer Hazardous Zones, Canonical PPE Classes, safety parameters, Score Reset, and simulations.
- **Area Supervisor** starts on Live Monitoring, scoped to the Production area, and can use the Violation Episode simulator.
- **Human Resources (HR)** starts on Compliance Report and can review trends without Live Monitoring access.

Use **Sign out** in the header to return to the persona picker.

## Simulation and reset

The Live Monitoring **Violation Episode simulator** offers normal operation, missing PPE, unidentified identity, Camera Source loss, and an Escalation Threshold crossing. It changes demo data only and never sends an alarm.

**Reset demo data** on Overview returns browser-local changes—including Hazardous Zone configuration, simulator results, and Score Resets—to the seed state.

## Frontend capability boundary

Feature screens depend on narrow capability interfaces in `src/services/saw-service.ts`; `SawApplicationCapabilities` composes them only at the application boundary. `createMockSawService()` supplies deterministic browser-local adapters for the demo and application tests.

When backend contracts exist, implement the relevant capability interfaces in a separately owned transport adapter and inject that composition through `App`. This frontend does not assume or create SAW endpoints.

## Production smoke journey

Run `npm run smoke`, open the preview URL, and complete this journey against the production build:

1. Sign in as Admin/Safety Officer, Area Supervisor, and Human Resources (HR), confirming their Overview, Live Monitoring, and Compliance Report landing pages respectively.
2. As Human Resources (HR), open `/monitoring/live` directly and confirm that the role guard shows Restricted access; then sign out and confirm that the persona picker returns.
3. As an Admin/Safety Officer, open `/pelanggaran` and confirm that it replaces the legacy URL with `/violations` without changing the active persona.
4. As an Area Supervisor, process the Missing PPE scenario and confirm that Pending Confirmation becomes one Violation with one Violation Event; process the compliant frames until it is Cleared.
5. As an Admin/Safety Officer, create a Hazardous Zone with at least one Canonical PPE Class and an Area Supervisor, then confirm the saved configuration survives a refresh.
6. Complete a Score Reset and confirm that its Score Period, ledger entry, and reset log are visible.
7. As Human Resources (HR), filter the Compliance Report by Hazardous Zone, department, Employee, and date, then clear the filters.
8. Enable the operating system's reduced-motion preference and confirm that the application remains immediately usable without decorative movement.
9. As an Admin/Safety Officer, reset demo data, refresh the page, and confirm that the deterministic seed data returns. Inspect a Violation Event detail and confirm that it presents audit metadata only—never a violation snapshot, placeholder, image, or link.

The journey intentionally excludes credentials, camera addresses, tokens, violation snapshots, and real-person data.
