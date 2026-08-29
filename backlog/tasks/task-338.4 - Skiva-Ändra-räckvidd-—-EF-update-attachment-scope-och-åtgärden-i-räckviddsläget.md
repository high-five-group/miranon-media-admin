---
id: TASK-338.4
title: >-
  Skiva: Ändra räckvidd — EF update-attachment-scope och åtgärden i
  räckviddsläget
status: To Do
assignee: []
created_date: '2026-08-29 08:04'
updated_date: '2026-08-29 12:24'
labels:
  - ready-for-agent
dependencies:
  - TASK-338.2
  - TASK-338.3
parent_task_id: TASK-338
ordinal: 614000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Efter skivan kan Lotta i räckviddsläget (Delade dokument) välja 'Ändra räckvidd' på en delad bilaga: samma RackviddsDialog öppnas förifylld med bilagans axlar, hon ändrar och sparar, raden uppdateras med ny badge utan att filen laddas om. Ny EF update-attachment-scope (operation registrerad i field-allowlists med deny/allow-test enligt sub-fas-mönstret) tar attachmentId + samma räckviddsparametrar som skrivvägen, med vakter: endast rader med Räckvidd ≠ Event, endast uppladdade filer (Dokumentklass), Plats existenskontrollerad. Ur ett events kontext förblir delade bilagor oredigerbara (ADR-118 beslut 3). De två dokument Marcus laddade upp 2026-08-29 som 'Alla event' omklassas via denna åtgärd i TASK-338.6/7 — inte via basen. Täcker användarberättelser: 8, 10.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 EF update-attachment-scope deployad i staging; staging-test bevisar: ändra Alla event → Plats Rönninge (raden bär ny länk), ändra tillbaka, avvisa Event-egen rad (403/4xx), avvisa okänt plats-ID, 401/404/405/CORS-baslinjen
- [x] #2 Operationen registrerad i field-allowlists; deny/allow-testet grönt i båda riktningar (bevis att ett fält utanför allowlisten fälls)
- [x] #3 UI: 'Ändra räckvidd' finns bara på delade rader i räckviddsläget, öppnar dialogen förifylld, sparar optimistiskt enligt husets mutation-mönster, felväg i notistrappans form; acceptance-test med MSW + axe grönt; inte synlig i eventläget (testat)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #4 Prod-schemaändringar endast efter Marcus GO i klartext per tabell (ADR-125 § 8)
- [x] #5 Deny/allow-test grönt för varje ny eller ändrad EF-operation (sub-fas-mönstret, field-allowlists)
- [x] #6 Lagervakten grön — matchning och validering bor i EF/_shared, aldrig i klienten (ADR-057)
- [x] #7 Facit-granskning mot tasks/sessions/bilagor/s108-dokumentytan/facit.json ytan 'Dokument-ytan /mer/dokument — räckviddsläget (Delade dokument) och eventväljaren': avvikelser utöver PRD:ns avsiktliga ändringar bokförda; ny baslinje tas först efter Marcus godkännande (ADR-074)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Lotta kan nu rätta en felklassad delad bilaga i räckviddsläget: "Ändra räckvidd" öppnar samma RackviddsDialog förifylld med radens tre axlar, hon ändrar och sparar, och raden byter badge utan att filen laddas om. Ny EF update-attachment-scope bär skrivningen; tomma axlar RENSAS.

DIVERGENS 1 (blockerande, löst) — BASEN SAKNADE 338.2. Uppdraget sade "merga INTE in main" och pekade SAMTIDIGT på #2084 (TASK-338.2, 49e32d9f) som förebild för skrivvägen. #2084 landade i main EFTER att 338.3-grenen (b89afbaf) skapades, så den anvisade basen saknade _shared/rackvidd-matchning.ts, ATTACHMENT_SCOPE_GEMENSAM och plats-axeln i AttachmentScopeInputSchema/mapAttachmentRecord — allt denna skiva bygger på. Utan mergen gick skivan varken att bygga eller verifiera (staging bär main, så 275.2-formade testfiler hade gett falska röda). Mätt före handling: git merge-tree HEAD origin/main gav exit 0 UTAN konfliktblock. Mergade in origin/main (6583420c) med motiveringen i commit-meddelandet. Orkestreraren skickade senare samma order (ny bas 5ecedc21), som mergades in separat.

