---
id: TASK-146.5
title: 'Skiva: Klass B — event-mallad generering ur systemmall'
status: To Do
assignee: []
created_date: '2026-08-07 09:08'
updated_date: '2026-08-10 09:32'
labels:
  - ready-for-agent
dependencies:
  - TASK-146.1
  - TASK-146.4
parent_task_id: TASK-146
ordinal: 244000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Roger slipper skriva om deltagarinformations-brevet för varje kurs — det genereras per event ur en mall och blir en bilaga som vilken annan.

Klass C (kvittot) hör INTE hit — den byggs i TASK-147 tillsammans med kvittonummer-serien.

Täcker användarberättelser: 7
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Ett event-mallat brev genereras ur en systemmall och landar som en bilaga med samma metadata som en uppladdad
- [x] #2 Mallen är INTE redigerbar i v1 — mall-editorn ligger uttryckligen senare
- [x] #3 Svenska tecken korrekta i den genererade filen
- [x] #4 De tre dokumentklasserna är oskiljbara i metadatat: klass A, B och C landar som samma sorts bilaga oavsett hur de uppstod
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
NY EDGE FUNKTION `supabase/functions/generate-event-attachment/index.ts` (produktions-
kapabel, INTE staging-only harness) — genererar en "Deltagarinformation"-PDF ur en
HÅRDKODAD systemmall (AC #2) ifylld med eventets Kursnamn/Ort/Startdatum/Slutdatum,
skriver bytesen till den privata Storage-bucketen "bilagor" (TASK-146.3, service-role)
och skapar en Bilagor-metadatarad (TASK-146.2) via EXAKT samma fyra fält som en klass
A-uppladdning skriver (Namn / 'Storlek (bytes)' / Skapad / Event) — AC #1 + AC #4.

DEPLOYAD manuellt till staging (pqtshyierkdgwdnxuirz), ADR-050. MEDVETET UTELÄMNAD ur
.prod-functions-allowlist.conf tills vidare — ingen UI-yta anropar den ännu
(Åtgärds-sidan/bilageväljaren är PRD:ns kort 3).

SAMTIDIGHETS-KRONOLOGI (premiss-pass, ADR-086) — MÄTT, INTE ANTAGET, i två steg:

1. Vid DESIGN-tillfället (start av bygget): `gh pr view 1090` visade
   `mergeStateStatus: BLOCKED` och jobbet "Lint + Audit + TypeCheck" RÖTT (fail, inte
   pending). Detta AVVEK från uppdragets premiss "kan landa medan du arbetar" (som
   antydde aktiv progression) — en genuin divergens, bokförd öppet i stunden. Byggde
   därför SJÄLVSTÄNDIGT mot fakta som REDAN fanns på main (146.1/146.2/146.3, den
   PRE-EXISTERANDE `_shared/airtable-client.ts`). `gh pr diff 1090` lästes INNAN
   `_shared/field-allowlists.ts` ändrades, specifikt för att undvika en strukturell
   krock: MEDVETET samma operationsnyckel ('create-attachment', tableId 'Bilagor',
   samma fyra fält) som PR #1090:s egen tillagda post.

2. Vid PUSH-förberedelsen (efter lokala grindar gröna): rutinmässig `git fetch`
   (uppdragets egen instruktion, "Kör git fetch + rebase mot färsk origin/main FÖRE
   push") visade att PR #1090 HADE LANDAT (`63e61d2c Merge pull request #1090`,
   commit `0309c5e7`). Byggde om från grunden på FÄRSK `origin/main`:
   - `feat/task-146-5-class-b-event-attachment` skapad direkt från `origin/main`.
   - Egen `field-allowlists.ts`-post TOGS BORT (redan landad av 146.4, identisk
     nyttolast — verifierat rad för rad mot den landade filen innan borttagningen).
   - `index.ts` REFAKTORERAD att importera BILAGOR_BUCKET_ID/EVENTPLANERING_TABLE/
     mapAttachmentRecord/buildAttachmentPath ur `_shared/attachments.ts` (146.4:s
     delade modul) i stället för att duplicera dem — uppdragets egen instruktion,
     TILLÄMPAD efter landningen, inte bara deklarerad i avsikt.
   - `config.toml`/`.purge-staging-policy.json`: mina tillägg lagda EFTER 146.4:s
     egna (ingen namn-/nyckelkollision — 146.4:s 'upload-attachment-sentineler'
     matchar 'ZZ-attachment-test-*', min matchar 'Deltagarinformation –
     ZZ-belaggning-fixtur*' — olika Namn-mönster, ingen semantisk överlappning).
   - Edge-funktionen OMDEPLOYAD till staging efter refaktorn; ALLA grindar
     omkörda från noll på den ombyggda grenen (se nedan) — inget "det funkade
     innan rebase" antaget.

   OVÄNTAT FYND under rebase-reconciliation: min nya `.purge-staging-policy.json`-
   post triggade en BEFINTLIG mekanisk grind jag inte designat (`scripts/check-
   listparitet.sh`, paret `sentinel-markorer` — varje enkelciterad Airtable-formel-
   literal i purge-policyn måste namnges i CONTRIBUTING.md:s sentinel-uppräkning).
   CONTRIBUTING.md uppdaterad (`Deltagarinformation –` + `ZZ-belaggning-fixtur`
   tillagda, "fem" → "sex"). NEGATIV KONTROLL körd på DENNA grind (inte bara min
   egen): tog bort tillägget → grinden FÖLL EXPLICIT med rätt felmeddelande ("finns
   i A men inte i B") → återställde → grön igen. En andra, oplanerad fälla samma
   svep: `MD038/no-space-in-code` (markdownlint) på en trailing space i mitt
   backtick-uttryck — löst genom att ta bort trailing space UR SJÄLVA
   Airtable-formel-literalen (FIND fungerar identiskt utan den, substrängsökning),
   inte genom att fejka backtick-representationen.

ATTACH-MÅL: BELAGGNING_EVENT_ID (permanent fixtur, tests/api/fixtures.ts) — samma
etablerade konvention som create-event-note.staging.test.ts; verifierat LIVE via
Airtable MCP (get_record) INNAN testet skrevs att TASK-146.4:s egna
'ZZ-attachment-test-*'-rader redan länkar till samma event. Eventlabel-formeln
("Ort – Typ – Kursnamn – Datum") embeddar Orten ('ZZ-belaggning-fixtur') → gör den
genererade Namn-strängen naturligt sentinel-matchbar utan ett klient-styrt
test-only-fält (funktionen tar ingen annan input än eventId).

SVENSKA TECKEN (AC #3) — bevisat DUBBELT: (1) manuell sanity-körning mot staging,
PDF sparad + extraherad med `pdftotext -layout` (poppler): "Fjärrskådning", "Här är",
"behöver", "inför", "gärna", "hör", "något", "Hälsningar" — alla å/ä/ö korrekta,
ord-exakt. (2) automatiserat test (samma inflate+WinAnsi-hex-metod som TASK-146.1s
test-pdf-generation.staging.test.ts) mot den FAKTISKT returnerade `pdfBase64`.
NEGATIV KONTROLL körd och reverterad (samma disciplin som TASK-146.1): en medvetet
felaktig rad fick testet att falla tydligt (exit 1, diff i felmeddelandet) —
bevisar att gaten diskriminerar, inte vacuöst passerar.

AC #4 (oskiljbara i metadatat) — mekaniskt fällt i testet: `Object.keys(record.
fields)` asserteras vara EXAKT `{Namn, 'Storlek (bytes)', Skapad, Event}`. Response-
mappningen använder dessutom SAMMA `mapAttachmentRecord`-funktion som klass A
(upload-attachment) — två olika uppkomster genom EN delad mapper, inte två
parallella implementationer som råkar se lika ut.

STÄDNING: samtliga egna testartefakter under bygget (manuell verifiering + fyra
testkörningar) raderade via Airtable MCP + `supabase storage rm` löpande — inget av
mina körningar lämnades kvar i staging. 146.4:s 'ZZ-attachment-test-*'-artefakter
rördes ALDRIG.

DoD-STATUS PER POST:
#1 check — alla 4 AC avbockade.
#2 check — typecheck exit 0, biome check exit 0, build exit 0, `npm run check:docs`
   exit 0 (14/14 gröna — CONTRIBUTING.md-ändringen triggade dokumentations-grinden;
   se samtidighets-kronologins "oväntat fynd"), test:api 506/506 gröna — körd HELT
   OM på den ombyggda grenen (inte bara innan rebase).
#3 LÄMNAS OKRYSSAD — CI grön per jobb är orkestrerarens ansvar efter push.
#4 check — path-scopad `git add` (7 filer: field-allowlists.ts BERÖRS INTE alls
   längre; config.toml, .purge-staging-policy.json, CONTRIBUTING.md, ny EF-mapp,
   nytt testfilnamn, backlog-kortet). Noll rört i src/.
#5 check — PDF-biblioteket redan skarpt verifierat av TASK-146.1 (Done). Samma
   bibliotek/version/font, ingen ny runtime-osäkerhet.
#6 check — NU FAKTISKT SANT, inte längre villkorat: TASK-146.4 landade (#1090)
   INNAN denna skiva pushades. `tests/api/attachment-layer-independence.test.ts`
   (146.4:s mekaniska grind) kördes om på DENNA gren och är grön: "UI-lagret rör
   noll gånger lagrings-API:t direkt" + "BÅDA adaptrarna deklarerar
   uploadAttachment — port-paritet". Denna skivas egen diff rör fortfarande inte
   UI-lagret eller adapter-kontraktet (bär inte kravet själv), men KRAVET SOM
   HELHET är nu mätt sant på den gren detta landar från — skiljer sig från
   146.1/.2/.3:s situation (byggda INNAN 146.4 fanns).
#7 check — NOLL schema-ändringar (inga nya fält, ingen ny tabell) — skrev bara
   data via det REDAN skapade 4-fälts-schemat.
#8 check — VERIFIERAT (inte landat av denna skiva): P28+P29 redan på main sedan
   TASK-146.1 (#855).

AVGRÄNSNING MOT KORTETS TEXT: ingen mall-editor byggd (AC #2 kräver motsatsen).
Ingen UI-koppling (DokumentYta.tsx är uttryckligen KASTBAR prototyp, klausul iv —
rördes INTE). Klass C (kvitto) rörs inte (TASK-147, kortets egen text).
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 PDF-biblioteket skarpt verifierat mot den riktiga edge-runtimen (ej Node-proxy) INNAN övrig arkitektur byggs ovanpå
- [x] #6 Lager-oberoendet mekaniskt fällt: noll direkta lagrings-anrop i UI-lagret + port-paritet i BÅDA adaptrarna
- [x] #7 Bas-additiviteten mätt mot schemat: inga befintliga fält eller tabeller rörda
- [x] #8 Väggkatalogens två attachment-poster landade
<!-- DOD:END -->
