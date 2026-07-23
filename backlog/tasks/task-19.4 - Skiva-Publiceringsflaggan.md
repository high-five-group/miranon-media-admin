---
id: TASK-19.4
title: 'Skiva: Publiceringsflaggan'
status: In Progress
assignee: []
created_date: '2026-07-21 08:21'
updated_date: '2026-07-23 10:36'
labels:
  - ready-for-agent
dependencies:
  - TASK-19.3
parent_task_id: TASK-19
ordinal: 62000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Publiceringsflaggan föds som ADDITIVT bas-fält (staging först), skapa-operationens allowlist utökas och handtaget armerar flaggan på riktigt; skapa utan publicering förblir default. Vad flaggan STYR på miranon.se (kalender-synlighet, anmälningsformulär, event-sida) är T79:s kontrakt — utanför detta kort. Täcker användarberättelser: 5, 6 (TASK-19).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Fältet additivt i staging; allowlist-utökningen kontraktstestad: armerat ger flaggan satt, oarmerat lämnar den osatt
- [x] #2 Handtags-armeringen bevisad ände-till-ände i e2e mot staging med teardown
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Levererad i S75-batchen (parallell form, ADR-073). Publiceringsflaggan föds som ADDITIVT bas-fält och handtaget från 19.1/19.3 får VERKAN.

BAS-ÄNDRING (ADDITIV, STAGING ENDAST — PROD ORÖRD): nytt fält 'Publicerad på miranon.se' på Eventplanering (staging apphjj8Q7lkXCMsL4, tabell tblVE3UKWl1CKrphV) — fält-ID fldyJKnJCP1brHwL6, typ checkbox, med fält-beskrivning som pekar på ADR-066-tillägget + T79. Live-verifierat FÖRE allowlist-låsningen att fältet inte fanns i vare sig staging eller prod (describe_table 2026-07-22, L294: en referens kan inte bevisa frånvaro). Inga befintliga fält ändrade. docs/reference/data-model.md är läs-yta i batchen — synken av detta fält (Eventplanering create-fält-tabellen + §Kända fällor-noten om prod-förutsättningen) deferrad till sessionens end-pass.

PROD-FÖRUTSÄTTNING (hård, samma klass som Idempotensnyckel/§Kända fällor 37): PROD-fältet är INTE skapat. Prod-EF-deploy av create-event FÅR INTE ske innan prod-fältet finns — annars fäller Airtable ett armerat create. Prod-fält + prod-EF-deploy = EN separat Marcus-auktoriserad handling (ADR-050/ADR-063).

KONTRAKTET: klient-input 'publicera' (boolean, VALFRI) i create-event-bodyn; allowlisten (field-allowlists.ts, create-event-posten) utökad med EXAKT Airtable-fältnamnet. OARMERAT = nyckeln UTELÄMNAS hela vägen: formuläret skickar handtagets läge -> adaptern spreadar in 'publicera' ENDAST vid true -> EF:en lägger fältet i fields-mapen ENDAST vid true. Rationale: EF:ens fields-map är TÄT — ett skrivet false SÄTTER checkboxen (och kunde vid idempotent replay nolla en flagga satt i basen). Fel typ (t.ex. 'ja') -> 400, ingen coercion. Domän-shapen CreatedEvent är OFÖRÄNDRAD (ingen läs-väg för flaggan i appen; paritetsfilen orörd — inget nytt schema-fält att spegla).

ADR: ADR-066 fick ett additivt '## Tillägg (additivt) — 2026-07-22' (fält-raden i create-setet + skriv-semantiken + miljö-ordningen + T79-avgränsningen). Besluts-texten oförändrad/immutabel; ingen ny ADR-fil (check-adr-count orörd) — flaggan är ADR-063-klassens additiva fält, precis som PRD task-19 förutsåg. ORDLISTA fick posten 'Publicerad på miranon.se' (begreppet + T79-gränsen).

EF-DEPLOY: create-event deployad till STAGING (project-ref pqtshyierkdgwdnxuirz, explicit --project-ref; aldrig bare deploy) FÖRE api-testet kördes grönt. Prod orörd.

TDD-BEVIS (rött-först observerat):
1. api-kontraktet — 'PUBLICERINGSFLAGGAN: armerad create -> flaggan SATT; oarmerad create -> flaggan OSATT' + 'deny: publicera av fel typ (ej boolean) -> 400' kördes RÖDA mot deployad staging-EF FÖRE implementationen (2 failed / 1 passed; armerade fältet undefined i record.fields, fel-typ gav 201 i stället för 400). Efter EF-ändring + deploy: 9/9 gröna i filen.
2. e2e-armeringen — RÖD-fasen observerad MEKANISKT via mutation: adapterns publicera-spread togs tillfälligt bort, mockade sviten kördes mot egen dev-server (port 5411, aldrig 5173) -> 'happy path' FÖLL på expect(payload.publicera).toBe(true) (1 failed / 2 passed). Adaptern återställd -> 10/10 gröna.

