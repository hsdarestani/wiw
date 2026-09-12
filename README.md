# SchichtPro

SchichtPro is a workforce-management platform for shift-based teams.

## Product scope

- Employee scheduling and OpenShifts
- Availability, time-off, shift swaps and approvals
- Time clock, attendance, breaks and timesheets
- Team messaging and announcements
- Multi-location / multi-role workforce management
- Labor-cost visibility, overtime rules and exports
- Integrations and payroll handoff
- Web admin panel plus iOS/Android apps

## Repository

This repository is organized as a monorepo. Implementation starts in the `phase-1-foundation` branch with the web app, API/data model and shared UI foundations.

## Brand

SchichtPro uses its own brand, interface assets and design system while implementing familiar shift-management workflows.

## Phase 1: scheduling foundation

The first runnable slice lives in `apps/web` and includes a responsive German
manager shell, weekly schedule grid, employee/role rows, open shifts and weekly
labor summaries.

```bash
corepack pnpm install
corepack pnpm --filter @schichtpro/web dev
```

Open `http://localhost:3000/schedule`.

## Production deployment

Merges to `main` deploy automatically through GitHub Actions using the
repository secrets `HOST` and `PASS`. The target is `/opt/schichtpro` on the
remote host and HTTPS is managed automatically for `schichtpro.smarbiz.sbs`.
