---
id: TASK-111
title: >-
  Fynd: batchValidation 'permissive' når aldrig Resend-API:et — EF:erna kör
  strict med permissive-semantik i koden
status: Done
assignee: []
created_date: '2026-07-31 10:46'
updated_date: '2026-08-02 07:52'
labels:
  - ready-for-agent
dependencies: []
modified_files:
  - supabase/functions/send-email/index.ts
  - supabase/functions/send-registration-confirmation/index.ts
  - supabase/functions/_shared/resend-batch.ts
  - tests/api/resend-batch.test.ts
  - tests/api/confirm-registrations.test.ts
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
- [x] #1 Åtgärdsväg VALD och motiverad — (a) bump ≥6.1.0, (b) manuell x-batch-validation-header i 4.x, eller (c) acceptera strict och rätta kod/kommentarer/fixturer till strict-semantik; förkastade alternativ bär sina skäl
- [x] #2 Vald semantik bevisad i det avvikande fallet (batch med ≥1 ogiltig rad) — normalfallet är identiskt i båda lägena och bevisar ingenting (STEG 0-fällan)
- [x] #3 Den falsifierade kommentaren i send-email/index.ts:47–48 rättad, och STEG 2-fixturen låser en svarsform den valda vägen faktiskt kan producera
- [x] #4 Rör åtgärden Airtable-/mail-skrivytan: docs/reference/data-model.md konsulterad före write-design
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Åtgärdsväg (AC1): (a) bump resend@4 → resend@6 — vald och verkställd

Marcus-GO 2026-08-01 (villkorat på underbyggnad). Underbyggnaden, källverifierad
(ej doc-trott — packade ned tarballs och läste dist-koden direkt):

- resend@4.8.0 dist (index.js/index.d.ts): 0 träffar på batchValidation/
  x-batch-validation — optionen finns inte, bekräftar TASK-111:s grundfynd.
- resend@6.1.0 dist: batchValidation?: "strict" | "permissive" i typerna,
  och implementationen sätter faktiskt headern:
  "x-batch-validation": options?.batchValidation ?? "strict" (index.js).
  Samma rad finns oförändrad i resend@6.18.1 (senaste stabila).