MERGE-SHA (orkestrerarens korrektion 1): 2bb60eb4 — merge av feat/task-338-3-klient-rackvidd-tre-axlar @ 5ecedc21 in i denna gren. TRE konflikter, alla i adaptrarnas typimport-lista (UpdateAttachmentScopeInput vs 340.2:s SkapadEventBilaga): BÅDA sidor bevarade, alfabetiskt sorterade (S före U). Verifierat efter lösning: båda symbolerna finns i alla tre filerna, båda metoderna kvar i DataSourceAdapter. Ingen konflikt i DokumentYta.tsx (auto-merge).

MÄTT SIDOFYND ur mergen, ej mitt: dokument-generering-fonster-direkt.acceptance gick 9 -> 8 test. Spårat till TASK-340.2 (c752bcd3 + a8f886da) som kom in via basgrenens main-merge — git log 45e6f143..HEAD för den filen visar bara de två 340.2-commitsen. Inget tappat av denna skiva.

KORREKTION 2 (skarv-markören) — GENOMFÖRD. Jag hade först RIVIT tests/api/attachment-staging-schema.ts helt (uppdragets ursprungliga ordalydelse) och lagt de fyra sviterna på klientens parsaAttachment. Orkestrerarens korrektion är RÄTT och jag hade själv noterat förlusten: klientens plats-fält är MEDVETET .nullable().optional() (stale-deploy-skälet), så en rak återgång hade gjort staging-sviterna BLINDA för en EF som glömt bära plats-axeln. Filen är nu SMALNAD i stället: rackvidd-vidgningen riven (domänschemat bär GEMENSAM sedan 338.3 och är strikt STARKARE — okänt värde fälls i stället för att glida igenom som fri sträng), plats-överskrivningen KVAR strikt, filhuvudet omskrivet med "två sidor, två avsikter"-resonemanget. Alla fem staging-sviter (de fyra befintliga + min nya) importerar markören.

EF:EN — update-attachment-scope, deployad till staging (npx supabase@2.115.0 functions deploy --project-ref pqtshyierkdgwdnxuirz, exit 0, ENDAST denna funktion). Body { attachmentId, rackvidd, kursfamilj?, kursniva?, plats? }. AttachmentScopeInputSchema IMPORTERAS från _shared/attachments.ts, aldrig duplicerad. Registrerad i config.toml (verify_jwt = true); STÅR EJ i .prod-functions-allowlist.conf — prod är TASK-338.6:s HITL-moment.

VAKTERNA BOR I EN REN FUNKTION, och det är ett testbarhets-beslut. provaRackviddsbyte (_shared/rackvidd-matchning.ts) bär de tre rad-beroende hindren: ej-gemensam (403), fel-dokumentklass (403), ankar-flytt (409). Skälet: fel-dokumentklass går INTE att framkalla via någon EF vi har — generate-event-attachment skriver Dokumentklass Event-mallad men ALDRIG något Räckvidd (verifierat: noll Räckvidd-skrivningar i den filen), så en sådan rad fälls redan av ej-gemensam och ett staging-test hade bevisat FEL vakt medan det såg grönt ut. Kombinationen är ändå nåbar i drift (ADR-063: basen är en leverabel Marcus/Lotta arbetar direkt i). Vakten är alltså flyttad dit den ÄR bevisbar (ADR-057), inte försvagad. ATTACHMENT_CLASS_*-konstanterna flyttade till samma zod-fria fil och re-exporteras ur attachments.ts — noll importsatser ändrade, samma flytt 338.2 gjorde för scope-konstanterna.

