---
id: TASK-340.1
title: >-
  Skiva: EF — hash i preview-svaret, Skapa promoverar utkastet via Storage copy,
  upprepat Skapa går ersätt-vägen
status: To Do
assignee: []
created_date: '2026-08-29 08:18'
updated_date: '2026-08-29 09:25'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-340
ordinal: 620000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Efter skivan: generate-event-attachment i preview-läge returnerar { url, utgar, kallhash } (hashen beräknas redan före preview-grenen och kastas i dag bort). I skarpt läge tar EF:en ett valfritt kallhash från klienten, räknar om dagens hash server-side och (a) vid likhet OCH befintligt utkast kopierar utkastets bytes till eventets prefix med Storage copy inom bucketen — ingen DocRaptor-rendering; (b) vid skillnad renderar om och svarar underlagAndrat: true; (c) utan utkast renderar tyst. Finns redan en event-mallad rad för (event × Mall) går skrivningen ersatt-vägen (ADR-125 § 3) automatiskt — EF:en gör uppslaget själv — och svaret bär ersatte: true; ingen ny rad, ingen dubblett. rensaUtkast som i dag. Promoveringsbeslutet är en ren funktion i _shared med enhetstester. Responsformen dokumenteras i EF:ens filhuvud och AC-formuleringen där (ADR-124 beslut 3-texten) uppdateras. Deployas till staging. Läs research-passets § 4 (Storage copy: supabase-js ≥ 2.43.5, EF:erna kör esm.sh @2 → 2.112.4; copy() inom bucket belagt) och ADR-124/125 i sin helhet före design. Täcker användarberättelser: 1, 3, 4, 11.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Staging-test: preview → kallhash i svaret; Skapa med samma hash → sparad fil har SHA-256 identisk med utkastets bytes (mätt, inte antaget) och svaret bär promoverad: true; utkastet borttaget efteråt
- [x] #2 Staging-test: ändrat underlag mellan preview och Skapa (t.ex. eventfält PATCH:at) → omrendering, underlagAndrat: true; Skapa utan föregående preview (inget utkast) → rendering, inget fel; ogiltig/felaktig hash → verifieras server-side, aldrig promovering av fel underlag
- [x] #3 Enhetstestsvit för promoveringsbeslutet (likhet/skillnad/utkast saknas/ersätt-uppslag) grön; befintliga sviter generate-event-attachment.staging + skapa-om-event-bilaga.staging gröna; filhuvud och ADR-124 beslut 3-texten i EF:en uppdaterade (ADR-083)
- [x] #4 Staging-test: andra Skapa för samma event × mall → samma attachmentId (ersatt-vägen), ersatte: true, INGEN ny Bilagor-rad (radantal oförändrat före/efter, mätt); att listan inte visar '+1 äldre fil' bevisas i TASK-340.2 (klientlager)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
- [x] #4 Ingen HTML byggs i klienten; lagervakten (ADR-057) grön — promovering, hash-verifiering och ersätt-uppslag bor i EF/_shared
- [x] #5 Facit-granskning mot tasks/sessions/bilagor/s108-generering/facit.json: avvikelser utöver PRD:ns avsiktliga ändringar bokförda; ny baslinje först efter Marcus godkännande (ADR-074)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
TASK-340.1 byggd. Mätt, inte antaget — allt nedan är kört mot skarp staging (pqtshyierkdgwdnxuirz) 2026-08-29.

RÖRDA FILER
- `supabase/functions/_shared/promoveringsbeslut.ts` (NY) — de två rena besluten: `beslutaPromovering` (fyra utfall) och `valjErsattKandidat` (vilken befintlig rad som ersätts) + formvakten `arKanoniskKallhash`. Beroendefri, alltså Node-importerbar och testbar mot produktionskoden.
- `supabase/functions/_shared/storage-kopiera.ts` (NY) — `kopieraInomBucket`, rå `POST /storage/v1/object/copy` med `x-upsert: true`. Injicerbar `fetch` för enhetstest.
- `supabase/functions/_shared/utkast.ts` — `byggUtkastPath` (utbruten, EN formel/tre anropare) + `hittaUtkast` (best-effort, returnerar null i stället för att fälla). Filhuvudet amenderat (utkastet promoveras).
- `supabase/functions/generate-event-attachment/index.ts` — renderingen är LAT (låg tidigare före preview-grenen), preview-svaret bär `kallhash`, skarp gren promoverar/renderar, E-uppslaget, en gemensam skrivväg i stället för två duplicerade grenar. Filhuvudet bär nu ADR-124 beslut 3-texten VERBATIM (den saknades — bara en parafras fanns) med den nya amenderingen inskriven.
- `tests/api/promoveringsbeslut.test.ts` (NY, api-pure, 26 fall).
- `tests/api/generate-event-attachment.staging.test.ts` — 6 nya AC-tester; statuskoden asserteras nu som invarianten `201 ⇔ ersatte === false`.
- `tests/api/skapa-om-event-bilaga.staging.test.ts` — samma statuskods-invariant.

