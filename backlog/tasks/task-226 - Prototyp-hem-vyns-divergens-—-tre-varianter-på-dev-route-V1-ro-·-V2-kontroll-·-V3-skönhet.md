---
id: TASK-226
title: >-
  Prototyp: hem-vyns divergens — tre varianter på dev-route (V1 ro · V2 kontroll
  · V3 skönhet)
status: Done
assignee: []
created_date: '2026-08-15 09:59'
updated_date: '2026-08-20 07:08'
labels:
  - ready-for-agent
dependencies: []
ordinal: 428000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Divergensfasen i hem-omdesignens ADR-102/103-flöde (grillad samsyn S102 Del 8, Marcus kvittens 2026-08-15). EN nedskriven fråga prototypen besvarar: VILKEN estetisk riktning ska hem-vyns morgonkoll bära — ro (V1 Lugna morgonen: redaktionell, luftig, fri hälsningsrubrik, stillsamt fullbredds-hero), kontroll (V2 Kommandocentralen: räknar-chips, prominenta svep-knappar, allt inom en skärmhöjd) eller skönhet (V3 Bento: asymmetrisk kortmosaik, hero med kursfärgs-accent, tonala ytor ur tolvstegsskalorna)? Alla tre bär SAMMA kvitterade innehåll och blockordning: fri hälsning · Nästa event fullbredd · Nya anmälningar (räknar-rubrik + personlistans initial-form + bekräftelsesvep-INGÅNG) · Förfallna betalningar (antal + initial-lista + påminnelsesvep-INGÅNG; def start−14-deadline passerad + betalning saknas) · Genvägar (manuell anmälan · Åtgärds-sidan) · Senaste aktivitet (kompakt, alla bredder). WOW-ribban: riktiga tokens, riktiga primitiver, riktig staging-data, facit-mönster-stöld (personlistan, Åtgärds-sidan, check-in-D, historiken) — inga gråbox-skisser. UTANFÖR scope: sveparnas egna ytor (knapparna är döda ingångar med tooltip 'byggs i svep-PRD:n'), AppShell/TabBar, all skarp fil — prototypen bor på växlingsbar dev-route. Throwaway-kontraktet: vinnaren konvergeras, förlorarna rivs.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Tre växlingsbara varianter på en dev-route (ADR-044-mönstret, redirect i prod), alla mot riktig staging-data via befintliga hooks — ingen ny datahämtning byggs
- [x] #2 Varje variant bär hela den kvitterade blockordningen och är komplett nog att bedömas som WOW-kandidat (tokens/primitiver/a11y-grundform — inga hårdkodade färger)
- [x] #3 Ingen skarp fil rörd (grep-bevis: diffen ligger under dev-routen + ev. ny prototyp-mapp)
- [x] #4 DoD-kvartetten grön
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
DIVERGENSFAS BYGGD — /dev/hem-prototyp (endast dev-läge, redirect i prod, ADR-044-mönstret).

GRANSKNING (Marcus): npm run dev, logga in, öppna /dev/hem-prototyp. Utan ?variant= visas en hänvisning till skarpa /hem. Växla variant med den flytande prototyp-växlaren längst till höger (rundade sifferknappar 1/2/3 — samma PrototypeSwitcher-mekanism som /dev/auth-prototyp), eller direkt via URL:
  /dev/hem-prototyp?variant=1  → V1 Lugna morgonen (ro)
  /dev/hem-prototyp?variant=2  → V2 Kommandocentralen (kontroll)
  /dev/hem-prototyp?variant=3  → V3 Bento (skönhet)
Testa både mobil (375 px) och desktop (1440 px) — DevTools-emulering eller fönsterbredd.

