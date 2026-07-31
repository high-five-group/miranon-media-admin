---
id: TASK-111
title: >-
  Fynd: batchValidation 'permissive' når aldrig Resend-API:et — EF:erna kör
  strict med permissive-semantik i koden
status: To Do
assignee: []
created_date: '2026-07-31 10:46'
labels:
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 184000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
**Verifierad beläggning (2026-07-31, read-only-verifiering mot publicerade tarballs + esm.sh + Resend-docs):**

- Båda EF:erna importerar `https://esm.sh/resend@4` (flytande major-pin) som löses till 4.8.0 vid modul-hämtning i edge-runtimen: `send-email/index.ts:3`, `send-registration-confirmation/index.ts:3`.
- `batchValidation` finns INTE i resend 4.8.0 — noll grep-träffar i hela paketet (dist-typer, js, README) OCH i esm.sh:s serverade bundle. Runtime-kedjan `batch.send → create → post()` läser enbart `options.idempotencyKey`; resten spreadas in i fetch-init där okända medlemmar släpps tyst. Optionen blir aldrig header, aldrig body, aldrig query — API:et ser den aldrig.
- API:ets läge styrs av headern `x-batch-validation`; utan den kör Resend **strict** (default per Resends changelog "Batch Validation Modes"). Optionen infördes i SDK:n först i **6.1.0** (2025-09-15) som sätter headern; koden är alltså skriven mot 6.x-dokumentation medan importen pinnar 4.x. Även svarstypen med `errors?` finns bara i 6.x — kommentaren i `send-email/index.ts:47–48` som påstår motsatsen är falsifierad.
- **Konsekvens (beteendepåverkande, latent):** designat beteende var permissive (ogiltiga rader rapporteras rad-exakt via `errors[].index`, giltiga skickas ändå — hela apparaten finns: `_shared/resend-batch.ts:66–97` `parseBatchOutcome`, `_shared/confirm-registrations.ts:137–163` `parseConfirmOutcome`). Faktiskt beteende är strict: ≥1 ogiltig rad ⇒ hela batchen avvisas ⇒ `if (error)`-grenen (`send-email/index.ts:90–93`, `send-registration-confirmation/index.ts:95–101`) stämplar SAMTLIGA mottagare rejected. `errors`-parsningsvägen är onåbar i produktion under nuvarande pin; STEG 2-fixturen låser en svarsform prod aldrig kan producera. Normalfallet (alla rader giltiga) är identiskt i båda lägena — därför gav STEG 0-observationen falsk bekräftelse.
- Parsarna är framåtkompatibla med 6.18.1:s form — en bump ≥6.1.0 aktiverar den idag döda vägen.

**Öppna åtgärdsvägar (beslut ej taget, hör till kortets exekvering):** (a) bumpa till resend ≥6.1.0 (aktiverar permissive på riktigt; major-bump, kräver testpass), (b) sätta headern `x-batch-validation: permissive` manuellt via SDK:ns options i 4.x, (c) acceptera strict och rätta kod/kommentarer/fixturer till strict-semantik. Airtable-/mail-ytan: konsultera `docs/reference/data-model.md` före ev. framtida write-design.

**Källor:** Resend changelog "Batch Validation Modes" · resend.com/docs Send Batch Emails · resend-node v6.1.0 release · tarball-bisektion 4.8.0 ✗ / 5.0.0 ✗ / 6.0.3 ✗ / 6.1.0 ✓.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Åtgärdsväg VALD och motiverad — (a) bump ≥6.1.0, (b) manuell x-batch-validation-header i 4.x, eller (c) acceptera strict och rätta kod/kommentarer/fixturer till strict-semantik; förkastade alternativ bär sina skäl
- [ ] #2 Vald semantik bevisad i det avvikande fallet (batch med ≥1 ogiltig rad) — normalfallet är identiskt i båda lägena och bevisar ingenting (STEG 0-fällan)
- [ ] #3 Den falsifierade kommentaren i send-email/index.ts:47–48 rättad, och STEG 2-fixturen låser en svarsform den valda vägen faktiskt kan producera
- [ ] #4 Rör åtgärden Airtable-/mail-skrivytan: docs/reference/data-model.md konsulterad före write-design
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
