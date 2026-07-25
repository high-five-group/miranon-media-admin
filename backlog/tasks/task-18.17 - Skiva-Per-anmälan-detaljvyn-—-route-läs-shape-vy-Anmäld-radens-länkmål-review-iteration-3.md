---
id: TASK-18.17
title: >-
  Skiva: Per-anmälan-detaljvyn — route + läs-shape + vy (Anmäld-radens länkmål)
  (review-iteration 3)
status: Done
assignee: []
created_date: '2026-07-23 08:55'
updated_date: '2026-07-25 09:11'
labels:
  - ready-for-agent
dependencies:
  - TASK-18.5
parent_task_id: TASK-18
ordinal: 85000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus review-våg 2 (2026-07-23), lyft vid 18.5-granskningen: Anmäld-raden på personkortet SKA vara en länk till anmälan (facit K62: understruken = länk, Marcus-ordern), men länkmålet — per-anmälan-detaljvyn — är öppet bokfört som EJ byggd i prototypen (PRD-luckan: route + get-registration-shape; no-op-grammatiken K26). Fix-vågen 2026-07-23 återinför den understrukna no-op-affordansen per facit; denna skiva föder MÅLET: route (form avgörs, t.ex. /event/$eventId/anmalan/$registrationId), läs-shape (egen get-registration eller återbruk av get-registrations-berikningen) och vy-designen — NY facit-yta saknas, designbeslut/grillning krävs före bygge (design-fork-normen).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Marcus designbeslut bokfört: vy-innehåll + route-form + shape-väg (grillning vid design-fork)
- [x] #2 Vid bifall: route + shape + vy levererade; Anmäld-radens no-op byts till Link; e2e täcker navigering + shape; DoD-arvet per skiva
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
PROTOTYP-FACIT S83 (konvergens-pass 3, Marcus-låst 2026-07-24: 'Lås den'). Fyra steg: utkast → fältkarta (ALLA 51 fält live-MCP-lästa ur Anmälningar tbloOcrppVoyrHbrq, prod) + elit-IA-research (docs/research/detaljsida-postvy-monster-2026-07-24.md: Polaris/Stripe/GOV.UK/Linear/CRM) → Marcus-iterationer → LÅST. Bilagor: tasks/sessions/bilagor/s83-anmalningsvyn-konvergens/ (k04 bekräftad, k04-obekraftad). Prototyp-SHA (aldrig mergad branch proto/s83-18-17-anmalningsvyn): 5437fb1 — facit-koden läses därifrån; nedan är besluten.

