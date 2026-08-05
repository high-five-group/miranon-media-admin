---
id: TASK-127.6
title: 'Skiva: Accept-sidan — lösenord enligt ASVS-golvet'
status: Done
assignee: []
created_date: '2026-08-02 14:33'
updated_date: '2026-08-05 12:14'
labels:
  - ready-for-agent
dependencies:
  - TASK-127.1
  - TASK-127.2
parent_task_id: TASK-127
ordinal: 210000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Den nya publika sidan där inbjudan landar: e-postadressen förifylld och oredigerbar, mottagaren sätter lösenord enligt ASVS-golvet med snäll svensk vägledning, engångstoken hanteras korrekt (utgången eller redan använd länk ger ett vänligt läge som pekar mot omskick). Formen följer prototyp-facit.

Täcker användarberättelser: 2, 3, 4, 7.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 E-postfältet är förifyllt och låst — kan inte ändras via UI eller manipulerad request
- [x] #2 Lösenordsgolvet upprätthålls: minst 8 tecken med 15 rekommenderat, kontroll mot läckta lösenord, pedagogisk svensk vägledning
- [x] #3 Utgången eller förbrukad länk ger vänligt felläge med väg framåt — aldrig rå felkod
- [x] #4 Acceptance- och a11y-sviterna gröna på sidans alla tillstånd
- [x] #5 Prototyp-facit följt
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
STÄNGD 2026-08-05 (S96, orkestrerarens CI-verifiering — tvåstegs-stängningen per ADR-071).

LEVERERAD via PR #779 (MERGED 2026-08-05). CI grön per jobb: Lint+Audit+TypeCheck · Pure+Build · Acceptance (hermetisk) · Docs link check · CodeQL · Analyze (actions + javascript-typescript) · Detect changed files · CI Passed or Skipped — samtliga SUCCESS. A11y/Staging/purge korrekt SKIPPED för diff-klassen. Noll FAILURE.

BEVIS I BÅDA RIKTNINGAR (ADR-080 beslut 3): agenten körde scripts/hermetik-sjalvtest.mjs mot den nya acceptance-sviten → 4/4 fällda med OmockadRequestError, vilket bevisar att testerna genuint hänger på fixturvärlden. Samma självtest avslöjade att 9 av ursprungliga 13 tester överlevde ett tömt normalläge — de flyttades till webblasarbeteende-klassen per ADR-094 i stället för att döljas.

TVÅ POSTER LYFTA TILL MARCUS, BÅDA BESVARADE 2026-08-05:
(1) Supabases native HIBP-skydd var overifierat (Pro-plan-gated dashboard-toggle). MÄTT EFTERÅT via Management API: password_hibp_enabled = False i BÅDA miljöerna. Agentens beslut att bygga egen k-anonymitets-kontroll i stället för att anta att den var påslagen var alltså korrekt. Marcus beslut: kör BÅDA (server-side kan ej kringgås, klient-side ger bättre UX) — egen post.
(2) Facit-copyns personliga hälsning kunde inte återskapas: invite-user-EF:ens {email, role}-kontrakt bär varken namn eller inbjudare, och att härleda namn ur e-post är redan förbjudet i AuthProvider.tsx. MARCUS BESLUT: namn SKA finnas vid inbjudan — eget uppföljningskort, EF-kontraktet utökas.

ÖVRIGA ÖPPNA POSTER, ej blockerande: session_not_found/session_expired-grenen är byggd men inte oberoende testad (GoTrues wire-format kunde inte fastställas med tillräcklig säkerhet) · mjukt-tangentbord-testet är en approximation, inte en verifiering (Playwright kan inte trigga verklig VisualViewport-resize) · a11y-täckningen tolkad som axe-scan på alla tillstånd, inte bokstavligen tests/a11y/-katalogen.

CSP-YTAN UTÖKAD: SECURITY-SPEC.md connect-src bär nu api.pwnedpasswords.com (3 ställen). Extern nätverksberoende yta — noterad för Fas 7:s CSP-arbete.

AVBLOCKERAR: TASK-127.9 (dep [127.3, 127.5, 127.6]) när 127.3 landat.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
