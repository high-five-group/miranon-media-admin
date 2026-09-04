---
id: TASK-147.6
title: 'Skiva: Dokument-ytan mot verklig data + facit-lås'
status: Done
assignee: []
created_date: '2026-08-10 07:02'
updated_date: '2026-08-16 21:35'
labels:
  - ready-for-human
dependencies:
  - TASK-146.4
  - TASK-146.5
modified_files:
  - src/components/dokument/DokumentYta.tsx
  - src/data/mutations/useUploadAttachment.ts
parent_task_id: TASK-147
priority: high
ordinal: 343000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
T131-prototypen (src/components/dokument/DokumentYta.tsx, [PROTOTYPE] S100) skärps mot verkligt fundament: verklig lista i stället för stubbar, uppladdning + ersättning för klass A. Formfrågan (tre klass-grupper vs lista med filter) avgörs mot verklig datafördelning — prototypens egen docblock skjuter beslutet hit. Nattens agent-del: skärpningen + granskningsunderlag. Marcus-delen: formbeslut + facit-lås per promoveringskontraktet (ADR-102/103, plugin 1.33.0), stämpel via !-kanalen (ADR-104) — morgonmoment.

Stödjer användarberättelser 7–8 (bilageväljaren och Dokument-ytan är två vyer av samma objekt, PRD § Implementation Notes).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Dokument-ytan visar verklig data ur fundamentet; uppladdning + ersättning fungerar (klass A)
- [x] #2 Granskningsunderlag klart för Marcus formbeslut (grupper vs lista) med verklig fördelning synlig
- [x] #3 Marcus facit-lås bokfört per promoveringskontraktet (stämpel via !-kanalen, ADR-104)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AGENT-DELEN (natt), klar. Marcus-delen (formbeslut + facit-lås, AC #3) kvarstår.

SKÄRPNING (klass A): src/components/dokument/DokumentYta.tsx läser nu verklig data via dataSource.fetchEventAttachments(eventId) (TASK-147.5-mönstret) i stället för UPPLADDADE-stubben, och laddar verkligt upp via ny mutation src/data/mutations/useUploadAttachment.ts (dataSource.uploadAttachment, TASK-146.4). "Ersätt" byggd UTAN ny backend-yta: en ny uppladdning med samma Namn grupperas klient-sidigt (grupperaPerNamn) som en nyare version — adaptern saknar delete/replace-primitiv, att lägga till ett vore backend-arkitektur utanför detta korts scope.