ANKAR-INVARIANTEN (409) — en vakt uppdraget inte bad om, men som skivan kräver. buildStorageAnchor härleder storage-path ur radens EGNA fält och beror inom Gemensam-grenen på Kursfamilj (kurstyp/<slug> när satt, annars alla-event). Ett familje-byte som flyttar ankaret hade lämnat bytesen på den gamla pathen medan get-attachment-download-url och delete-attachment härledde den nya — filen blir TYST oöppningsbar OCH oraderbar. 409 och inte 400: anropet är välformat, det är radens lagringsläge som står i vägen. ÖPPEN BEGRÄNSNING, bokförd inte gömd: den fulla lösningen (flytta bytesen med _shared/storage-kopiera.ts) hade gjort skivan till två. Träffar i praktiken bara den som byter FAMILJE-axeln; hela skivans syfte (plats-axeln) rör aldrig ankaret, vilket är ett eget testfall.

RENSNINGSFORMEN ÄR MÄTT MOT STAGING, INTE GISSAD (CLAUDE.md § Airtable-schema före write). Egen ZZ-sentinelrad, skapad och raderad i samma körning: PATCH { Kursfamilj: null, Kursnivå: null, Plats: [] } gav 200 och en efterföljande GET visade alla tre fälten HELT BORTA ur fields. Mätt samtidigt: PATCH-svaret BÄR Platsnamn-lookupen direkt (Plats [rec17l2c64foUy6WU] -> Platsnamn ["Rönninge"]), så EF:en behöver ingen extra hämtning för att svara i mapAttachmentRecord-form.

TVÅSIDIGT BEVIS FÖR RENSNINGEN (den kritiska nya semantiken), mätt i två armar mot staging: ARM A = CREATE-formen (buildScopeFields, utelämnar tomma axlar) LÄMNADE Kursfamilj RIM och Plats Rönninge KVAR efter PATCH. ARM B = den byggda buildScopeUpdateFields RENSADE båda. Utfall: A false / B true, exit 0. Det är precis skillnaden mellan "Lotta kan bredda RIM · Rönninge till bara Rönninge" och en tyst kvarstående begränsning.

TVÅSIDIGT BEVIS FÖR KLIENTEN (mutation): förifyllningen av familje-axeln borttagen ur RackviddsDialog -> acceptance-sviten föll på EXAKT två test ("dialogen öppnar FÖRIFYLLD" och "Rönninge -> alla event"), 30 passed / 2 failed, exit 1. Efter revert 33 passed, exit 0.

