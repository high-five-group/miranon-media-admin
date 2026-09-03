---
id: TASK-368.3
title: >-
  Skiva: Anmälans sida — Avboka anmälan med bekräftelsesteg, skäl, betalläge och
  återbetalningsväg, samt Återta avbokning (facit-amendering ADR-102)
status: To Do
assignee: []
created_date: '2026-09-03 07:57'
updated_date: '2026-09-03 09:43'
labels:
  - ready-for-agent
dependencies:
  - TASK-368.2
parent_task_id: TASK-368
ordinal: 669000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Beteende ände-till-ände: Lotta öppnar en anmälan, trycker Avboka anmälan, ser personens betalläge, skriver eventuellt ett skäl och bekräftar. Anmälan blir avbokad, personen lämnar inkorg och dörrlista, händelsen syns i Senaste aktivitet, och skälet syns i basens Notering. Ångrar hon sig trycker hon Återta avbokning på samma sida. Steget lägger inte till något mail. Ytan är facit-stämplad sedan S111 och ändras via ADR-102-amenderingsmekaniken, precedent TASK-349. Täcker användarberättelser: 1, 2, 6, 7, 8, 19, 21, 22.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Anmälans sida är identisk med facit tasks/sessions/bilagor/s111-anmalningssidan-konvergens/facit.json ytan anmälningssidan, amenderat per ADR-102 med utskriven klassning + sidofil för det nya avbokningssteget; ariaSnapshot-referenser uppdaterade och gröna
- [x] #2 För en aktiv anmälan finns knappen Avboka anmälan i sekundär destruktiv ton; den öppnar ett bekräftelsesteg med frivilligt skäl (fritext), personens betalläge (summa inbetalt och kvar att betala ur Postgres) och, när aktiva inbetalningar finns, en direkt väg till Registrera återbetalning; fokus landar i skälfältet, Avbryt är standardknapp (WAI-ARIA APG)
- [x] #3 Efter avbokning visas statusen Avbokad på sidan, knappen ersätts av Återta avbokning, personen försvinner ur betalningsinkorgen och dörrlistan och syns under Avbokade på eventsidan; Återta avbokning sätter tillbaka statusen och knappen Avboka anmälan återkommer
- [x] #4 Fel från servern visas inline vid steget med begriplig text och annonseras; sidan visar oförändrad status tills servern bekräftat
- [x] #5 Acceptanstest i den hermetiska fixturvärlden (förebild: anmälans detaljsidas acceptanstest) prövar avboka med och utan skäl, återta, knappens synlighet per status, felläget, och axe noll överträdelser i båda lägena; desktop och iPad-bredd
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #4 Facit-granskning mot tasks/sessions/bilagor/s111-anmalningssidan-konvergens/facit.json (ADR-102 R3): skarpa ytan jämförd bild för bild mot det amenderade facitet innan Done
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Vad som byggdes

Avbokningen bor i en egen yta, `src/components/registrations/AvbokningsYta.tsx`, som `AnmalanDetail` renderar SIST på sidan. Ytan äger sitt eget `DetaljGrupp`-skal ("Avbokning") och returnerar null helt för statusarna `Inställt` och `Flytta till väntelista` — annars hade en tom rubrik stått kvar över ett tomt kort.

- **Aktiv anmälan** (Obekräftad · Bekräftad (mail skickat) · Betalningspåminnelse skickad, hämtade ur `_shared/cancel-registration.ts` § ÖVERGÅNGSTABELLEN, inte gissade): rad med förklaring + knappen "Avboka anmälan" i sekundär destruktiv ton (`intent="danger" emphasis="outline" size="sm"`).
- **Bekräftelsesteget öppnas PÅ PLATS**, inte som modal — husets uttalade form för en engångsfråga (`InbetalningsLista` § "ÖPPNAS PÅ PLATS"-MÖNSTRET). Ett `<fieldset>` med `<legend class="sr-only">Avboka anmälan för X</legend>`, ett frivilligt fritextskäl (`TextArea`, fokus landar där vid öppning), betalläget (flaggat, se nedan) och knappraden Avbryt · Avboka anmälan.
- **"Avbryt som standardknapp" (WAI-ARIA APG)** är löst i tre led, utskrivna i komponentens docblock: steget är INGET `<form>` (ingen implicit submit kan råka lösa ut det destruktiva klicket), Avbryt står FÖRST och bär den neutrala standardformen, och Escape stänger steget. Fokus landar ändå i skälfältet per AC #2 — ett Enter där ger en radbrytning, aldrig en avbokning, så kraven krockar inte.
- **Avbokad anmälan**: rad med "Återta avbokning". Serverns härledning bestämmer den nya statusen; klienten väljer aldrig.
- **Fel** visas inline i steget med `role="alert"`. Texten är SERVERNS egen svenska mening, skalad ur `EdgeFunctionError`s tekniska hölje (`begripligtServerfel`) — Lotta ser "Anmälan är redan avbokad. Anmälan är oförändrad.", aldrig `Edge Function "cancel-registration" 409: ... (requestId: ...)`.
- **Fokuskontinuitet**: Avbryt/Escape returnerar fokus till triggern; efter en lyckad avbokning flyttas fokus till "Återta avbokning" och tvärtom. Utfallet annonseras via husets `alertScreenReader` i stället för en egen `role="status"`-rad, eftersom en live-region som monteras samtidigt som sin text inte läses upp.

