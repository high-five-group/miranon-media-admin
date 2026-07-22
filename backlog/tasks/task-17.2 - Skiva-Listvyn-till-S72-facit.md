---
id: TASK-17.2
title: 'Skiva: Listvyn till S72-facit'
status: In Progress
assignee: []
created_date: '2026-07-21 08:19'
updated_date: '2026-07-22 11:50'
labels:
  - ready-for-agent
dependencies:
  - TASK-17.1
parent_task_id: TASK-17
ordinal: 43000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Event-listan renderar facitets listvy ände-till-ände: period-toggeln Kommande/Tidigare via primitiven, månadsgrupprubriker, likformiga slot-kort (rubrik, datumrad, beläggningsrad, status-slot endast vid avvikelse, dämpat Inställt med genomstruken rubrik, grön Fullbokat-kontur), strukturerat text-tomläge och Lugnt laddläge. URL-kontraktet ?period=upcoming|past ersätter ?status+?sort; URL-STATE-spec och berörda e2e-flöden skrivs om i samma skiva. Period härleds ur startdatum mot idag, aldrig ur Status-fältet (stänger T14 tekniskt). Täcker användarberättelser: 1-8, 13-18 (TASK-17).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Listvyn matchar FACIT-listvyn renderat (computed-verifiering + skärmdump mot bilagan)
- [x] #2 ?period-kontraktet bevisat i e2e: växling, delbar URL, back-navigation; gamla ?status/?sort borta ur spec och kod
- [x] #3 Månadsrubrikerna är riktiga rubriker i tillgänglighetsträdet; tomläge och avvikelse-markeringar renderas per facit
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Levererad i S75-batchen v2 (parallell form, ADR-073): listvyn till S72-facit ände-till-ände — ToggleButtonGroup-konsumtion (spread), månadsgrupper (riktiga h2), likformiga slot-kort (EventCard, vy-lokal), strukturerat tomläge, Lugnt laddläge, ?period=upcoming|past ersätter ?status+?sort (URL-STATE-SPEC §Event omskriven; e2e-sviten omskriven, 12 tester TDD rött-först: 11/11 röda före implementation, 12/12 gröna efter). Facit-avprickning: computed-verifiering i e2e (2lh-rubrikreserv 48px, --mm-success-kontur/stapel, --mm-error/--mm-warning-slots, platshållar-rader, mät-stillhet vid datalandning) + skärmdump 390×844 mot bilagan. ÖPPEN FACIT-AVVIKELSE (a11y-golvet): Inställt-dämpningen är text-token-buren (text-muted + opacity endast på dekor) i stället för prototypens kort-opacity-60 — axe mätte 2.77–3.96:1 (< AA 4.5:1) med kort-opacity; slot-röda blir nu osläckt --mm-error. Utanför skivan (syns i facit-bilagan men ägs av andra kort): vy-ikon-toggeln (17.4), bor över-raden (17.5), Skapa-ingången (19.x). Väntar design-review (S75-batchen v2).

CI grönt per jobb: PR-run 29867397616 + main-run 29867858651 (S75-batch v2)
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-07-22 09:09
---
Review-våg 1 (Marcus 2026-07-22): listkortets beläggningsrad ska säga 'X av Y platser reserverade' i st.f. 'bokade'. TERM-KOLLISION flaggad före fix: 'Reserverade' är redan etikett för en ANNAN kvantitet i detaljvyns beläggningsuppdelning (Belaggning.tsx rad ~146, term + inmatningsfält), och samma 'platser bokade'-sträng finns även i Hem-vyns NastaEventCard.tsx rad ~163. Term-beslut väntar Marcus (ORDLISTA-post först vid kristallisering); fixen sveper båda förekomsterna + ev. omdöp i beläggningen. Åtgärd i review-fix-vågen på denna yta före DoD #5-flipp.
---

created: 2026-07-22 10:41
---
Review-fix-vågen LEVERERAD (PR #78): 'X av Y platser reserverade' på listkorten + Hem-vyns NastaEventCard + sju e2e-sviter svepta (full inventering UTAN head-cap efter CI-fångsten — den trunkerade grepen dolde events-list + hem; prototypen medvetet orörd: fryst S72-facit, rivs i 18.13). ORDLISTA-posten 'Reserverad plats' skriven (Marcus-kristalliserad 2026-07-22). KVAR ÖPPET: beläggningsuppdelningens etikett 'Reserverade' = bas-fältet Extra platser ('Extra platser reserverade av Roger och Lotta') — rekommendation: döp raden 'Extra platser' (basens eget namn); Marcus beslutar. DoD #5 STÅR ÖPPEN.
---

created: 2026-07-22 11:50
---
Delfrågan STÄNGD (2026-07-22): beläggningsradens namn beslutat 'Extra platser' (PR #79) — termkollisionen som flaggades i denna korts review-kommentar är därmed helt löst; ORDLISTA-posten uppdaterad.
---
<!-- COMMENTS:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Design-review MOT S72-FACIT: Marcus-granskning i webbläsaren godkänd mot facit-bilagorna (per skiva med UI-yta; L220)
- [x] #6 Facit-avprickningen: varje berörd facit-punkt avprickad med renderad verifiering (computed-style/skärmdump) före granskning (L245/L246)
<!-- DOD:END -->
