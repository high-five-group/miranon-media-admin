---
id: TASK-352
title: >-
  Fynd: fallerat/väntande kvitto saknar durabel Skicka-handling — retry-ytan var
  transient komponent-state
status: Done
assignee: []
created_date: '2026-08-31 10:10'
updated_date: '2026-09-04 08:12'
labels:
  - ready-for-agent
dependencies: []
priority: high
ordinal: 655000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ur S113-slutvandringen 2026-08-31 (orkestreraren, dev-server mot staging). Uppmätta fakta: (1) Tre kvitton (MM-2026-1010/1011/1012, alla utfardat) fick fallerade utskick i staging-adressvakten ("är inte en Resend-testadress"). Inkorgen (/mer/betalningar) visade en TRANSIENT utfallsregion (BetalningsInkorg.tsx, jobbrad.status==='fel') med per-rad "Skicka igen"-knapp via koaKvitton — men regionen är komponent-state (jobbId/jobb.data), borta efter navigering bort och tillbaka. (2) Efter navigering visar inkorgen "0 kvitton i kö", ingen "Skicka N kvitton"-knapp — de fallerade raderna är inte återköade och kan inte nås via inkorgen. (3) Anmälans detaljvy (AnmalanDetail -> AnmalansBetalningar/InbetalningsLista) visar raden "Kvitto MM-2026-1010 · väntar på att skickas" (kvittolage.ts, utfardat-grenen) med ENDAST Makulera-knapp — ingen skicka-handling, trots att kvittolage.ts redan bär fältet kanSkickaIgen (styr enbart skickaKvittoIgen, kräver ett REDAN skickat kvitto — fel väg för denna rad). (4) PRD TASK-346 berättelse 12 utlovar radvyn "Kvitto MM-…" med Visa OCH Skicka igen — utfärdat-läget uppfyller inte det. Rätt EF-väg för en aldrig-skickad rad är koaKvitton (samma väg som utfallsregionens egna "Skicka igen"-knapp redan använder, se BetalningsInkorg.tsx § SKICKA IGEN — INTE skickaKvittoIgen, som förutsätter ett redan utskickat kvitto). Bunta även en sidofunnen kongruensbugg i samma komponentyta (orkestrerarens tillägg 2026-08-31 ~10:04): utfallsregionens rubrik böjer fel vid N=1 ("1 kvitto skickade" i stället för "1 kvitto skickat") — jobbDelutfall i inkorg-harledningar.ts rad ~501.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 En kvittorad i läget utfärdat/ej-skickat ("väntar på att skickas") bär en Skicka igen-knapp i InbetalningsLista.tsx-radvyn, med samma EF-väg (koaKvitton) som utfallsregionens befintliga Skicka igen-knapp i BetalningsInkorg.tsx
- [x] #2 Knappen erbjuds ALDRIG för ett redan skickat eller makulerat kvitto, och ALDRIG för en makulerad inbetalning
- [x] #3 Knappen är tillgängligt namngiven per rad (unik per kvittonummer) och utfallet annonseras i en role=status-region
- [x] #4 Härledningen som styr knappen har tester i båda riktningar (rätt implementation + en negativ kontroll som fäller en trasig variant)
- [x] #5 BetalningsInkorg.tsx:s utfallsregion böjer kvitto skickat/skickade korrekt: singular (1 kvitto skickat) vid N=1, plural (N kvitton skickade) vid N>1 — testat för båda formerna
- [x] #6 En inbetalning vars SENASTE kvittojobb (jobb_rad, jobbtyp kvitto) har status 'fel' visar felskälet (jobb_rad.skal) i klartext på raden i InbetalningsLista.tsx (samma visuella klass som makulerings-noten), oavsett om kvittot hann skapas (utfärdat) eller fallerade innan ledger-raden skapades (inget kvitto)
- [x] #7 Den raden erbjuder en Skicka igen/Försök igen-handling som köar om via koaKvitton; datavägen (hamta-inbetalningar) utökas att bära jobbfelet till klienten eftersom den saknar det i dag — ingen migration (jobb_rad.skal finns redan)
- [x] #8 Tvåsidigt test på härledningen: senaste jobbet fallerat -> felskäl synligt + köa-om erbjuds; inget/lyckat jobb -> inget felskäl
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Byggt i PR (gren fix/task-352-fallerat-kvitto-durabel-retry).