Alla tre hämtar RIKTIG staging-data via BEFINTLIGA hooks (useDashboardEvents/useDashboardRegistrations, samma som skarpa /hem) och bär EXAKT samma blockordning (S102 Del 8-kvittensen): fri hälsning (ingen platta) · Nästa event fullbredd (status + beläggning) · Nya anmälningar (räknar-rubrik "N nya anmälningar att bekräfta" + initial-lista à la personlistan + bekräftelsesvep-knapp som DÖD ingång, synlig caption) · Förfallna betalningar (räknat + initial-lista + avgiftstyp per rad Anmälningsavgift/Slutbetalning + skickat-markör "Påmind" + påminnelsesvep-knapp som DÖD ingång; förfallen = betalning saknas OCH eventstart-14 dagar passerad, härlett ur befintliga Registration-fält) · Genvägar (RIKTIGA länkar till /anmalan/ny och /atgarder — båda redan skarpa routes vars tomma läge ÄR eventväljar-steget) · Senaste aktivitet (kompakt, ALLA bredder — medveten avvikelse från facitets endast->=xl-spalt, useLatestActivity delad oförändrad).

V1 "Lugna morgonen" (ro): redaktionell enkolumn (max-w-2xl, oförändrad mobil->desktop), stor luftig typografi, mjuk primär-tint hero, generösa gap-10/12. Svep-knapparna är tillbakadragna eftertankar under listorna.

V2 "Kommandocentralen" (kontroll): räknar-chips direkt under hälsningen (nästa-status / N att bekräfta / N förfallna). Täta rader (py-1.5), svep-knapparna FLYTTAR FÖRE listorna som size=lg primärhandlingar. Designat mot "allt inom en skärmhöjd i mobil" (intention, ej pixel-mätt).

V3 "Bento" (skönhet): asymmetrisk CSS-grid-mosaik (lg:grid-cols-3, auto-placement — INGEN CSS order-egenskap, så DOM-ordningen = blockordningen = tab-ordningen trots mosaiken). Nästa event som dubbel-bred/dubbel-hög hero med kursfärgs-accent (kursfargForKurs-uppslaget, ingen egen namn-matchning). Tonala ytor ur tolvstegsskalorna (--p-gold-2/--p-red-2/--p-sage-2/--p-neutral-2). Framträdande initial-avatarer (size-11 mot V1/V2:s size-9/size-7).

Delad datalogik (src/components/dev/hem-prototyp/data.ts) garanterar att alla tre visar SAMMA tal — bara ytan skiljer. Delade UI-atomer (ui.tsx: InitialAvatar, DodIngang, Genvagar, SenasteAktivitetKompakt) för de innehållsmässigt identiska bitarna.

Throwaway-kontraktet gäller (ADR-102/103): Marcus väljer EN i browsern, förlorarna rivs, vinnaren konvergeras separat. Kortet stängs av orkestreraren efter CI-verifikat — INTE av bygg-agenten.

FACIT LÅST (2026-08-16): vinnaren V1 "Lugna morgonen" efter konvergensvarv 1-4 (#1355, #1357, dataläge-knappen #1366, #1379, #1388) facit-låst mot origin/main b1ac411e. Marcus kvittens i klartext: "Varv 4 ser bra ut, lås facit." Katalog: tasks/sessions/bilagor/s102-hem-konvergens/ (facit.json + 6 skärmdumpar: verklig/tom/demo x mobil/desktop). godkand: null (ADR-104 kanalseparation — sätts av Marcus egen kanal, aldrig av bygg-agenten). B3-markören "V1 Lugna morgonen (ro)" tillagd i .facit-policy.conf (skyddar dev-routens prototyp-substrat mot förtida rivning tills godkänt). bash scripts/check-facit.sh grönt.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Divergensfas för hem-vyns omdesign — tre WOW-varianter (V1 ro/V2 kontroll/V3 Bento) på /dev/hem-prototyp; V1 "Lugna morgonen" facit-låst efter konvergensvarv 1-4 (Marcus kvittens). PR-kedja #1344/#1355/#1357/#1366/#1379/#1388/#1392, CI grön per jobb på slutliga #1392 (facit-lås).
<!-- SECTION:FINAL_SUMMARY:END -->