GRANSKNINGSUNDERLAG (AC #2) — TRE FYND, källmärkta i filens docblock och verifierade live:

Fynd 1: Bilagor-tabellen bär inget dokumentklass-fält (get-event-attachments/index.ts + Attachment.ts docblock) — klass A och klass B är strukturellt odelbara i datan, inte bara i UI:t. Gäller BÅDA kandidatformerna (grupper OCH lista) lika. Ytan gissar INTE klass ur filnamnsmönster (avvisat — hade sett ut som riktig klassificering utan att vara det). Gruppen heter därför "Bilagor för valt event", inte "Uppladdade filer".

Fynd 2: uploadAttachment/fetchEventAttachments är event-scopade (adaptern har ingen "alla bilagor"-metod) — prototypens ospecificerade globala lista matchar inte fundamentet. Ytan bär nu en eventväljare (EventValjare, samma komponent som Åtgärds-sidan).

Fynd 3: "Används i N event" (prototypens anvandsI) är inte byggbart — domänmodellen (Attachment.eventId) läser bara FÖRSTA länkade eventet även om Airtable-fältet är multipleRecordLinks, och ingen adapter-metod lägger till fler länkar. Borttaget, inte fejkat.

VERKLIG FÖRDELNING (live, staging, fixturhändelsen recIFrxHZw165ycXk, mätt 2026-08-16 via get-event-attachments-EF:n direkt): 12 riktiga Bilagor-rader — 9 unika "ZZ-attachment-test-*.pdf" (klass A-liknande, TASK-146.4:s egna staging-sentineler) + 3 st "Deltagarinformation – ZZ-belaggning-fixtur..." (klass B, TASK-146.5:s genererings-sentineler, alla identiskt namn). Talet växte från 9 till 12 under min session — andra agenters parallella staging-tester skrev till samma tabell, bekräftat live. INGEN äkta Lotta-skapad bilaga finns ännu i staging — hela den mätta fördelningen är testsviternas egna sentineler. grupperaPerNamn kollapsar de tre "Deltagarinformation"-raderna till en rad (nyast) + en "Ersatte en tidigare version"-notis (näst nyast); den tredje (äldsta) blir osynlig i listan — ett dokumenterat, endast-en-nivå-djupt konsekvens av att prototypens ersatte-fält är singulärt, inte en kedja.

FORMVÄXEL (à la prototyp-konventionen, EGEN "form"-axel skild från /mer-index-gatens "variant"): ?form=grupper (default, oförändrad struktur) och ?form=lista (ny — flat lista + ToggleButtonGroup-typfilter Alla/Bilagor/Mallar/Generatorer). Båda renderar SAMMA verkliga data. ToggleButtonGroup-primitiven (ADR-044) användes i stället för ad hoc role=group-divs — biome fällde den formen (lint/a11y/useSemanticElements), bytet till den etablerade primitiven är den riktiga fixen, inte en lint-tystning.

KLASS B/C (mallar/generatorer): MEDVETET oförändrade kod-nivå-kataloger — instans-listning hade krävt samma klass-gissning Fynd 1 avvisar, och AC #1 begränsar uppladdning+ersättning till klass A.

VERIFIERAT: typecheck/biome/build/test:api gröna. Renderat verifierat på egen dev-server (port 5176, 5173-5175 upptagna av andra samtidiga agenter/huvudkatalogen) — CORS_ALLOWED_ORIGINS på staging tillåter EXAKT http://localhost:5173 (tidigare dokumenterat i TASK-201.5/TASK-5/TASK-18.6), så port 5176 blockeras strukturellt från riktiga fetches. Löst med tvåkanalig verifiering i stället för att gripa 5173: (a) backend-kontraktet bevisat end-to-end via direkt EF-anrop med riktig TEST_USER-JWT (samma 12 rader som ovan), (b) UI-renderingen bevisad med Playwright page.route()-interception som serverar EXAKT den nyss hämtade riktiga JSON:en (ingen påhittad data) — grupper-formen, lista-formen och typfiltret verifierade renderade korrekt med de 12 raderna, ingen React-krasch, noll nya konsolfel (alla 125 konsolfel på sidan var CORS-blockerade BAKGRUNDS-queries från andra sidor/appens warmup — get-registrations/get-waitlist/get-leads/get-mail-log/get-segments — noll av dem rör Dokument-ytans egna två queries).

SKÄRPNINGSVARV 2 (2026-08-16, Marcus underkännande av varv 1-ytan): fyra AC — (1) husets sidkrom stulet verbatim ur AktivitetsHistorik.tsx § kromKnapp (S106-facitet, senaste husfacit för en /mer-leaf) i stället för AtgardsSida.tsx § Sidhuvud (förkastad — dess mx-4/px-4 hade dubblat AppShell.tsx main-paddingen, samma fel som MailLog.tsx/Intresserade.tsx bär), (2) MessageBox-fyndrutan + slutradens prototyp-text rivna ur renderad UI (fynden kvar i filens docblock + här), (3) form=grupper/form=lista-växeln + DokumentGrupper-funktionen rivna, listan är nu ENDA formen (Marcus-GO), (4) typ-filtret bär nu spread + min-h-11 (ToggleButtonGroup-primitiven, enhetlig bredd) — med Visningsform-växeln riven finns bara EN ToggleButtonGroup kvar på ytan. Verifierat mot renderad yta (egen port 5180, CORS-kringgången ur prototyp-verifiering-runbook.md) mobil 375px + desktop 1440px, sida-vid-sida mot AktivitetsHistorik-facit: identisk chrome-position/storlek. PREMISS-FYND (ej byggt på, bara flaggat): get-event-attachments-EF:n på staging returnerar REDAN ett dokumentklass-fält (Uppladdad/Event-mallad) för recIFrxHZw165ycXk (33 rader, mätt live 2026-08-16) — trots att task-147.12 (som äger fältet) står To Do utan gren. Frontend/domänlagret (Attachment.ts, AirtableAdapter) läser det INTE ännu (oförändrat av mig) så ingen kod-påverkan, men orkestreraren bör veta att backend-sidan av 147.12 verkar redan vara i rörelse.

SKÄRPNINGSVARV 3 (2026-08-16, Marcus FEM kvitterade granskningspunkter, sessionsdok tasks/sessions/archive/2026-08/2026-08-10-session-102.md rad 1043–1052) — src/components/dokument/DokumentYta.tsx:

(a) IKONER BORT framför mallar/generatorer: Sparkles (MallRad) och UserRound (GeneratorRad) borttagna, importer städade. Bilagornas FileText-ikon (BilageRadRow) oförändrad — Marcus punkt gällde uttryckligen bara mallar/generatorer.

(b+d) VISA-KNAPPEN: intent bytt från ghost till primary+emphasis=subtle (tonad bakgrund, samma par som Deltagare.tsx MarkeraKnapp). Löser BÅDA punkterna i samma byte: ghost-hover-token (--mm-button-ghost-bg-hover) var IDENTISK med radgruppens egen --mm-bg-muted bakgrund (grupp-kort), så en verkligt existerande CVA-hover var visuellt osynlig. subtle-varianten (10/16/22% färgmix) syns och har verklig hover-kontrast mot samma bakgrund.

(e) VISA-knappen vertikalt centrerad: self-center på knappen (mallar/generatorer, direkt eftersom DialogTrigger inte renderar egen DOM-nod) resp. på en ny grupperingsspann runt Visa+Ersätt (bilagor) — radens egen items-start orörd.

(c) VISA-BETEENDET — ny VisaKnapp-komponent (DialogTrigger/Modal/Dialog, husets primitiv ADR-044, samma mönster som AtgardsSida.tsx SkickaKvittoKnapp): mallar/generatorer visar ett ärligt producerat exempel (ny ProduceratExempel-komponent, byggd ur redan existerande Mall.fyllerI/Generator.byggsUr — fältnamn + bokstavligt Exempelvärde, ALDRIG en hittepå-instans).

PREMISS-DIVERGENS FLAGGAD, INTE TYST KRINGGÅDD: rekommendationen för BILAGOR (overlay-förhandsvisning ... ladda ner-fallback när förhandsvisning inte går) förutsätter en URL till filens bytes. Verifierat mot koden att ingen sådan finns: Attachment-domänmodellen bär ingen URL, mapAttachmentRecord (_shared/attachments.ts) mappar aldrig en, get-event-attachments/index.ts läser bara Namn/Storlek/Skapad/Event/Dokumentklass, bucketen bilagor är PRIVAT (provision-attachments-bucket.mjs, public:false, ingen storage.objects-policy i supabase/) så en direkt klient-createSignedUrl är stängd, och EN signerad nedladdnings-EF existerar ingenstans i supabase/functions/ (bara uppladdnings-signaturen create-attachment-upload-ticket). Att bygga den primitiven är NY produktions-backend-arkitektur — utanför endast de fem punkterna i detta varvs uppdrag, samma gräns korets EGEN historik drog för Ersätt i varv 1 (byggdes riktigt separat i TASK-147.11). VisaKnapp för bilagor öppnar därför dialogen med ett ärligt MessageBox intent=info (Går inte att öppna här ännu) i stället för en fejkad förhandsvisning eller en trasig nedladdningslänk. En signerad nedladdnings-EF hör till ett eget, separat kort.

VERIFIERAT: typecheck (exit 0), biome (exit 0, 0 fel i denna fil), build (exit 0), test:api (768 passed, exit 0) — alla fyra DoD-kommandon körda i förgrunden på denna gren. Ingen AC checkad i detta varv (AC1/AC2 var redan bockade från varv 1/2; AC3, Marcus facit-lås, är HITL och rörs inte här).

GRANSKNING 3 (2026-08-16): Marcus GODKÄNDE varv 3 estetiskt ('ser nice ut'). FACIT-LÅSET MEDVETET UPPSKJUTET på Marcus order: stämpeln (AC3, !-kanalen) sätts först när task-245 (signerad nedladdnings-EF, bilage-visning) + task-246 (riktigt genererad PDF för klass B/C) landat, så hela Visa-upplevelsen kan dömas i ett svep. Ingen ytterligare granskningsskuld på varv 3 självt.

FACIT-LÅS FÖRBERETT (AC #3s förberedande halva, 2026-08-16): manifest tasks/sessions/bilagor/s102-dokument-konvergens/facit.json skapat med "godkand": null — 5 facit-bilder (listvyn desktop+mobil, Visa-overlayens tre klasser bilaga/mall/kvitto). Listvy-bilderna togs med Playwrights bundlade headless Chromium; de tre Visa-overlay-bilderna krävde en omtagning med channel:'chrome' (systemets riktiga Chrome, PDFium-visare) eftersom bundlad headless Chromium renderade PDF-iframen tom — ingen mockning, samma riktiga staging-data i båda passen. B3-markör "DOKUMENT-YTAN — Mer-ytan där bilagor förvaltas" (docblockets titelrad, DokumentYta.tsx:2) tillagd i .facit-policy.conf § FACIT_PROTO_MARKORER, grep-verifierad unik (grep -rlF, 1 träff) före tillägget, och negativt kontrollprov kört skarpt (markören temporärt borttagen -> check-facit.sh exit 1/rött; återställd -> exit 0/grönt, git diff bekräftat identiskt). check-facit.sh grönt: 9 manifest, 16 ytor, 2 ogodkända (hem + dokument). DoD-kvartetten grön: typecheck exit 0, biome exit 0 (endast pre-existing warnings/infos i orörda filer), build exit 0, test:api 788 passed. Ingen kod i DokumentYta.tsx/appen ändrad av detta pass — enbart manifest + policy-conf + bilder + dessa kortnotes. AC #3 bockas INTE här (stämpeln, godkand-fältet, är Marcus egen handling via !-kanalen ADR-104) — orkestreraren bockar efter CI-verifiering per husets rutin.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
AC3 stängd: Marcus stämplade facit-låset via !-kanalen (ADR-104) 2026-08-16 — facit.json godkand: av marcus, citat "godkänner", sha cc1d7c53 (main, post-merge grön). Orkestrator-bock efter CI-verifiering per husets rutin. Rivningspasset (dev-grinden visaDokumentPrototyp + [PROTOTYPE]-docblock + B3-markören) spawnas som eget pass per S102-sekvensens punkt 1.
<!-- SECTION:FINAL_SUMMARY:END -->