DESIGN: panel-harledningar.ts's kvittolage() fick två nya fält: felskal (senaste
kvittojobbets felskäl, null om inget relevant) och kanKoaOm (får raden köas om
via koaKvitton?) — se funktionens och typens egna docblock för de fyra
grenarnas logik. `kvittolage` tar emot jobbfelSkal som TREDJE, valfritt
argument (default null) - lagergränsen hålls: funktionen känner inte till
jobbkön, den TAR EMOT ett redan uppslaget resultat, samma disciplin som
`inkorg-harledningar.ts` håller för klockan.

DATAVÄG (AC #6/#7): hamta-inbetalningar/index.ts frågar nu jobb_rad (samma
tabell hamta-jobbstatus redan läser, objekt_id = inbetalningens id, jobbtyp
'kvitto') och returnerar jobbfel: {inbetalningId, skal}[] för de rader vars
SENASTE jobbrad har status 'fel'. Betalningar.schema.ts's Inbetalningslista
fick fältet (inget .default() - samma "EF missar det => .parse() faller vid
gränsen"-disciplin filen redan bär). Ingen migration - jobb_rad.skal fanns
redan. InbetalningsLista.tsx bygger EN Map för hela listan och skickar
matchande skal ner per rad (aldrig en uppslagning per rad).

AC #3-NYANS (bokförd, inte tyst): "unik per kvittonummer" håller för
utfärdat/skickat-grenarna, men för fallet kvitto===null+felskal (kreditkvitto
som aldrig hann skapas) finns inget kvittonummer att peka på - aria-label
faller då tillbaka på inbetalningsText(inbetalning) (belopp - betalsätt -
datum), som är unikt per rad av samma skäl radens synliga text redan är det.

PREMISSAVVIKELSE mot uppdragets AC-punkt 4 (testformulering "anrop går till
rätt EF med rätt kvitto-id"): den korrekta EF-vägen (koaKvitton) tar
inbetalningIds, inte ett kvitto-id - "kvitto-id" i uppdragstexten var en
terminologisk glidning, inte en avsiktlig annan design. Uppdragets EGNA
huvudinstruktion ("samma EF-väg som utfallsregionens knapp") pekar redan
korrekt på koaKvitton (verifierat i BetalningsInkorg.tsx rad ~416-431 INNAN
någon kod skrevs) - kortets AC följer den verifierade arkitekturen, inte den
enskilda formuleringen.

TESTTÄCKNING: pure-logic-nivå (samma nivå som ALLA befintliga kanVisa/
kanSkickaIgen-tester i denna fil - ingen React-rendering-testinfrastruktur
finns i repot, se package.json). Ingen ny .staging.test.ts skrevs för
hamta-inbetalningars EF-utökning; ingen befintlig konvention testar denna EF
via HTTP mot staging (grep bekräftar noll träffar), och att uppfinna en ny
sådan låg utanför uppdragets avgränsning.

GRINDAR (körda i denna worktree, scopat till de sju rörda filerna där
relevant): typecheck exit 0 (repo-brett). biome check scopat till de sju
rörda filerna: exit 0, 0 fynd (repo-brett `biome check .` ger exit 1 men
ENDAST i filer detta kort aldrig rört - biome.json schema-version-drift +
förbefintliga lint-fynd i base.css/mall-pdf.mjs/DokumentYta.tsx, bevisat
orelaterat via `git diff --stat origin/main...HEAD` = tomt för dessa filer).
check-langa-streck.mjs: OK, 285 filer skannade, 0 ofångade. npm run build:
exit 0. npm run test:api:pure: 1313/1313 gröna (samtliga nya tester
verifierade i utskriften). npm run test:api (fullt, inkl. api-staging): 1814
passed, 4 failed - samtliga fyra UTANFÖR denna diff (generate-event-
attachment.staging.test.ts x2, save-event-content.staging.test.ts,
send-registration-confirmation.staging.test.ts) och matchar EXAKT den redan
bokförda klass-B-flaken i TASK-347 ("rött i full svit men grönt isolerat -
ordnings-/samtidighetsberoende, inte en regression i någon diff").
git diff --stat mot dessa fyra testfiler/deras EF:er = tomt.

Nattgrind-stängning 2026-09-04: DoD bockad mot belägg — samtliga 8 AC redan bockade (mekanisk DoD#1); DoD#2 styrks av Implementation Notes GRINDAR-avsnittet (typecheck/biome/build/check-langa-streck/test:api:pure gröna; test:api-fullsvitens 4 orelaterade fel bokförda som känd TASK-347-flakeklass); DoD#3 verifierat mot git show --stat e879d57b (PR #2176): enbart betalnings-ytans egna filer + tester ändrade.
<!-- SECTION:NOTES:END -->