BYGGKRAV (låsta):
1. ROUTE: /event/$eventId/anmalan/$registrationId. Tillbaka-chevron => eventsidan. Personkortets Anmäld-rad byts no-op => Link (kortets ursprungs-AC).
2. LÄS-SHAPE: egen get-registration (återbruk av get-registrations-berikningen) MED: basens autonummer-ID, bekräftelse-tidsstämpel, inskickad (datum+TID), Från formulär (+options-ID), Källa, antal platser, bor över, medföljande-relationen BÅDA håll (självlänken + inversen), betalningsfälten (status, noteringar per betalning, deadline-formeln, dagar kvar, påminnelse-tidsstämplar), motivering, frågor/funderingar, villkor, personId, event-lookups (namn/typ/ort/datumspann/tid kvar/EventKey) samt DELTAGANDEN för RIM-behörigheten.
3. HEADER: h1 = namn + 'Anmälan #<ID>' (mutad mono-pill). Statusrad = tonal StatusBadge: success+bock 'Bekräftad' + mutad datum-tid / warning+triangel 'Obekräftad'. Inga åtgärder i headern.
4. KONTAKT-SEKTION FÖRST: E-post + Telefon; vid obekräftad en åtgärdsrad: 'Bekräftelsen skickas till e-postadressen ovan.' + Button intent=success size=sm 'Skicka bekräftelse' (18.16-regeln). E-post finns ALLTID (Marcus-beslut) — ingen saknas-gren. Skarp mutation kräver bekräfta-/send-email-EF — samordnas med 18.6:s flöde (EF-gap-kartan S74).
5. AVSER: länkrad kursfärgs-prick + eventnamn + EventKey (mutad mono) + chevron => eventsidan; rader Typ/Ort/Datumspann/Tid kvar. BEHÖRIGHET (endast RIM-event): StatusBadge 'Godkänd för RIM X'/'Ej verifierad för RIM X' + grunden som UNDERSTRUKEN LÄNK till personkortet (BÅDA lägena). Härledning: verifierat deltagande slår självrapport; rå-svaret 'har du gått steg 1?' renderas ALDRIG. Personkortets deltagande-historik-yta är beroendet — saknas sektionen där föds egen skiva.
6. BETALNINGAR: RÅ status (basens 'visuell status'-formel används EJ i statusraden); noterings-raderna ALLTID symmetriska (tom = mutad 'Ingen notering'); Deadline-rad (dold när mottagen) med datum + VIT dagar-kvar-pill (EventCards status-slot-grammatik).
7. UPPGIFTER: Antal platser, Bor över, PersonMiniKort för relationer (medföljande-till, +1:or, personkortet med roll 'Personkort') — initial-cirkel + namn + roll + chevron, hela ytan klickbar.
8. ANSÖKNINGSSVAR: FritextRad (fullbredd, mikro-etikett, VÄNSTERSTÄLLD text, läs mer-klipp vid längre texter): Motivering + Frågor/funderingar; tomma döljs.
9. INKOM: Inskickad (datum+tid) · Formulär (namn + IdChip: mutad mono options-ID, klick-kopierbar; '—' vid icke-formulär) · Källa · Villkor godkända (Ja / mutad 'Ej tillämpligt (<källa>)' vid icke-formulär) · URL (länkad, mono, ny flik) · UTM (RÅ 'source / medium / campaign' i mono — värden ordagrant ur URL-parametrar, ALDRIG översatta). BAS-GAP: URL + UTM kräver nya formulär- OCH basfält (AT-Max/ADR-063-kandidat; raderna renderas när data finns).
10. INTERNA NOTERINGAR: NoteringsKort-lista (text + 'Författare · datum-tid'). BAS-GAP: dagens Notering-fält är EN anonym text — målbilden kräver Anteckningar-mönstret (ADR-075) utvidgat till anmälningar; interimet visar dagens fält utan författarrad tills migreringen (egen skiva/ADR-kandidat).
11. HÄNDELSER SIST: Tidslinje (genomgående linje + ikon-noder per typ inkom/mail/betalning/påminnelse/+1, SENAST ÖVERST) härledd ur tidsstämplarna + 'Anmälan inkom via <formulär>' som inkom-händelse.
12. NYA BIBLIOTEKS-KANDIDATER (nyskrivs genom 11/11/11-grindarna, absorberas ALDRIG från prototypen): StatusBadge (tonal) · PersonMiniKort · FritextRad · IdChip · Tidslinje.
13. AT-GOLV: alla ikoner aria-hidden (texten bär), läs mer aria-expanded, grön knapp-regeln, mono-identiteter är text (kopierbara).

## Leverans (task/18.17) — granskningsfärdig (design-review-grinden öppen)

### Snittet

Per-anmälan-detaljvyn ände-till-ände per de 13 låsta byggkraven: (1) NY EF
get-registration (single-get-mallen: 200/400/404/401) som ÅTERANVÄNDER
get-registrations läs-kärna via ny _shared/registration-read.ts (extraktion,
beteende oförändrat — mapRegistration + berikaPersonhistorik delas, aldrig en
parallell mapper) och utökar med detaljfälten: autonummer-ID · Från formulär +
options-ID (FORM_OPTION_IDS-konstant, live-verifierad IDENTISK prod+staging
2026-07-25 — Meta-API-uppslag per request avvisat: latens + token-scope) ·
villkor ("Yes"-text ⇒ boolean) · event-lookups (Typ/Startdatum/Slutdatum/Tid
kvar/EventKey — allt bor på Anmälningar-raden) · deadline-formlerna (RÅ ur
basen per shape-beslutet) · Plus-one förfrågan skickad · medföljande-relationen
BÅDA håll (självlänken + inversen `From field: Medföljande till`, EN
namn-batch). (2) RegistrationDetailSchema = RegistrationSchema.extend (aldrig
parallell form; REQUIRED-fält — en producent, inga äldre svar), adapter-metod
fetchRegistration + SupabaseAdapter-stub, query-nyckel
registrations.detail(id), optimistisk detalj-bekräftelse-mutation
(useSendConfirmationFromDetail — egen hook: detalj-singel ≠ list-array-cache).
(3) Vyn AnmalanDetail + route /event/$eventId/anmalan/$registrationId
(kortets låsta form) med header/Kontakt/Avser/Betalningar/Uppgifter/
Ansökningssvar/Inkom/Interna noteringar/Händelser per byggkraven. (4) FEM
biblioteks-kandidater NYSKRIVNA genom 11/11/11-grindarna (prototypkod aldrig
absorberad; placerade i components/registrations/ — promoveras till
primitives/ vid andra konsumenten, rule of three): StatusBadge (tonal, text
bär, contrast-more-kant) · PersonMiniKort (createLink+RAC, NavCard-mekanismen)
· FritextRad (aria-expanded/controls, klipp-tröskel 180 tecken) · IdChip
(kopierbar, sr-status, timer-städning) · Tidslinje (ordning ägs av callern).
(5) RIM-behörigheten HÄRLEDD klient-side (behorighet.ts): teckenexakta
kursnamns-nycklar (kursfarg-disciplinen; case-dubletter medvetet omappade =
ingen rad, aldrig gissad), verifierad = närvaro + Session ∈ {Dag 1,
Föreläsning} (basens Genomfört event-formel, Gruppdynamik-identisk);
självrapporten renderas aldrig. (6) Anmäld-radens no-op → Link + PREFETCH PÅ
AVSIKT (hover/fokus, EventCard-mönstret).

