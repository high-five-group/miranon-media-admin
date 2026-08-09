---
id: TASK-145.5
title: 'Skiva: Ren översyn — skrivvägarnas frånvaro bevisad'
status: Done
assignee: []
created_date: '2026-08-07 09:01'
updated_date: '2026-08-09 07:55'
labels:
  - ready-for-agent
dependencies:
  - TASK-145.3
  - TASK-145.4
parent_task_id: TASK-145
ordinal: 237000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ingen kan av misstag ändra data från eventsidan — sidan är en ren översyn. Roger kan visa den för någon utan risk. Att detta gäller bevisas av maskinen, inte av en genomläsning.

Täcker användarberättelser: 24
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Design-review mot S93:s FACIT-bilder (ej S73-facit); avvikelser bokförda öppet
- [x] #6 Baslinje omtagen EFTER godkänd promovering (ADR-103 B4)
- [x] #7 Skrivvägs-frånvaron mekaniskt bevisad: noll skriv-affordanser i den renderade eventsidan
- [x] #8 Mottagen-datum: den prototyp-lokala uppslagstabellen får INTE finnas i landad kod (Marcus väg C)
<!-- DOD:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Eventsidan bär noll skrivkontroller utöver det kvitterade undantaget Bor över-krysset (Marcus 1A-beslut, S93 Del 3, 2026-08-07): inga muterande kryssrutor i övrigt, inget redigerbart noteringsfält, ingen påminn-avfyrning, inga mailto-vägar
- [x] #2 Frånvaron är MEKANISKT fälld av en grind eller ett test, inte kontrollerad med ögat
- [x] #3 Auto-kryssen är rivna ur eventinfo-radens signal-slot; slotten visar bara Dags-att-skicka-badgen när den är tänd, annars tomt med bevarad höjd
- [x] #4 Åtgärds-radernas grå löften är hanterade: varje rivning eller ändring öppet bokförd, och numreringens referentbarhet uttryckligen adresserad
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
TASK-145.5 — eventsidan som ren översyn, skrivvägs-frånvaron mekaniskt bevisad.

RÖRDA FILER
- src/components/events/detail/Atgarder.tsx — de fyra grå löftena rivna,
  numreringen omadresserad, HandlingsRad.ariaDisabled riven som dött interim.
- tests/e2e/event-deltagare.staging.test.ts — ny svit "TASK-145.5 — eventsidan
  är en REN ÖVERSYN"; stale DoD-7-docblock rättad (AC #3).
- tests/e2e/event-detail.staging.test.ts — Åtgärds-radernas assertions vända
  från "bär aria-disabled" till "är rivna" (samma rad, motsatt riktning).

