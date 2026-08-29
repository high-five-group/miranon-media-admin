---
id: TASK-338.3
title: >-
  Skiva: klienten — domän, adapter, RackviddBadge och RackviddsDialog med tre
  axlar och sammanfattningsrad
status: To Do
assignee: []
created_date: '2026-08-29 08:03'
updated_date: '2026-08-29 10:09'
labels:
  - ready-for-agent
dependencies:
  - TASK-338.2
parent_task_id: TASK-338
ordinal: 613000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Efter skivan väljer Lotta i uppladdningsdialogen 'Bara detta event' eller 'Delat dokument — gäller flera event'; under det senare tre valfria Select: Familj ('Alla familjer'), Steg (bara för nivåbärande familj, 'Alla steg') och Plats ('Alla platser', listan ur samma läsväg som Mer → Platser, usePlacesList). En sammanfattningsrad uppdateras live i klartext: 'Gäller: alla event' · 'Gäller: RIM-event i Rönninge' · 'Gäller: alla event i Rönninge' · 'Gäller: RIM-event, Nivå 1, i Rönninge'. Listan visar räckvidden som badge komponerad ur axlarna: 'Alla event' · 'RIM · Nivå 1' · 'Rönninge' · 'RIM · Rönninge' · 'RIM · Nivå 1 · Rönninge'. AttachmentScope blir EVENT | GEMENSAM (adaptern mappar legacy defensivt), Attachment-modellen får plats {id, namn} | null. Husets primitiver (RadioGroup/Select), hideLabel-mönstret, fokusordningen och 44 px-golvet behålls; ingen HTML/matchning i klienten. Ytan bor i facit-manifestet tasks/sessions/bilagor/s108-dokumentytan/facit.json (ostämplat) — ändringarna är avsiktliga per PRD:n, ny baslinje efter Marcus godkännande. Täcker användarberättelser: 1, 4, 5, 6, 7, 11, 12.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Dialogen: två radioval + tre valfria Select med defaults; sammanfattningsraden speglar valet live i de fyra formerna ovan; 'Bara detta event' inaktiverat i räckviddsläget (som i dag); tangentbordsvandring och axe-svep gröna i dokument-rackviddsval.acceptance.test.ts
- [x] #2 Domän + adapter: AttachmentScope EVENT|GEMENSAM, plats i modellen, legacy-mappning på läsvägen testad; typecheck 0 fel; attachment-layer-independence.test.ts grön
- [x] #3 Ytan 'Dokument-ytan /mer/dokument — räckviddsläget (Delade dokument) och eventväljaren' är identisk med facit tasks/sessions/bilagor/s108-dokumentytan/facit.json utom PRD:ns avsiktliga ändringar (tre axlar, sammanfattningsrad, nya badge-former) — avvikelser bokförda i Implementation Notes; aria-/visual-snapshots regenererade via spec-filernas egen mekanism
- [x] #4 RackviddBadge renderar de fem texterna ur axlarna (enhetstest per form); event-egna får 'Detta event' som i dag; badgen syns i eventläget och räckviddsläget — INTE i Åtgärds-sidans bilageväljare (TASK-339, Marcus 2026-08-29 punkt 8)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #4 Prod-schemaändringar endast efter Marcus GO i klartext per tabell (ADR-125 § 8)
- [ ] #5 Deny/allow-test grönt för varje ny eller ändrad EF-operation (sub-fas-mönstret, field-allowlists)
- [x] #6 Lagervakten grön — matchning och validering bor i EF/_shared, aldrig i klienten (ADR-057)
- [x] #7 Facit-granskning mot tasks/sessions/bilagor/s108-dokumentytan/facit.json ytan 'Dokument-ytan /mer/dokument — räckviddsläget (Delade dokument) och eventväljaren': avvikelser utöver PRD:ns avsiktliga ändringar bokförda; ny baslinje tas först efter Marcus godkännande (ADR-074)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Klienten bär nu ADR-125 § 1: AttachmentScope är EVENT | GEMENSAM, Attachment bär plats {id,namn}|null, badgen komponeras ur de tre axlarna och RackviddsDialog har två radioval + tre valfria Select (Familj/Steg/Plats) med en live sammanfattningsrad.

