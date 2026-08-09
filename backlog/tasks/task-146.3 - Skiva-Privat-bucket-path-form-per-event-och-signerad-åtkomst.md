---
id: TASK-146.3
title: 'Skiva: Privat bucket, path-form per event och signerad åtkomst'
status: Done
assignee: []
created_date: '2026-08-07 09:05'
updated_date: '2026-08-09 08:11'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-146
ordinal: 242000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Bilagornas bytes får en privat hemvist där en fil bara är åtkomlig för den som ska se den, via en tidsbegränsad länk. Kursdeltagares kvitton ska aldrig ligga öppet.

VALT MEDVETET: signerade URL:er, inte publik bucket. Intern precedent finns för publik bucket i ett systerprojekt — vi väljer den smalare vägen.

Täcker användarberättelser: 12, 13
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Privat bucket provisionerad av ett INCHECKAT, idempotent skript; bucketen är privat, inte publik
- [x] #2 Path-formen prefixar per event så filer grupperas där de hör hemma
- [x] #3 En giltig signerad länk ger filen; en utgången nekas — båda prövade som ÅTKOMST, inte som konfiguration
- [x] #4 Storleksgränserna prövade VID gränsen: strax under går igenom, strax över avvisas med begripligt fel innan uppladdningen påbörjas
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
PROVISIONERING (AC #1) — mätt skarpt mot staging (pqtshyierkdgwdnxuirz),
2026-08-07. scripts/provision-attachments-bucket.mjs skapar/konvergerar
bucketen "bilagor" (public=false, fileSizeLimit=26214400 bytes / 25 MB,
allowedMimeTypes=['application/pdf']). IDEMPOTENS BEVISAD I BÅDA
RIKTNINGAR, inte bara grönt-mot-grönt: (1) --dry-run mot saknad bucket →
ingen mutation; (2) verklig körning → skapad; (3) omedelbar omkörning →
"redan konvergerad", ingen mutation; (4) bucketen DELIBERAT drifted till fel
config (public=true, fileSizeLimit=1024, allowedMimeTypes=['image/png']) via
ett fristående engångsskript, sedan provisioneringsskriptet kört igen →
DETEKTERADE avvikelsen och KONVERGERADE tillbaka till public=false/25MB/PDF;
en tredje körning bekräftade no-op igen. Detta bevisar update-grenen
faktiskt fäller (fixar en trasig bucket), inte bara att create/no-op-
grenarna är gröna. 25 MB-gränsen: Resends 40 MB/mail-tak EFTER base64
(~30 MB rå-bytes-praktik) minus marginal — se skriptets egen header för
fullt resonemang. allowedMimeTypes=['application/pdf'] är försvar-i-djupet
(v1:s tre dokumentklasser är alla PDF:er).

STORLEKSGRÄNS + SIGNERAD ÅTKOMST (AC #2/#3/#4) — TESTHARNESS-EF
supabase/functions/test-attachments-storage/ (verify_jwt=true, requireUser,
STAGING-ONLY — medvetet UTELÄMNAD ur .prod-functions-allowlist.conf, samma
mönster som test-pdf-generation/test-invite-completion) deployad manuellt
via `supabase functions deploy test-attachments-storage --project-ref
pqtshyierkdgwdnxuirz` (ADR-050: ingen deploy-automatik). Anropas av
tests/api/test-attachments-storage.staging.test.ts.

AC #2 — path-formen: EF:en genererar ett syntetiskt eventId
(t.ex. ZZ-TEST-EVENT-f98628a8-a03b-437d-a2ec-fe5b89ae8901, mätt värde från
ett faktiskt anrop) och lägger tre testobjekt under det prefixet. Testet
asserterar att accessTest.path och båda size-limit-paths FAKTISKT ligger
under `${eventId}/` i den RIKTIGA bucketen.

AC #3 — bevisat som ÅTKOMST i tre led, alla faktiska HTTP-hämtningar gjorda
av TESTET (inte av EF:en): (a) en giltig signerad URL (30s TTL) hämtades
direkt → 200, bytes börjar med "%PDF-"; (b) en signerad URL med 1s TTL
väntades ut (2s marginal) och hämtades sedan → status ≠ 200 (nekad); (c)
bucketens PUBLIKA (osignerade) objekt-URL för SAMMA fil hämtades direkt →
status ≠ 200 — ett tredje, oberoende beteende-bevis på att bucketen är
PRIVAT (inte bara att en config-flagga säger det). Alla tre gröna, mätt
skarpt (test-körning 2026-08-07 + ett fristående curl-verifieringsanrop
samma dag, se tests/api/test-attachments-storage.staging.test.ts).

AC #4 — EF:en läser bucketens FAKTISKA file_size_limit LIVE (26214400
bytes, inte en duplicerad konstant) och gör två riktiga uppladdningar 1 KB
från gränsen på vardera sidan. MÄTT (curl-anrop mot den skarpa EF:en,
2026-08-07): under-gränsen-uppladdning (26213376 bytes) → ok=true; över-
gränsen-uppladdning (26215424 bytes) → ok=false,
error="The object exceeded the maximum allowed size" (Supabase Storages
faktiska felsträng, verbatim ur svaret — inte gissad). "Innan uppladdningen
påbörjas" verifierat genom en EGEN list()-kontroll efteråt:
persistedAfterRejection=false — over-limit-filnamnet finns INTE i bucketen,
ingenting skrevs. Cleanup-svaret bekräftar samma sak indirekt: exakt 2
objekt fanns att riva (under-limit + access-test), inte 3 — den
ursprungliga testassertionen förväntade fel-aktigt 3, testkörningen fällde
på det och avslöjade felet, rättat till 2 med förklarande kommentar i
testfilen (bevis på att grinden faktiskt läser verkligheten, inte bara
skriver en siffra den redan "vet").

NEGATIV KONTROLL (cleanup fail-closed): ett separat test anropar
"cleanup"-action med ett prefix som INTE matchar ZZ-TEST-EVENT--markören →
400. Bevisar att spärren mot "radera vad som helst i bucketen" faktiskt
fäller, inte bara att den händelsevis aldrig triggas.

DoD #5 (PDF-biblioteket, edge-runtime) checkad: UPPFYLLT AV TASK-146.1,
landad som #855 (grinden passerade där) — inte utfört av denna skiva, men
ett globalt sant faktum vid detta korts leverans. Källa: backlog/tasks/
task-146.1, Implementation Notes.

DoD #8 (väggkatalogens två attachment-poster) checkad: VERIFIERAT redan
landat av TASK-146.1 (P28+P29, docs/reference/airtable-constraints.md § G)
— läst och bekräftat närvarande vid detta korts start, inga dubbletter
skapade här.

DoD #6 och #7 lämnade OKRYSSADE (ej tyst avbockade) — EJ TILLÄMPLIGA på
denna skiva: TASK-146.3 rör varken UI-lagret (src/) eller
DataSourceAdapter-kontraktet (adapter-ytan är TASK-146.4, inga adapter-
filer rörda här) och rör inte Airtable-basens data/schema alls (bara
Supabase Storage + Edge Functions + tester rörda — inga Airtable-fält eller
-tabeller skapade/ändrade).

DoD #3 (CI grön per jobb) lämnas okryssad — orkestrerarens ansvar efter
push, per uppdragets instruktion.

MILJÖ: samtliga skarpa operationer (bucket-provisionering, drift-injektion,
EF-deploy, testkörningar) kördes mot STAGING (pqtshyierkdgwdnxuirz)
uteslutande. Prod (lvjsfnphlauldxqlncpl) rördes aldrig — provisionerings-
skriptet har en fail-closed miljövakt (assertStagingOnly) som vägrar köra
mot något annat ref. Service-role-nyckeln hämtades engångs via
`supabase projects api-keys`, levde bara i en env-variabel under skriptets
körning, och skrevs aldrig till disk eller loggades.

[TASK-169, backlog-städet, 2026-08-09] DoD#3+#7 bockade mot belägg. DoD#3: PR #899s gating checks gröna; post-merge-stagingjobbet (SHA ba4a8259) visade CANCELLED (superseded), täckt av Marcus commit 06dc40b7 (samma källkedja som 145.1/145.2, se dessas notes). Dagens nattkörning (31291660374) bekräftar staging SUCCESS på main nu. DoD#7 (bas-additiviteten): bevisas av TASK-146.2 (Done, eget DoD checkad för samma bas-additivitet). DoD#6 (lager-oberoendet, port-paritet i BÅDA adaptrarna) lämnas GENUINT OBOCKAD av samma skäl som task-146.1/146.2: TASK-146.4 (adaptern) fortfarande To Do. Flippar INTE status — se task-169s slutrapport.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 PDF-biblioteket skarpt verifierat mot den riktiga edge-runtimen (ej Node-proxy) INNAN övrig arkitektur byggs ovanpå
- [ ] #6 Lager-oberoendet mekaniskt fällt: noll direkta lagrings-anrop i UI-lagret + port-paritet i BÅDA adaptrarna
- [x] #7 Bas-additiviteten mätt mot schemat: inga befintliga fält eller tabeller rörda
- [x] #8 Väggkatalogens två attachment-poster landade
<!-- DOD:END -->
