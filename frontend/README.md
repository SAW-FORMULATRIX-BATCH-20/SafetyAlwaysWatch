# Safety Always Watch frontend

This standalone Safety Always Watch (SAW) frontend demonstrates the product's operational workflows and frontend boundary before a SAW backend is available.

## Demo boundary

Every interaction is deterministic and browser-local:

- Camera Sources and Live Monitoring frames are simulated; there are no RTSP streams, camera URLs, or real video.
- Violation Episodes, Violation Events, and Employees are fictional; no violation snapshot or real-person data is stored.
- Authentication is a demo-persona picker, not an account or credential system.
- Telegram notifications do not use a bot, token, raw Chat ID, or external message delivery.
- Browser storage preserves demo mutations until the user resets data to seed. Face Enrollment stores only Face Sample metadata; it never stores source images, previews, thumbnails, object URLs, data URLs, encoded image values, or biometric embeddings.

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

**Reset demo data** on Overview returns browser-local changes—including Hazardous Zone configuration, simulator results, Score Resets, and Face Sample metadata—to the seed state.

## Face Enrollment demo

An Admin/Safety Officer can open Face Enrollment from an Employee detail page. The workflow accepts JPEG and PNG files up to five MiB and allows at most five active Face Samples per Employee. It supports upload and, in a supported secure browser context, capture from the default camera. The application requests camera permission only after **Use camera** is chosen; upload remains available when the browser denies or cannot provide camera capture.

The preview is temporary and must be explicitly confirmed. The **Demo validation outcome (demo only)** selector provides repeatable successful, no-face, multiple-faces, low-quality, and duplicate outcomes; it does not perform browser facial inference. Successful enrollment stores only metadata (opaque IDs, active state, timestamp, actor, and optional quality score). An active Face Sample can be deactivated after confirmation, retaining its audit metadata and freeing capacity for a later enrollment.

## Frontend capability boundary

Feature screens depend on narrow capability interfaces in `src/services/saw-service.ts`; `SawApplicationCapabilities` composes them only at the application boundary. `createMockSawService()` supplies deterministic browser-local adapters for the demo and application tests.

When backend contracts exist, implement the relevant capability interfaces in a separately owned transport adapter and inject that composition through `App`. This frontend does not assume or create SAW endpoints.

## Production smoke journey

1. Sign in as each persona and verify the expected landing page and access boundaries.
2. As an Area Supervisor, process the missing-PPE scenario and confirm that Pending Confirmation becomes a Violation with one Violation Event.
3. As an Admin/Safety Officer, create a Hazardous Zone with at least one Canonical PPE Class and an Area Supervisor.
4. Complete a Score Reset and confirm that its audit artifacts are visible.
5. As Human Resources, filter the Compliance Report by Hazardous Zone, department, Employee, and date, then clear the filters.
6. As an Admin/Safety Officer, create an Employee, complete one upload-based Face Enrollment, exercise one demo validation failure, deactivate a Face Sample, refresh to confirm metadata persistence, then reset demo data.
7. When supported by the browser, choose **Use camera**, verify the preview flow, and confirm that upload remains available if camera access is denied or unavailable.

The journey intentionally excludes credentials, camera addresses, tokens, violation snapshots, real-person data, retained biometric images, and browser facial inference.