**Statusen står oförändrad tills servern bekräftat.** Ingen optimistisk skrivning finns. `registrationCancellation.ts` patchar i stället detaljcachen med SERVERNS svar (`status` + hela `notering` efter appendet) i `onSuccess`, före invalideringen — utan den hade sidan stått kvar med "Avboka anmälan" i 1-3 s (get-registration varma golv) på en redan avbokad anmälan, ett klick från serverns 409. Patchen skrivs bara när svarets status är ett av basens sex kända värden; ett okänt värde hoppar över patchen och låter omhämtningen bära bytet (en schema-otrogen cache vore dyrare än några sekunders eftersläpning).

## Betalläget och återbetalningsvägen

`src/components/betalningar/AvbokningsBetallage.tsx` visar "Inbetalt" ur Postgres (`Inbetalningslista.spegel.summaPostgres`, ADR-128:s sanning) och "Kvar att betala" ur `harledRad` — samma härledning och samma ord som `AnmalansBetalningar` visar högre upp på sidan, så Lotta aldrig ser två tal för samma fråga.

Den direkta vägen till Registrera återbetalning är ett DEKLARERAT seam, inte en DOM-gissning: `AterbetalningsYta` har fått en frivillig `triggerId`-prop, `AnmalansBetalningar` skickar `ATERBETALNINGS_TRIGGER_ID`, och steget rullar fram, fokuserar och aktiverar just den knappen. Steget STÄNGS INTE — det är vinsten med inline-formen: ett halvskrivet skäl står kvar medan återbetalningen registreras.

**Avboka-knappen ligger ALDRIG bakom betalningsflaggan.** Bara betalläget i steget gör det, och gatingen sitter på MONTERINGEN av `AvbokningsBetallage` (inte på hook-anropen), så med flaggan av görs ingen betalnings-EF-hämtning alls från steget.

## Premiss-divergens (ADR-086) — AC #1 pekade på fel facit

AC #1 och orkestrerar-uppdraget säger att anmälans sida är facit-stämplad via `tasks/sessions/bilagor/s111-anmalningssidan-konvergens/facit.json`, ytan `anmälningssidan`, 7 bilder. **Mätt mot disk (2026-09-03, origin/main b391dffe): den ytan är anmälnings-LISTAN** (`/mer/anmalningar`), källor `dev/anmalningar-prototyp/VariantB.tsx` + `FilterRad.tsx` + `EventValjare.tsx` + `hem-derivations.ts`, bilder `facit-anmalningssidan-{lista,atgardskon,tomt,filterpanel}-*`. `grep -l "AnmalanDetail" tasks/sessions/bilagor/*/facit.json` ger NOLL träffar — anmälans detaljsida har inget `facit.json` alls.

Ytans faktiska lås är S83: Marcus "Lås den" 2026-07-24 (`tasks/sessions/archive/2026-07/2026-07-24-session-83.md` Del 4) med bilagorna `k04.png` / `k04-obekraftad.png`. Låsningen föregår ADR-102:s manifest-mekanik.

**Regeln följdes, talet rättades:** amenderingen är skriven i ADR-102 § A3:s kanoniska form med utskriven klassning **(c)** (§ A4: en utvidgning AV formen är klass (c) och avgörs av Marcus), men i RÄTT katalog: `tasks/sessions/bilagor/s83-anmalningsvyn-konvergens/AMENDERING-2026-09-03-avbokningssteget.md`. S111-manifestet är orört. `bash scripts/check-facit.sh` → exit 0 före och efter (ytan har inget manifest, så ingen mekanisk grind berörs — det står utskrivet i sidofilen, ADR-083).

AC #1:s andra halva, "ariaSnapshot-referenser uppdaterade och gröna", är en **deklarerad frånvaro**: `tests/visual/__aria__/` har ingen post för anmälans detaljsida (disk-verifierat), och de snapshots som nämner `/anmalan/` tillhör eventsidan och persondetaljen där bara länk-href:ar förekommer. Inget att uppdatera, inget som kan gå rött.

## Placeringen är minimerings-driven, inte ett designval

Gruppen står EFTER Händelser. Sist är den enda position som lämnar samtliga nio låsta grupper på exakt sina platser. Att en åtgärdsgrupp därmed hamnar efter en passiv tidslinje är en känd svaghet och en öppen fråga till Marcus vid omstämplingen — den är bokförd i amenderingens § Avvikelse, inte avgjord här.

## Täckningsgräns, öppet deklarerad

Betalläget och återbetalningsvägen har INGEN acceptans-täckning: `playwright.config.ts` sätter `VITE_FEATURE_BETALNINGAR: "av"` för hela den delade acceptance-webServern (dess egen kommentar: utan raden fälls 48 av 48 tester av WebSocket-vakten), och fixturvärlden bär inga betalnings-EF-mockar. Samma öppna läge som `AnmalansBetalningar` (TASK-346.7) redan står i. Gränsen står i testfilens docblock och i amenderingen.

## Öppet till TASK-368.5

Bekräftelsesteget är byggt så att ombokningsvalet och väntelistepåminnelsen kan läggas till UTAN omdesign: `<fieldset>`-steget är en vertikal `flex-col gap-3` där varje del är en egen syskon-nod (text · skälfält · betalläge · fel · knapprad). "Boka om till annat event" blir en tredje knapp i knappraden (eller ett eget block ovanför den), och väntelistepåminnelsen en fjärde nod mellan betalläget och felraden. Skälfältets värde ligger redan i komponentens state och kan förifyllas med "Ombokad till <event, datum>" utan att fältets ägarskap flyttas. Ingen del av steget antar att det finns exakt två knappar.
<!-- SECTION:NOTES:END -->