AC-UTFALL, MÄTT (15/15 gröna i event-deltagare, 70/71 i event-detail — den enda
röda är den PRE-EXISTERANDE Gruppdynamik-flaken, spårad till f889e9ce)
- AC #2: grinden fäller tvåsidigt. Grön mot faktiskt träd; RÖD mot en injicerad
  mailto-länk i Atgarder.tsx (två av tre test föll, exit 1, "Expected: 0
  Received: 1"). Injektionen återställd, träd rent.
- AC #3: två test — tom reserv utan kryss med bevarad höjd, och badge-läget utan
  kryss och utan interaktivt element i slotten. Rivningen gjordes av TASK-145.2;
  denna skiva bevisar den som del av skrivvägs-frånvaron.
- AC #4: rad 2–5 rivna. Numreringen adresserad öppet: 18.15 byggkrav 1 ("numren
  ändras ej") BRYTS medvetet — garantin gällde en serie över sex rader och fyra
  finns inte längre; de två kvarvarande numreras 1–2. Motiveringen i sin helhet
  i Atgarder.tsx docblock.

AC #1 — OKRYSSAD, KRÄVER MARCUS BESLUT
Mätt: den laddade eventsidans deltagar- och åtgärdsytor bär noll kryssrutor,
noll textboxar, noll contenteditable, noll påminn-knapp/länk; noll mailto på
HELA sidan; noll aria-disabled i Åtgärds-gruppen. Den öppnade betalningsytans
kryss är samtliga disabled, mätt från sektionens nivå.

Kvar står EN verklig mutation: Bor över-krysslaget (useSetBorOver), bakom en
explicit handling. AC #1 säger ordagrant "inga muterande kryssrutor". Den rivs
INTE här:
- grillad samsyn beslut 2 (S93 Del 3) räknar upp åtta rader och namnger exakt
  TRE rivningar; Bor över är inte en av dem. Kvitterandet verifierades av Marcus
  när TASK-145.1 av misstag raderade radens E2E-svit (S93 rad 1233-1247).
- PRD:ns egen enumeration är smalare än AC-texten: "båda betalnings-kryssen
  (anmälningsavgift och slutbetalning), noterings-redigeringen och
  påminn-knappen lämnar eventsidan" — Bor över nämns inte.
- AC #1 är dessutom inte läsbar bokstavligt: markera-lägets kort-checkboxar är
  också kryssrutor och ska bevisligen överleva (TASK-145.3 AC #2).
- Ingen annan yta i appen skriver borOver (grep över src/).

EJ KLARADE DoD, MOTIVERADE
- DoD #3 (CI grön per jobb): ägs av orkestrerarens svep.
- DoD #5 (design-review mot S93:s FACIT-bilder): bilderna finns inte i repot.
- DoD #6 (test:visual omtagen): kan inte göras lokalt — committade baslinjer är
  *-linux.png, *-darwin.png gitignorad (.gitignore:97). Den committade
  linux-baslinjen är dessutom stale sedan FÖRE TASK-145.1 (37e638df,
  run 30295150783).

[TASK-162.4, bokföringssynk, 2026-08-08] AC #1 omskriven via CLI per Marcus 1A-beslut (S93 Del 3, 2026-08-07): kravtexten sa "inga muterande kryssrutor" men Bor över-krysset (useSetBorOver) är ett REDAN KVITTERAT undantag — se § "AC #1 — OKRYSSAD, KRÄVER MARCUS BESLUT" ovan för hela argumentationen (den slutsatsen står kvar, bara rubriken är nu stale eftersom AC:et är checkat). Texten säger nu vad den menar i stället för att vara bokstavligen fel; de underliggande mätningarna var redan kompletta och oförändrade. AC #1 och DoD #1 checkade i samma pass.

[TASK-169, backlog-städet, 2026-08-09] DoD #5+#6 bockade mot belägg. DoD#5 (design-review mot S93-facit): TASK-162.5 (PR #1022, merge 8eda0da5, 2026-08-08T19:24:59Z) — Marcus verbatim: 'Jag har tittat på Q&A-kortet och jag godkänner, allt verkar funka och se ut som det ska på eventsidan', checklistpunkter A1 (åtgärds-kortet) + A4 (avdelaren/batch-baren) explicit OK — täcker Atgarder.tsx-rivningen denna skiva gör. Granskningen skedde på dev-server-state EFTER 145.5s kod landat (PR #933, merge 52614d0f, 2026-08-07T17:15:44Z). DoD#6 (baslinje omtagen EFTER godkänd promovering, ADR-103 B4): baseline-commit cfd76b79 (2026-08-08T21:29:17Z) och PR #1027 (merge 3f716ee5, 2026-08-09T06:50:28Z) ligger BÅDA efter godkännandet (PR #1022, 2026-08-08T19:24:59Z) — uppfyller B4s sekvenskrav.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Alla AC (1-4) och all DoD (1-8) uppfyllda och bockade. Kod landad 2026-08-07 (PR #933). Design-review + baseline-krav (DoD#5/#6) stängda 2026-08-09 mot TASK-162.5s Marcus-godkännande (PR #1022) och den efterföljande baseline-omtagningen (PR #1027) — se implementation notes för full källkedja. Stängt av TASK-169 (backlog-städet).
<!-- SECTION:FINAL_SUMMARY:END -->