TVÅSIDIGT BEVIS FÖR ALLOWLISTEN (AC #2). Deny-riktningen bevisas RENT och inte mot staging, av ett strukturellt skäl: EF:en bygger fields SERVER-SIDE ur ett Zod-validerat schema, så en klient kan aldrig NÅ ett fältnamn utanför listan — ett staging-anrop hade fällts av Zod långt före findDisallowedField och bevisat FEL grind. Fem rena fall i rackvidds-byte.test.ts: operationen registrerad + de fyra axel-fälten passerar + var och en av create-attachments ÅTTA övriga fält fälls + lookup-fältet Platsnamn fälls + ett extra fält fälls även när de fyra giltiga finns med. Allow-riktningen bevisas SKARPT av staging-sviten: en lyckad ändring betyder per konstruktion att alla fyra fälten passerade (ett saknat fält hade gett 400, inte 200). EGEN operationsnyckel, inte återanvänd create-attachment — minsta privilegium: fyra fält mot create-listans tolv.

MISSLYCKAT FÖRSÖK, bokfört: jag deployade en MUTERAD EF (rensningen ersatt av CREATE-formen) för att bevisa fällningen skarpt. Staging-preflighten stoppade körningen korrekt (CI höll staging, post-merge.yml körning 33251308685). Jag körde INTE med MM_STAGING_PREFLIGHT=off — det skyddsräcket finns för att en lokal körning inte ska ge falskt rött på det landade trädet. Den korrekta EF:en återdeployades OMEDELBART (exit 0) och verifierades (14 passed). Mutationsbeviset togs i stället som den två-armade Airtable-mätningen ovan, som prövar exakt samma påstående på den nivå där det faktiskt bor.

KLIENTEN. DataSourceAdapter.updateAttachmentScope + AirtableAdapter (postEdgeFunction, parsaAttachment vid datagränsen, inaktuell: null som syskonen) + SupabaseAdapter-stub (ADR-056-symmetrin). Mutationen useUpdateAttachmentScope är husets ENDA optimistiska bilage-mutation, efter ADR-016:s fem-komponents-mönster (useUpdatePersonFlag som mall). Skälet att den ÄR optimistisk när syskonen inte är det: den flyttar ingen fil, bara tre fält på en rad som redan finns.

LAGERVAKTEN I MUTATIONEN (DoD #6) — den optimistiska uppdateringen rör BARA queryKeys.attachments.gemensamma, aldrig byEvent. Räckviddslistan innehåller raden oavsett axlar, så badgen kan skrivas där utan att veta något om matchning. Ett events lista är däremot resultatet av EF:ens matchare — att optimistiskt lägga till/ta bort bilagan där hade krävt att klienten SJÄLV avgör vilka event en räckvidd träffar, exakt vad ADR-057 förbjuder. Event-listorna synkas av onSettled-invalideringen, från servern. attachment-layer-independence.test.ts grön (7/7).

DIALOGEN BÄR TVÅ LÄGEN via en DISKRIMINERAD UNION (lage: uppladdning | andra-rackvidd), inte via valfria props — med filer?: FileList + initial?: … hade typen tillåtit båda samtidigt eller ingendera. Gemensamt: frågan, axlarna, defaults, sammanfattningsraden, geometrilåset. Skiljer: förifyllning ur radens axlar; "Bara detta event" ALLTID avstängd i ändra-läget (EF:en svarar 400 på räckvidd Event — ett valbart alternativ vore en fälla); felet bor INUTI dialogen (uppladdningens bor på sidan eftersom den dialogen rivs vid framgång, ändra-dialogen står kvar tills servern sagt ja). platsNamn skickas som tredje argument till onBekrafta — dialogen har redan platslistan, så alternativet hade varit en andra usePlacesList-prenumeration på hela sidan.

ÅTGÄRDEN I RADEN: femte ikonknappen i GemensamBilageRadRow, placerad MELLAN Ersätt och Radera (minst till mest ingripande; Radera behåller sin yttersta plats sedan 275.3). Target-ikonen: Files är upptagen av räckviddslägets väljare, Layers av segment-byggaren, och Settings/Pencil hade lovat generell redigering. 5 × 44 px + 4 × 2 px = 228 px mot radens tidigare 182 px; ikonkolumnen är shrink-0 i en flex-wrap-rad (309.20) så bredden bryter i stället för att trängas. 44 px-golvet orört. FLAGGAT FÖR MARCUS QA vid smal skärm.

DIVERGENS 2 — check-langa-streck FÄLLDE MIG en gång, på min egen aria-description ("familj, steg och plats — tomma val"), exit 1 med rad-referens. Omskriven till punkt i stället för streck; grinden därefter exit 0, 266 filer. Grinden är alltså bevisat levande på denna diff, inte bara grön.

GRINDAR PÅ DEN MERGADE KODEN (nakna exitkoder, mätta):
typecheck 0 · biome 0 · build 0 · check-langa-streck 0 (266 filer) · check-facit 0 · test:api:pure 0 (947 test; nya rackvidds-byte.test.ts 25 fall, attachment-layer-independence 7/7) · staging bilage-sviterna 0 (95 passed över update-attachment-scope 13, upload-attachment, delete-attachment, get-event-attachments, attachment-upload-large, get-attachment-download-url) · acceptance dokument-* + atgarder-bilageval-send --workers=1: 0 (82 passed, varav dokument-rackviddsval 33 inkl. mina 8 nya).

SKULD 2 BETALD: attachment-upload-large.staging.test.ts förväntade Räckvidd === 'Kurstyp' efter en legacy-Kurstyp-uppladdning. Sedan #2084 normaliserar buildScopeFields värdet på vägen IN, så basen bär 'Gemensam' med Kursfamilj bevarad. Förväntan, testnamnet och filhuvudets punkt 5 uppdaterade. Staging-klassen var röd på main tills detta landade.

DoD #4 (prod-schemaändringar efter Marcus GO): EJ TILLÄMPLIG i denna skiva — inga prod-operationer utförda, ingen prod-allowlist-post. Prod-halvan är TASK-338.6.

EJ GJORT, per uppdrag: PR:en är INTE armerad. Kortet är inte satt till Done.
<!-- SECTION:NOTES:END -->
