# Runlogg - Odoo-Testspår

## 2026-05-07 - Sekventiell körning 0, 0A-INTEGRATION, 0B, 0C, 1, 2, 3, 4, 5

- Starttid: 2026-05-07, Europe/Stockholm.
- Repo: `/Users/marcus/Repon/miranon-media-admin`.
- Ursprunglig branch: `main`.
- Arbetsbranch: `odoo-autonomous-test-plan`.
- Gitstatus före ändringar: ren.
- Externa writes: inga.
- Odoo API-inspektion: ej körd, inga `ODOO_`-miljövariabler hittades.
- Airtable API-inspektion: ej körd, inga `AIRTABLE_`-miljövariabler hittades.
- Odoo POC-write: ej körd, säkerhetsvillkoren uppfylldes inte.

## Källor Lästa

### Lokala källor

- `docs/reference/data-model.md`: verifierad Airtable-datamodell, 18 tabeller och 358 fält per 2026-04-28.
- `docs/reference/hur-systemet-funkar.md`: verksamhets- och flödesförklaring.
- `src/domain/models/*.ts`, `src/domain/schemas/*.ts`, `src/domain/types/*.ts`: appens aktuella domänkontrakt.
- `package.json`: teknisk stack och projektbeskrivning.
- `/Users/marcus/Repon/marcus-system/odoo-events-transcripts-openai`: tutorial/transkriptionsoutput.

### Publika källor

- `https://miranon.se/`
- `https://miranon.se/pages/eventplanering`
- `https://miranon.se/pages/resor-i-medvetandet`
- `https://miranon.se/pages/fjarrskadning`
- `https://miranon.se/pages/roger-och-lotta`

### Officiella Odoo-källor

- Odoo Events 19.0 documentation: `https://www.odoo.com/documentation/19.0/applications/marketing/events.html`
- Odoo Studio 19.0 documentation: `https://www.odoo.com/documentation/19.0/applications/studio.html`
- Odoo Online 19.0 documentation: `https://www.odoo.com/documentation/19.0/administration/odoo_online.html`
- Odoo.sh 19.0 documentation: `https://www.odoo.com/documentation/19.0/administration/odoo_sh.html`
- Odoo hosting 19.0 documentation: `https://www.odoo.com/documentation/19.0/administration/hosting.html`
- Odoo Security: `https://www.odoo.com/security`
- Odoo Cloud SLA: `https://www.odoo.com/cloud-sla`
- Odoo External JSON-2 API 19.0: `https://www.odoo.com/documentation/19.0/developer/reference/external_api.html`
- Official Odoo source repository, branch `19.0`: `https://github.com/odoo/odoo`

## Blockerare

- Faktisk Odoo-version, deploymentmodell, installerade appar, importfält och databasplan är inte instansverifierade.
- Faktisk Airtable-export/API lästes inte i denna körning, endast repo-dokumentation och domänmodeller.
- POC-write är blockerad av saknade credentials, saknad verifierad testdatabas, saknade verifierade Odoo-importfält och saknat `ODOO_POC_LABEL`.

## Skapade Artefakter

Alla artefakter ligger under `odoo-migration-test-plan/` och `odoo-migration-workbench/`. Extern Odoo-källkod hämtades i `odoo-migration-workbench/external-source/` men ignoreras från git.