- GitHub-releasen v6.1.0 (2025-09-15): feat: adds permissive mode for batch
  API (#599) — bekräftar introduktions-versionen.
- Breaking-changes-genomgång 4→6 (GitHub Releases, resend/resend-node):
  - v5.0.0: @react-email/render blir optional peerDependency. Berör ENDAST
    kod som använder react-optionen — våra EF:er bygger html/text manuellt
    (renderHtml/mall-rendering), rör aldrig react-fältet. EJ berörda.
  - v6.0.0: contentId-namnbyte på attachment-schemat (preview-fält). Våra
    EF:er skickar inga attachments. EJ berörda.
  - v6.1.0 → v6.18.1 (38 stabila releaser): 0 releaser taggade BREAKING.
    resend.batch.send()-signaturen, replyTo-fältnamnet och {data,error}-
    svarsformen är oförändrade genom hela spannet.
- Pinnform: flytande majorpin esm.sh/resend@6 (samma konvention som den
  gamla @4-pinnen — roten var version-MISSMATCH, inte pin-formen). Resolverar
  idag 6.18.1.

Förkastade vägar: (b) manuell header i 4.x hade permanentat fel major utan att
lösa STEG 0-fällans falska trygghet; (c) strict ger sämre produktbeteende (en
ogiltig rad fäller hela batchen) och matchar inte den redan byggda
permissive-apparaten (resend-batch.ts/confirm-registrations.ts).

## AC2 — avvikande-fall-beviset (hermetiskt)

parseBatchOutcome/parseConfirmOutcome var redan korrekt implementerade och
redan täckta av fixtur-tester som EXAKT motsvarar Resends dokumenterade
permissive-partial-form (verifierad live mot
resend.com/changelog/batch-validation-modes: data = kompakterade GILTIGA,
errors[].index/message = OGILTIGA, nollbaserat mot originalpayloaden). Ingen
kodändring krävdes i parsningslagret — bugghärden var uteslutande i Deno-EF:ens
SDK-import (untestbar i Node/CI; existerande, dokumenterad arkitekturgräns, se
resend-batch.ts:s egen REN/lager-oberoende-docstring), inte i parsningslogiken.

Det som VAR falskt var STEG 0:s tolkning: den "levande" observationen kördes
mot den trasiga resend@4-pinnen, där API:et alltid körde strict — en
2/2-giltig-batch ser identisk ut i båda lägena, så STEG 0 bekräftade aldrig
permissive-semantik, bara strict-defaultet (STEG 0-fällan, nu explicit
namngiven i koden och testerna).

Levererat: (1) käll-verifiering (ovan) att SDK:n nu genuint sätter headern —
beviset att permissive GENUINT begärs av produktionskoden; (2) befintliga
hermetiska fixtur-tester omdöpta/omdokumenterade för att explicit separera
normalfallet (bevisar inget — STEG-0-fällan) från AVVIKANDE FALLET (≥1 ogiltig
rad → partiell leverans via errors[].index, tests/api/resend-batch.test.ts +
tests/api/confirm-registrations.test.ts, båda mail-vertikalerna). Ingen skarp
Resend-anrop gjordes eller behövs — icke-prod-spärren (send-bulk.ts) gör en
valideringsfel-triggande live-batch strukturellt omöjlig i icke-prod oavsett
SDK-version (de fyra Resend-test-adresserna är alla välformade), så fixtur
förblir rätt bevisform.

## AC3 — falsifierad kommentar rättad + STEG 2-fixturen

send-email/index.ts (makeRealBatchSender-header) och _shared/resend-batch.ts
(modul-header): "L2c-PIN UPPLÖST"-påståendet rättat — det var falskt (se
STEG-0-fällan ovan). Ny kommentar källmärker den faktiska lösningen (dist-
kod-citat, GitHub-releaser, changelog-exempel) i stället för att upprepa ett
obelagt påstående. STEG 2-fixturen (resend-batch.test.ts) låser Resends
DOKUMENTERADE + SDK-typ-bekräftade permissive-partial-form — den formen som
resend@6 faktiskt producerar, inte en form prod aldrig kunde nå (som var
fallet under resend@4).

## AC4 — Airtable-skrivyta

Konsulterad (docs/reference/data-model.md, Utskickslogg/Anmälningar-
sektionerna). Ingen fältoperation ändrad av detta kort — allowlistade fält
(MERGE_FIELD, FALT_STATUS, FALT_BEKRAFTELSE_SKICKAD) orörda.

## Kvarvarande: prod-deploy (EGET moment — INTE utfört av detta kort)

Prod-synkad senast T39 (2026-07-24, tråden STÄNGD). Denna fix ändrar KÄLLKOD i
send-email + send-registration-confirmation (SDK-importraden + doc-
kommentarer) — prod kör fortfarande föregående deploy tills en ny körning
görs. Deploy-formen (ej utförd här):

  bash scripts/deploy-prod-functions.sh --list   # verifiera deploy-set
  # scoped variant (mirroring T39:s override-mönster, minimal diff):
  ALLOWLIST_FILE=<temp-fil-med-endast-de-2> bash scripts/deploy-prod-functions.sh --project-ref <prod-ref>
  # ELLER kanoniska full-allowlist-formen (T39 stängd → tillåten sedan 2026-07-24):
  bash scripts/deploy-prod-functions.sh --project-ref <prod-ref>

Efter deploy: smoke mot prod (T39-runbook-mönstret) innan Lotta skickar ett
skarpt utskick som förlitar sig på permissive-läget.

PROD-DEPLOYEN DEFERRAD → task-120 (beslutsbordet S91 punkt 1, Marcus 2026-08-02): appen är inte live och inga skarpa utskick sker — deployen körs vid go-live på uttryckligt Marcus GO. task-120 bär den exakta deploy-formen + smoke-kravet så momentet är enkelt när det är dags. Detta kort stängs: kodarbetet var klart (AC 1–4 avbockade) och deployen var uttryckligen bokförd som EGET moment i § Kvarvarande.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Rotorsaken (SDK-importen resend@4 saknar batchValidation → prod körde strict med permissive-semantik i koden) åtgärdad via majorbump till esm.sh/resend@6 med källverifierad breaking-changes-genomgång (AC1, förkastade vägar b/c bokförda med skäl). Avvikande-fallet hermetiskt bevisat — normalfallet bevisar inget, STEG 0-fällan explicit namngiven (AC2). Falsifierade kommentarer rättade + STEG 2-fixturen låser en form prod faktiskt kan producera (AC3). data-model.md konsulterad, inga fältoperationer ändrade (AC4). Leveransen landad och CI-verifierad per jobb under S91-vågen. Prod-deployen deferrad på Marcus beslut 2026-08-02 → task-120 (go-live-klass).
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