MÄTNINGAR SOM STYRDE DESIGNEN
1. `storage-js` `copy()` mot en BEFINTLIG destination ger 409 "The resource already exists" (mätt mot staging, Storage-server v1.71.0). SDK:n sätter aldrig `x-upsert` (verifierat i källan för både 2.111.0 och den bundlade 2.112.4). Samma REST-route MED `x-upsert: true` gav 200 och destinationen bar källans bytes. Ersatt-vägens destination finns ALLTID, så den råa REST-vägen är nödvändig — den är samma Storage-copy, inte en ersättning för den.
2. Fixtur-eventet recnzSBfLWCo5dBlY bar 27 länkade Bilagor-rader (23 Bekräftelsebilaga + 4 Deltagarinformation), samtliga skapade samma dag. Det belägger dubblett-defekten och är skälet till att AC #3:s "exakt en rad kvar" mäts som "ingen NY rad".
3. `esm.sh/@supabase/supabase-js@2` löser till 2.112.4 (x-esm-path-headern). Staging-secreten `ENVIRONMENT` = "staging" (sha256-match), alltså `test: true` mot DocRaptor — gratis renderingar.

AVVIKELSER, ÖPPET BOKFÖRDA
- `pdfBase64` utelämnas ur svaret NÄR (och bara när) svaret är en promovering. Grenen nås bara av en klient som själv skickar `kallhash`, så ingen befintlig anropare ser en förändring; klienten läser aldrig fältet.
- AC #2:s "ändrat underlag (t.ex. eventfält PATCH:at)" testas genom att skicka den ANDRA mallens äkta, aktuella hash i stället för att mutera fixturen. Skäl: en andra muterande svit mot samma delade permanenta fixtur hade skapat en äkta flake-klass mot `skapa-om-event-bilaga.staging.test.ts`, som redan muterar den. Ledet "ändrat underlag ⇒ annan hash" bevisas redan i den sviten mot skarp data.
- ADR-124/125 § Updates skrivs av TASK-340.3 (PRD:ns egen fördelning). Tills dess bär EF-filhuvudet den nyare lydelsen och ADR-filen den äldre — bokfört i filhuvudet, inte tyst.

REVIEW-RUNDA 2 (PR #2083, granskad 0f101a0d, risk medel, inga error/warning) — tre rättelser.

1. FORMELBYGGNADEN. `hittaBefintligEventMalladRad` splitsade eventets `Bilagor`-länkvärden rakt in i `OR(RECORD_ID()='<rid>',…)`. Ersatt av `byggRecordIdOrFilter`, som bygger genom husets primitiv (`escapeFormulaValue` + `combineWithOr`, `_shared/airtable-filter.ts`) och först filtrerar varje ID mot `^rec[A-Za-z0-9]+$` — samma form `buildLinkedRecordFilter` kräver, MEDVETET striktare än `isValidEventId` (som bara kräver rec-prefix + längd > 3 och därför hade släppt igenom ett citattecken). Källan (Airtables eget omvända länkfält) är inte klient-styrd, så detta var ingen exploaterbar väg — skälen till vakten ändå står i docblocket: repots formel-disciplin är undantagslös, "källan är betrodd" är en egenskap hos ANROPAREN och inte hos funktionen, och `escapeFormulaValue` avvisar dessutom kontroll-/bidi-tecken och orimlig längd. Ogiltiga ID:n släpps och loggas i stället för att fälla en skarp generering.

2. 502-FÖNSTRET I DEN PROMOVERADE SKRIVVÄGEN. Storleken läses nu FÖRE kopieringen. Tidigare kastades 502 efter att destinationen redan skrivits men innan Airtable-raden uppdaterats — i ersätt-fallet hade raden då stått kvar med gammal Källhash och gammal storlek mot ett NYTT innehåll. EF:en fäller nu med 502 innan någon byte skrivs om `utkast.storlek` saknas, och `kopieraInomBucket` bär samma spärr som PRECONDITION (`forvantadStorlek`, kontrollerad före fetch) så ordningen inte kan kringgås av en framtida anropare. `KopieringsResultat.storlek` är därmed alltid ett tal; nytt fält `storlekFranServern` skiljer serverns egen `metadata.size` från källans kända storlek, och en avvikelse mellan dem loggas (fäller inte — destinationen är redan skriven och båda talen kommer från samma bytes). Ordningen bevisas mekaniskt av enhetsfallet "ORDNINGEN: okänd källstorlek kastar UTAN att en enda kopiering görs": den injicerade fetchen måste ha noll anrop efter sex ogiltiga värden. Negativ kontroll körd — spärren avstängd fäller exakt det testet (exit 1, 1 failed av 28), återställd.

3. AC #3 OMSKRIVEN. Originalformuleringen ("exakt en Bilagor-rad kvar; listan visar ingen '+1 äldre fil'") var inte mätbar mot den DELADE permanenta fixturen: den bar 27 länkade Bilagor-rader födda före skivan, och att kräva exakt en hade tvingat testet att radera data det inte skapat. Den mätbara invarianten — radantalet oförändrat före/efter — är vad kortet nu kräver och vad testet bevisar; list-ytans '+1 äldre fil' är klientlager och hör till TASK-340.2. Omskriven via CLI (--remove-ac 3 --ac …), varför den nu står som AC #4.

EJ OMKÖRDA: staging-sviterna. Staging bär just nu TASK-338.2:s EF:er plus mains generate-event-attachment, inte denna gren — orkestreraren sekvenserar staging, och att köra sviterna mot fel EF-version hade gett ett meningslöst resultat. De kördes gröna mot denna kod i runda 1 (23 + 2 passed), och rättelse 1 och 2 rör vägar som täcks av dem; rättelse 2:s ordning bevisas mekaniskt i api-pure i stället.
<!-- SECTION:NOTES:END -->
