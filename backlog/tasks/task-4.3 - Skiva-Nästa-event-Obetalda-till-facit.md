---
id: TASK-4.3
title: 'Skiva: Nästa event + Obetalda till facit'
status: In Progress
assignee: []
created_date: '2026-07-07 08:56'
updated_date: '2026-07-11 09:42'
labels:
  - ready-for-agent
dependencies:
  - TASK-4.2
parent_task_id: TASK-4
ordinal: 12000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Nästa event-kortet (temporalt nästa event, primär-tint) renderar per facit: kortrubriken INNE i kortet (text-xl semibold, sentence case, mörk RENDERAT); dagar-kvar som VIT pill topp-höger med de exakta formerna "71 dagar kvar" / "1 dag kvar" / "Idag", härledd ur eventets startdatum; metagrupp i text-small: eventnamnet (medium; HELA kortet klickyta via stretched link till eventets sida — korrekt länksemantik, inga nästlade länkar), ort med kartnålsikon, långdatum ("15 september 2026") med kalenderikon; "X av Y platser bokade" (caption, secondary) med tunn beläggningsstapel (vit track, primär-dämpad fyllnad) — allt inom tokensystemet. Obetalda anmälningsavgifter-kortet: BARA antalet (text-3xl semibold) under sin kortrubrik.

Täcker användarberättelser: 4, 5, 6, 7, 8.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Dagar-kvar-pillens tre former exakta ('71 dagar kvar'/'1 dag kvar'/'Idag') härledda ur startdatum (e2e med route-mockade datum)
- [x] #2 Klick var som helst på Nästa event-kortet landar på eventets sida; inga nästlade länkar (e2e + axe)
- [x] #3 Metagruppen renderar eventnamn/ort/långdatum med ikoner per facit; kortrubriken mörk semibold sentence case RENDERAT (computed-style)
- [x] #4 'X av Y platser bokade' + beläggningsstapel vars fyllnadsandel matchar X/Y (renderad mätning)
- [x] #5 Obetalda visar ENDAST antalet i text-3xl semibold (e2e)
- [x] #6 Axe-0 på Hem kvarstår
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
FACIT-AVPRICKNINGEN (DoD #6, L245/L246) — varje berörd facit-/byggkravspunkt, RENDERAD verifiering (permanenta e2e-assertions i tests/e2e/hem.staging.test.ts, describe 'task-4.3', + skärmdumps-probe desktop 1440/mobil 390 mot facit-bilagorna):
1. Kortrubrik INNE i kortet, text-xl semibold sentence case MÖRK — computed-style: fontSize 20px, fontWeight 600, color rgb(36,36,36) (=--mm-text #242424), textTransform none (AC2+3-testet, grönt).
2. Dagar-kvar VIT pill topp-höger, EXAKTA former '71 dagar kvar'/'1 dag kvar'/'Idag' härledda ur startdatum — e2e med fast klocka (setFixedTime; midnatts-säkert per TASK-3-klassen) + route-mockade datum +71/+1/+0: alla tre former renderade; computed bg rgb(255,255,255), border-radius ≠ 0; boxmätt topp-höger 16 px inset ±1,5 px mot kortets region (AC1-testet, grönt).
3. Metagrupp text-small, eventnamnet MEDIUM — computed på länken: 14px/500 (AC2+3, grönt).
4. Helkorts-klickyta via stretched link, inga nästlade länkar — klick i kortets hörn (12,12) → /event/recEventNasta (befintligt AC2-test, grönt); getByRole('link')-count i kortet = 1 (AC2+3, grönt).
5. Ort med kartnålsikon — renderad svg[aria-hidden] i ort-raden, count 1 (AC2+3, grönt).
6. Långdatum 'D månadsnamn ÅÅÅÅ' med kalenderikon — renderad text '15 september 2099' (Intl sv-SE) + svg[aria-hidden] count 1 i datumraden (AC2+3, grönt).
7. 'X av Y platser bokade' caption secondary — computed 12px + color rgb(82,81,81) (=--mm-text-secondary) (AC4, grönt).
8. Tunn beläggningsstapel vit track + primär-dämpad fyllnad, andel = X/Y — renderad boxmätning: fyllnad/track = 0,25 vid 5/20 (tolerans 0,23–0,27); computed track rgb(255,255,255) (--mm-surface), fyllnad rgb(196,168,64) (--mm-primary-muted) (AC4, grönt).
9. Obetalda anmälningsavgifter: BARA antalet text-3xl semibold under kortrubriken — computed 30px/600; regionens hela text == rubrik + antal (toHaveText-regex); tom-läge = '0' ensamt (AC5 + uppdaterat tomma-listor-test, gröna).
10. Tokensystemet: inga hårdkodade färger i diffen — alla ytor via semantiska utilities (bg-surface, bg-primary-muted, text-text-secondary, bg-primary-tint/bg-bg-muted); mekaniskt grep-verifierat.
11. Axe-0 på Hem kvarstår — befintliga axe-testet grönt i fulla sviten (AC6).
Skärmdumps-probe (scratchpad, facit-lik mockdata): desktop matchar k10-facit-desktop.png på skivans yta (pill/metagrupp/stapel/Obetalda-antalet); mobil matchar k10-facit-mobil.png inkl. pill-överlappet på rubriken.

AVVIKELSE (öppen, för design-review): facit-mobilbilden visar Obetalda-rubrikens långa ord oklippt rinnande över kortkanten (prototypen saknade overflow-hantering; shell-invarianten ingen-h-scroll vid 375 px — WCAG 1.4.10 reflow, shell DoD 9 — föll i första fulla svit-körningen på exakt detta). Löst inom kortets scope: min-w-0 på kort-sektionen + break-words på rubriken → ordet radbryts INOM kortet på smal skärm ('anmälningsavg/ifter'); desktop opåverkad. Reflow-golvet är icke förhandlingsbart; radbrytningen är minsta avsteg från facit-bilden. Marcus dömer formen i granskningen.
Även noterat: kort-chromets gap 4→8 px (gap-2) per K10-referensens kortform — följdändring synlig i alla tre Hem-kort inkl. Nya anmälningar (task-4.4:s yta omstylas vidare där).

Väntar design-review (S61 batch 2) · leverans dc099b3 · CI-run 29148028260 grön per jobb (Detect changed files ✓, Lint+Audit+TypeCheck ✓, Test+Build ✓ körd, Docs link check skipped by design, CI Passed or Skipped ✓; attempt 1 = första passet) · facit-avprickningen i notes ovan
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Design-review MOT K10-FACIT: Marcus-granskning i webbläsaren godkänd mot facit-bilagorna (per skiva med UI-yta; L220)
- [x] #6 Facit-avprickningen: varje berörd facit-/byggkravspunkt avprickad med renderad verifiering (computed-style/skärmdump) före granskning (L245/L246)
<!-- DOD:END -->
