---
id: TASK-299.1
title: >-
  Skiva: Delad sidram till bibliotek + initialcirkel till primitiv, bakom
  dev-växel
status: Done
assignee: []
created_date: '2026-08-22 19:08'
updated_date: '2026-08-22 21:17'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-299
ordinal: 541000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Prefaktorering — gör ändringen enkel först. Efter skivan finns EN delad sidram att importera i stället för sex kopierade sidkrom, och initialcirkeln bor i primitiv-hemvisten i stället för i Hem-katalogen. Ingen skarp yta ser annorlunda ut: de fyra befintliga ytor som ska kunna byta sidram gör det bara när dev-parametern är satt, så Marcus kan se båda formerna sida vid sida utan att något är låst. Tracer bullet-ordning inom skivan: komponenten först, växeln sedan, importbytena sist. Täcker användarberättelser: 19, 20.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 En delad sidram-komponent finns i bibliotekshemvisten på 11/11/11 och bär kant-i-kant-dialekten (chevron och rubrik indragna, kortytan kant i kant mot innehållsytan); den kan valfritt äga rubrikblocket, så både den smalare och den bredare omfattningen kan visas
- [x] #2 Initialcirkelns komponent bor i primitiv-hemvisten och exporteras därifrån; Hems två konsumenter importerar den nya sökvägen; noll visuell förändring — befintliga baslinjer gröna UTAN om-baselinjering
- [x] #3 Kodkommentaren som påstår att duplicering av presentationsformer är avsiktlig är riven i samma landning som lyftet
- [x] #4 Dev-parametern visar den nya sidramen på persondetaljen, check-in, aktivitetshistoriken och dokumentytan; UTAN parametern är var och en av de fyra ytorna identisk med sitt facit
- [x] #5 Ingen av de fyra ytornas befintliga promoveringsgrindar eller aria-referenser ändras
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 axe 0 på varje ny/ändrad yta i alla tillstånd (lista, filtrerat, tomt, fel)
- [x] #6 Facit-granskning före stängning: persondetaljen mot tasks/sessions/bilagor/s103-persondetalj-konvergens/facit.json, check-in mot tasks/sessions/bilagor/s103-checkin-konvergens/facit.json, aktivitetshistoriken mot tasks/sessions/bilagor/s106-aktivitetslogg/facit.json, dokumentytan mot tasks/sessions/bilagor/s102-dokument-konvergens/facit.json
<!-- DOD:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Levererad i PR #1825, merge-SHA 24238b1c (2026-08-22T21:11:30Z).

Delad sidram (kant-i-kant-dialekt, valfritt rubrikblock) och initialcirkeln bor nu båda i primitiv-hemvisten: src/components/primitives/SidRam.tsx + InitialAvatar.tsx, exporterade ur barrel. src/components/hem/InitialAvatar.tsx raderad; Hems två konsumenter (NyaAnmalningar, ForfallnaBetalningar) importerar den nya sökvägen. DokumentYta.tsx:s kodkommentar som påstod att dupliceringen var avsiktlig är riven i samma landning (AC #3).

Dev-växeln ?sidram=ny ligger bakom import.meta.env.DEV (ADR-074 amendering 7-formen) på persondetaljen, check-in, aktivitetshistoriken och dokumentytan. Utan parametern är varje yta oförändrad — de fyra ytornas befintliga promoveringsgrindar gick 34/34 UTAN om-baselinjering, vilket är AC #4 och #5 bevisade som beteende.

CI grön per jobb på 24238b1c: 12 pass, 3 skipping, 0 fail. Acceptance (hermetisk) 7m43s och Acceptance — tvåsidigt bevis 7m26s som SEPARATA jobb — summan 15m09s hade sprängt timeout-minutes: 12 i den odelade formen, vilket bekräftar TASK-239:s delning empiriskt.

Två avvikelser bokförda öppet:

1. ADR-124 DEFERRAD till 299.6, inte mintad här. Kortets ordalydelse tillät bägge. Skälet: principen är redan avgjord i grillningen och denna skiva exekverar den, medan sidramens BREDD är olåst av avsikt tills 299.2 — en ADR skriven nu hade behövt nästan omedelbar amendering.

2. Scope marginellt utökat: SidRam-demo + axe-test på /dev/primitives, för att komponentens bredare (rubrik-ägande) gren annars vore otestad kod i en 11/11/11-komponent. Ingen produktionsyta använder den grenen.

Not om a11y-täckningen: ci.yml skickar run_a11y: false villkorslöst (A7:6 / TASK-70.4), så axe-beviset för denna skiva vilar på den lokala körningen (117/117) plus post-merge/nightly, inte på PR-grinden.

En elfte kopia av initialer() upptäckt i dev/hem-prototyp/data.ts — throwaway-substrat ([PROTOTYPE-UI, TASK-226]), medvetet orörd, noterad som underlag åt ADR-124.
<!-- SECTION:FINAL_SUMMARY:END -->