DIVERGENS MOT UPPDRAGET (premiss-passet, ADR-086) — "Nivå 1" vs "Steg 1". Kortets beskrivning och PRD:ns § Implementationsbeslut skriver badge-/sammanfattningsformerna med "Nivå 1", men samma mening säger att steg-etiketten går via befintlig stegEtikett — och den funktionen översätter basvärdet 'Nivå 1' -> 'Steg 1' sedan 2026-08-17 (src/components/dokument/nivaSprak.ts). ORDLISTA.md § Steg är dessutom kategorisk: "Ordet är Steg — aldrig 'Nivå' — överallt". Reglerna slår bokstaven; att rendera "Nivå 1" hade varit en regression av ett landat Marcus-beslut. Byggd form: badge "RIM · Steg 1" / "RIM · Steg 1 · Rönninge", sammanfattning "Gäller: RIM-event, Steg 1, i Rönninge". Orkestreraren bekräftade samma rättelse mid-task (338.5/PR #2089 har redan skrivit ORDLISTA med "Steg 1"). Basvärdet som skickas till EF:en är oförändrat 'Nivå 1'.

DIVERGENS 2 — em-streck i radioetiketten. Kortet skriver "Delat dokument — gäller flera event" (långt streck). scripts/check-langa-streck.mjs (CI-wirad i ci.yml, ej i package.json) fäller långt streck i JSXText, och .langa-streck-policy.json reserverar undantag för tom-markören, inte för text som kan skrivas om. Byggd etikett: "Delat dokument - gäller flera event" (kort bindestreck, Marcus 2026-08-09). Tvåsidigt bevisat: med em-streck exit 1 ("1 långt streck ... DokumentYta.tsx:2245"), med kort bindestreck exit 0 (263 filer skannade).

DIVERGENS 3 — skarv-markören kan inte rivas härifrån. Uppdraget säger att tests/api/attachment-staging-schema.ts ska RIVAS i denna skiva. Filen finns bara på den olandade 338.2-grenen (49e32d9f), inte i denna skivas bas (main c7366aba) — den går alltså inte att ta bort i denna PR. ÖPPEN SKULD för orkestreraren: riv den när både #2084 och denna PR landat. Den blir harmlös men inaktuell (AttachmentSchema bär nu plats strikt-lenient och rackvidd normaliserad); AttachmentSchema är MEDVETET kvar som ren ZodObject (ingen top-level .transform) just för att dess .extend() i den filen inte ska sluta kompilera när båda landar.

DIVERGENS 4 (mindre, ej blockerande) — radnummer/mekanism i uppdraget. RackviddsDialog låg på rad 2091, inte ~1906-2100. Nivåbärande familj bärs av KURSFAMILJ_MED_NIVAER (DokumentYta.tsx rad 300), inte av KURS_KARTA (den bor i supabase/functions/_shared/course-dimensions.ts och rör event-sidan). Status.ts:117-120, usePlacesList, RackviddsDialog-primitiverna och skarvarna stämde exakt.

AVSIKTLIGA YT-ÄNDRINGAR MOT FACIT (AC #3), yta "Dokument-ytan /mer/dokument — räckviddsläget (Delade dokument) och eventväljaren", manifestet ostämplat (godkand: null) så ingen ny baslinje tas:
1. Badgen skriver inte längre ut TOMMA axlar. "RIM · Alla steg" -> "RIM". Tvingat av kortets egen formlista: "RIM · Rönninge" (familj+plats utan "Alla steg" emellan). Konsekvent regel: badgen visar vad som BEGRÄNSAR; den fulla nyansen bor i dialogens sammanfattningsrad.
2. Dialogen: tre radioval -> två; ny sammanfattningsrad; tre selects i stället för två; ledtexten "Välj en familj för att gå vidare." RIVEN (noll axlar är giltigt sedan ADR-125 § 1, så "Ladda upp" är aldrig avstängd av räckviddsskäl).
3. RESERVERAT TOMRUM VÄXER — flaggat för Marcus QA. TASK-309.23:s geometrilås ("rutan aldrig ändrar storlek och läge", Marcus 2026-08-26) kräver att axel-blocket alltid renderas och bara döljs med invisible+inert. Med tre selects + sammanfattningsrad är den reserverade ytan i "Bara detta event"-läget större än den enda rad 309.23 reserverade. Alternativet vore en dialog som hoppar, vilket Marcus uttryckligen avvisat — men tomrummet är en synlig konsekvens som förtjänar hans blick.
4. Selectarna staplas (ingen sm:flex-row). Tre triggers sida vid sida i en 28rem-dialog ger ~128 px var och trunkerar "Alla familjer"/"Alla platser" redan i nolläget; en brytpunkt hade dessutom gjort geometrilåset viewport-beroende.
5. Varje axel har ett EXPLICIT nolläge ("Alla familjer"/"Alla steg"/"Alla platser") i stället för en platshållare — react-aria Select har ingen rensa-knapp, och med valfria axlar måste vägen tillbaka finnas.

SNAPSHOTS (AC #3): ingen aria-referens finns för ytan (facit.json deklarerar frånvaron explicit, "referenser": []), och ingen pixelbaslinje är committad för dokument-yta.png/dokument-yta-kontrast.png — de föds i CI (visual-baselines.yml, CONTRIBUTING.md § Visuell regression), aldrig lokalt av en agent. Spec-filens fixturer är uppdaterade till 'Gemensam'; baslinjen följer spec-filens egen mekanism.

LAGERVAKTEN (DoD #6): ingen matchning i klienten. rackviddsText.ts FORMULERAR filtret (två rena strängfunktioner); normaliseraRaAttachment översätter legacy-VÄRDEN vid datagränsen (ADR-026) och avgör aldrig vilka event något gäller. Matchningen ligger kvar i supabase/functions/_shared/rackvidd-matchning.ts. attachment-layer-independence.test.ts grön (7/7).

LÄSVÄGENS LEGACY-TOLERANS (AC #2): normaliseraRaAttachment körs FÖRE varje AttachmentSchema.parse och paras i parsaAttachment/parsaAttachments så den inte kan glömmas på något av adapterns fem parse-ställen. Nödvändig eftersom (a) prod-raderna migreras först i 338.6 och (b) EF:en med 338.2:s mapAttachmentRecord inte nödvändigtvis är deployad när klienten kör. plats är .nullable().optional() av samma stale-deploy-skäl som mall/kallhash.

"ERSÄTT" BÄR NU PLATS-AXELN. Utan den hade ett filbyte på Rönninge-parkeringsbilagan laddat upp den nya filen som Gemensam med noll axlar = ALLA event — en tyst uppvidgning, precis den skada PRD berättelse 3 finns för att förhindra. Båda anropsställena (BilageRadRow, GemensamBilageRadRow) och ReplaceAttachmentInput/mutationFn uppdaterade.

FIXTURVÄRLDEN: get-places saknade handler. Dialogen läser usePlacesList vid varje öppning, så utan den faller hermetik-vakten på ett omockat EF-anrop. PLACES_RESPONSE (Rönninge/Falköping/Gotland, PRD:ns egna orter) + handler tillagda i tests/support/fixturvarld/.

EJ RÖRDA MED AVSIKT: supabase/ (338.2 äger EF:en), scripts/seed-dokument-fixture.mjs (skriver legacy-värden mot staging via EF:en, som fortfarande accepterar och normaliserar dem på skrivvägen).

GRINDAR (nakna exitkoder, mätta): typecheck 0 · biome 0 · build 0 · test:api:pure 0 (860 test, varav nya tests/api/rackvidds-text.test.ts 25 och attachment-layer-independence 7) · check-langa-streck 0 (263 filer) · check-facit 0 · acceptance --workers=1 över dokument-* + atgarder-bilageval-send: 68 passed, exit 0. En flake observerad i ett mellanliggande varv (dokument-forhandsgranskning-popup-policy, ERR_CONNECTION_REFUSED på page.goto — dev-servern, inte ett assert); grön i isolerad omkörning och i den slutliga batchen.
<!-- SECTION:NOTES:END -->
