# Airtable And Import Package Report

## Status

Körning 3 är blockerad på faktisk källdata. Repo-dokumentationen verifierar struktur, men ingen live Airtable API eller CSV/JSON-export lästes.

## Verifierat

- 18 Airtable-tabeller och 358 fält enligt `data-model.md`.
- Kärnrelationer mellan `Personer`, `Anmälningar`, `Eventplanering` och `Deltaganden`.
- Persondatafält finns och kräver anonymisering.

## Importpaket

Skarpt importpaket skapades inte. `generated-import-package/README.md` dokumenterar blockeraren.

## Blockerare

- Faktiska exporter.
- Odoo field inventory.
- External ID-preview.
- Testdatabas.
