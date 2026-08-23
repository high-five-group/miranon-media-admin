---
id: TASK-309.9
title: >-
  Skiva 8: Prod — schema efter GO per tabell, secrets, EF-deploy via skriptet,
  klient via Vercel, röktest
status: To Do
assignee: []
created_date: '2026-08-23 14:38'
updated_date: '2026-08-23 19:10'
labels:
  - ready-for-human
dependencies:
  - TASK-309.8
  - TASK-309.5
parent_task_id: TASK-309
ordinal: 570000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Allt som byggts blir skarpt i prod-appen: basens struktur, hemligheterna, funktionerna och klienten — i den ordning som gör att inget deployas mot tomhet. Täcker användarberättelser: 26, 27, 28, 30.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Prod-schemat skapat efter Marcus GO i klartext per tabell (Eventinnehåll, Agendapunkter, Platser; fälten på Eventplanering och Bilagor) med samma namn och typer som staging; prod-ID:n bokförda i datamodell-referensen; seed (Rönninge + sju Eventinnehåll-rader) lagd
- [ ] #2 DOCRAPTOR_API_KEY satt i staging- och prod-secrets av Marcus via egen terminal (nyckeln passerar aldrig chatten); ENVIRONMENT ger test: false i prod
- [ ] #3 fas4-prod-deploy.sh --kontrollera grön (inkl. TASK-308:s bucket-rad) → --deploya av Marcus; UPDATED_AT verifierad för de rörda EF:erna; allowlist-policyn bär de nya/ändrade EF:erna och inte test-docraptor-render
- [ ] #4 Klienten landad via merge-kön och byggd av Vercel; röktest i prod av Marcus: skapa bekräftelsebilaga för ett riktigt event → filen i listan → bifogbar på Åtgärds-sidan → kvittoförhandsgranskning visar nya mallen utan vattenstämpel
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Prod-schemaändringar endast efter Marcus GO i klartext per tabell (ADR-125 § 8)
- [ ] #6 Ingen HTML byggs i klienten; lagervakten (ADR-057) grön
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## TASK-309.9 — AFK-delen levererad (schema-/seed-/EF-vägen till prod)

Bygg-agenten (denna commit) förberedde de tre kopierbara prod-kommandona per
kortets AC #1/#3 — prod rördes ALDRIG av agenten (ADR-125 §8, deny-prod-ref.sh).
Marcus/orkestreraren kör sekvensen och bockar AC #1–#4 EFTER körning.

**Exakt sekvens (full form, placeholders för nycklar):**
[docs/reference/atkomst-och-nycklar.md](../../docs/reference/atkomst-och-nycklar.md)
§ "Prod-deploy av bilagespåret (ADR-125, TASK-309.9)" — sju steg (a)–(g):
(a) prod-schema via `create-eventinnehall-modell.mjs --bas <baseId>` +
`AIRTABLE_PROD_GODKAND_AV_MARCUS`-gaten, (b) seed samma form, (c)
`fas4-prod-deploy.sh --kontrollera`/`--deploya <prod-ref>`, (d) verifiera
UPDATED_AT för 6 nya + 3 ändrade EF:er, (e) Vercel — ingen handling, (f)
röktest (AC #4), (g) rotera DocRaptor-nyckeln (exponerad i chatt 2026-08-23,
S108 Del 14 § D) och sätt om båda secrets via `--env-file`.

**Kodändringar (samma commit):**
- `.prod-functions-allowlist.conf` — sex EF:er tillagda
  (`get-document-sources`, `get-event-contents`, `get-places`,
  `save-event-content`, `save-event-text`, `save-place-standard`) som
  skapades av TASK-309.2/.3/.7 men saknades i allowlisten (mätt mot
  origin/main `cb7ad681`). Ingen paritetsgrind mellan allowlist och
  `config.toml` finns i repot (kontrollerat: `deploy-prod-functions.sh`
  läser bara allowlisten, rör aldrig `config.toml`) — ingen sådan grind att
  köra.
- `scripts/create-eventinnehall-modell.mjs` +
  `scripts/seed-eventinnehall-modell.mjs` — ny MEDVETEN prod-väg: `--bas
  <baseId>` (argument, aldrig config) + `AIRTABLE_PROD_GODKAND_AV_MARCUS=
  <baseId>`-gate för varje icke-staging-bas (`resolveTargetBaseId`,
  fail-closed generellt). Staging-mutexen hoppas över vid prod-körning.
  Ett `SAMMANFATTNING`-block skrivs ut i slutet med skapade tabell-/fält-/
  record-ID:n, klistervänligt för `data-model.md`s prod-kolumn.
- `scripts/test-create-eventinnehall-modell.mjs` — 24 → 31 fall. De 7 nya
  bevisar låset i BÅDA riktningar (utan env-var → VÄGRAR; med → går vidare
  till torrkörning), grönt+manuellt negativt kontrollerat.
- `docs/reference/data-model.md` § Bilagornas datamodell — en HUR-rad
  tillagd (prod-kolumnen står oförändrat "skapas efter GO (skiva 8)" tills
  körningen är gjord, per uppdrag).

**Bifynd, bokfört i runbooken (inte åtgärdat):** `INVITE_REDIRECT_URL`
saknas i prod-secrets (mätt av `--kontrollera`, ej oberoende reverifierad av
denna agent — prod-refen är strukturellt otillgänglig för agenter); faller
till bar `site_url` i stället för `/valkommen`. Pre-existing.

AC #1–#4 och DoD-punkterna bockas EFTER Marcus/orkestrerarens körning — INGET
bockat av denna agent.
<!-- SECTION:NOTES:END -->
