---
id: TASK-18.17
title: >-
  Skiva: Per-anmälan-detaljvyn — route + läs-shape + vy (Anmäld-radens länkmål)
  (review-iteration 3)
status: To Do
assignee: []
created_date: '2026-07-23 08:55'
updated_date: '2026-07-24 16:23'
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
- [ ] #2 Vid bifall: route + shape + vy levererade; Anmäld-radens no-op byts till Link; e2e täcker navigering + shape; DoD-arvet per skiva
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
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