AC #2 (skarpt ände-till-ände): det skarpa describe-blocket armerar handtaget i UI:t och läser create-event-svarets RÅA record.fields -> 'Publicerad på miranon.se' === true på den skapade staging-raden. Kört i FULL parallell svit mot staging-bygge på CORS-tillåten preview-origin 4173 (isolerings-kravet efter 19.3:s studs-läkning; fristående session per fristaende-session.ts). Teardown oförändrad: ZZ-sentinel-orten + setup-purgen (.purge-staging-policy.json target create-event-sentineler).

GRINDAR (lokalt, hårt grindade, allt i semafor-fönster): biome exit 0 · typecheck 0 fel · typecheck:tests 0 fel · build grön · vale 0 errors · test:api 9/9 på create-event-filen · e2e mockade 10/10 · test:a11y 62/62 · FULL e2e-svit 225 passed / 3 failed — de tre fallerarna är INTE mina (shell DoD 6 'DEV-guardad feltrigger', persist-cache offline-omladdning, kalendervyns ?vy-kontrakt) och kördes om mot DEV-server (CI:s miljöform): 24 passed / 1 skipped / 0 failed -> preview-bygge-artefakter, ingen regression ur denna diff. Ingen skapa-event-test fanns bland fallerarna.

ÖPPET: DoD 3 (CI per jobb) och DoD 5 (Marcus design-review) står öppna. DoD 6: INGEN facit-punkt berörs visuellt av detta kort — handtagets renderade form är oförändrad sedan 19.1/19.3 (där den facit-avprickades); kortet ändrar bara vad armeringen GÖR. Lämnad obockad för Marcus bedömning.

POST-CI-BOKFÖRING (merge-agent, S75-batchen): PR #83 mergad med merge-commit 67ad145 (aldrig squash). PR-CI run 29954677926 GRÖN per jobb (Detect changed files · Lint + Audit + TypeCheck · Docs link check · Staging sentinel purge · Test + Build · CI Passed or Skipped) — jobb-utfallen fil-lästa ur gh run view --json jobs. E2E-beviset ligger som STEG i Test + Build: 'E2E tests (staging)' success (233 passed / 3 skipped); 'API tests (staging)' success (134 passed); 'API tests (pure)' 190 passed; 'A11y tests' 62 passed; Build success. Test-count-delta mot senaste main-run med tester (32061af, run 29953409618): api-staging 132 -> 134 (+2 = kontraktstesterna armerad/oarmerad + deny fel typ), e2e 232 -> 233 (+1 = det skarpa armerings-blocket); api-pure och a11y oförändrade. MAIN-CI run 29955372036 på merge-commit 67ad145 GRÖN per jobb med identisk stegbild (233/3 e2e · 134 api-staging · 190 api-pure · 62 a11y · Build). Merge-tree mot färsk main gav exit 0 (ingen konflikt, inget upplösnings-mandat behövde tas). Claims-kvitto: 10/10 ändrade filer inom kortets deklarerade yta — noll fil utanför. Audit-läkningen 8f4aeb3 verifierad som ancestor till branchen före PR. OBEROENDE VERIFIERING (merge-agent, ej bygg-agentens ord): allowlist-namnet korsläst LIVE mot staging-schemat via Airtable-MCP describe_table — fältet 'Publicerad på miranon.se' (fldyJKnJCP1brHwL6) finns på Eventplanering tblVE3UKWl1CKrphV och matchar allowlist-strängen EXAKT. Utelämnande-formen verifierad i diffen i alla tre lagren (adapterns spread vid true · EF:ens fields-map vid true · schemats optional). GRANSKNINGSFÄRDIG — VÄNTAR DESIGN-REVIEW (MARCUS). Kortet står kvar In Progress; DoD 5 (design-review mot S73-facit-utökningen) och DoD 6 (facit-avprickningen) är Marcus-grindar och lämnas obockade. Ingen final-summary skriven, status INTE satt till Done — tvåstegs-stängningen (K61.1/T75) väntar på Marcus kvittens.
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-07-23 10:36
---
Review-våg 5 (2026-07-23, PR #94): prompten kortad till 'Dra för att publicera' (destinationen bärs av armerade läget 'Publiceras på miranon.se' + aria-label). DoD #5 fortsatt öppen tills omgranskning.
---
<!-- COMMENTS:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Design-review MOT S73-FACIT-UTÖKNINGEN: Marcus-granskning i webbläsaren godkänd mot facit-bilagorna (per skiva med UI-yta; L220)
- [ ] #6 Facit-avprickningen: varje berörd facit-punkt avprickad med renderad verifiering (computed-style/skärmdump) före granskning (L245/L246)
- [x] #7 Bas-ändringar ADDITIVA och staging FÖRST; prod-deploy av fält/EF är separat Marcus-auktoriserad handling (ADR-050/ADR-063)
<!-- DOD:END -->