### INSTANT (ADR-078)

placeholderData ur eventsidans anmälnings-cache: header + Kontakt står DIREKT
(alla fält list-burna); detalj-grupperna i skeleton i slutgeometri tills
riktiga data (placeholder-skyddet: "Anmälan #null" kan inte existera — pillen
renderas först när autonumret finns; e2e-bevisat med gated mock). GOLVET MÄTT:
get-registration varm 1,51–1,75 s (3 mätningar mot staging 2026-07-25, http
200) — anropsbudget 3–4 Airtable-anrop. Utan placeholder+prefetch hade
navigeringen väntat ut det.

### Öppet bokförda skiv-beslut

(1) Deadline-pillens passerad-/idag-mappning ('Passerad' text-error / 'Idag'
text-warning): facit-demon visade endast n=3; avvikelse-ersätter-nedräkning
följer EventCards status-slot-semantik + Betalningar-gruppens
passerad-grammatik. (2) Inkom-händelsens text per Källa (Manuell 'tillagd
manuellt' / Väntelista 'från väntelistan'): facit täckte formulär + +1;
resten följer ORDLISTA-semantiken — ingen betalningsnod fabriceras (ingen
tidsstämpel finns i basen). (3) Deadline-raden dold ENDAST när Mottagen
(kortets bokstav); 'Ej relevant'-slutbetalning visar därmed basens
RÅ-formelvärde (formelns Ej relevant-gren är den kända T16-buggen — visas som
den är). (4) dt/dd-raderna wrappade i <dl> (OmEventet-formen) — axe dlitem
fångade avvikelsen i första körningen (rött→grönt).

### BAS-GAP (inga bas-ändringar i skivan; DoD #7 vakuöst + EF staging-only)

URL/UTM: nycklarna finns i shapen som null tills formulär- OCH basfälten föds
(AT-Max/ADR-063-kandidat) → task-44. Interna noteringar: interimet visar
basens odelade Notering-fält utan författarrad; målbilden Anteckningar-
mönstret (ADR-075) utvidgat till anmälningar → task-43.

### TDD

api-skarven rött-först: tests/api/get-registration.staging.test.ts 5 tester
RÖDA före EF-deployen (körutdrag 2026-07-25: "5 failed — giltigt ID → 200 …
medföljande-relationen BÅDA håll … okänt ID → 404 … anon → 401 … saknat
id-param → 400"; felutfall: EF fanns inte, gateway-404/fel body-form) → GRÖNA
efter deploy (6 passed inkl. setup, 13.7s). AVVIKELSE (e2e-skarven):
anmalan-detalj-sviten skrevs mot färdig komponentdesign — rött utfall
observerades inte före UI-bygget (18.1/18.2/18.8-klassens kostnadsavvägning);
sviten fällde dock axe-dlitem-defekten i första körningen (rött→grönt,
skarven bevisade sitt värde). get-registrations-regressionen 13/13 efter
extraktionen.

### Review-piloten (T86; skarven steg 4→5)

EN oberoende review-subagent på diffen (SHA 3df9b42af7da) mot kortets 13
byggkrav + PRD + standards-dokumenten: 7 FYND (2 spec / 5 standard) — F1
falsk 'Bekräftad'-badge för avvikande statusar (Avbokad/Inställt/Väntelista,
nåbara via URL/+1-länkar; korrekthets-klass) · F2 eventTyp/Ort ur anmälans
formulär-kopior (tomma för app-skapade anmälningar) · F3 kontextlösa 'Läs
mer'-namn · F4 contrast-more saknades på minikort/chip + clipboard utan
.catch · F5 detalj-cache feltypad i mutationen · F6 genomförd-predikatet
duplicerat mot Gruppdynamik · F7 magisk 'Mottagen'-sträng. TRIAGE: ALLA 7
ÅTGÄRDADE inom scope (statusLage tre-lägen + neutral rå-pill + nytt
e2e-bevis · EF läser eventraden parallellt + nytt eventOrt-fält + skarp
api-assertion mot fixtur-sentineln · aria-label med etikett ·
contrast-more-kant + .catch · RegistrationDetail-typning · delat arGenomford
i src/lib/genomford.ts · PaymentStatus-konstanten); 0 avfärdade; 0 routade
(bas-defekten Deadline-formelns Ej relevant-gren var redan T16-bokförd som
18.8-bifynd — utanför scope-sektionen, ej nytt fynd). FOKUSERAD OMPASSERING
på fix-diffen (SHA 222c69324fde): F1–F7 samtliga VERIFIERADE, inga nya
regressioner. Review-tid ~14 min (två pass: ~11 + ~3). Pilot-loggrad i T86
§ Pilot-loggen samma landning.

### Grindar (efter sista materiella ändringen)

test:api 381/381 (varav get-registration 5 rött→grönt + get-registrations-
regressionen) · typecheck 0 · biome 0 fel · build grön · e2e: anmalan-detalj
6/6 (navigering/INSTANT + shape + optimistisk bekräftelse + avvikande status
+ 404 + axe 0 båda lägena) + event-detail 48/48 (fyra 18.5-assertions
OMSKRIVNA i samma skiva som ersätter ytan, per PRD-testbeslutet:
no-op-knappen är nu länken) + deltagare/bekraftelse/bor-over/anmalda gröna.
EF:er deployade ENDAST staging (pqtshyierkdgwdnxuirz): get-registration (ny)
+ get-registrations (delad läs-kärna); .prod-functions-allowlist.conf ORÖRD
(prod = separat Marcus-handling). Facit-avprickningen (DoD-klassens
renderade verifiering): fullpage-dumpar 390x844 (bekräftad + obekräftad) mot
facit-bilagorna k04/k04-obekraftad + computed-style-assertions i e2e
(deadline-pillens bg-surface, knappens success-token). Fynd routade till
kort: task-43 (noterings-migreringen) + task-44 (URL/UTM-fälten).

## Granskningsvågens FACIT-REVIDERING, liten (S86 morgongranskning, Marcus-beslut 2026-07-25)

Etiketten 'Frågor/funderingar' i Ansökningssvar-blocket (AnmalanDetail.tsx, FritextRad) → 'Frågor'. Bas-fältet ('Frågor eller funderingar?') och shape-nyckeln fragorFunderingar heter kvar — endast den renderade etiketten reviderades. E2E: ingen svit asserterade gamla etiketten (grep-verifierat: 'funderingar' förekommer endast i schema-/fältkommentarer) — inga teständringar krävdes. Branch fix/s86-granskningsvag (EN samlad fix-vågs-PR).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Levererad · commit 220ea19029956039dfc1a1a8f325c0a0f87eeb52 · CI-run: PR-run 30142544910 grön per jobb (8/8 success, attempt 1) + main-run 30142833315 grön per jobb (Test suite dedup-SKIPPAD by-design, 36.4; merge-SHA ebf36a25) · CI-grön-första-pass: ja · defekter under körning: 7+1 (review-piloten: 7 åtgärdade, 0 avfärdade, 0 routade; + axe dlitem-defekten fälld av e2e-sviten i första körningen, rött→grönt; bas-gap routade till kort: task-43 + task-44) · TDD: api-skarven rött-först (5 röda före EF-deploy → gröna efter); e2e-avvikelse: anmalan-detalj-sviten skriven mot färdig komponentdesign, rött ej observerat före UI-bygget (18.1/18.2/18.8-klassens kostnadsavvägning) · AFK-proveniens: batch S86, do-work-agent
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
