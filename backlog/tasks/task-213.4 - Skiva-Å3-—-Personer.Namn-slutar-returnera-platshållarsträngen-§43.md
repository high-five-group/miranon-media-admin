---
id: TASK-213.4
title: 'Skiva: Å3 — Personer.Namn slutar returnera platshållarsträngen (§43)'
status: To Do
assignee: []
created_date: '2026-08-14 17:22'
updated_date: '2026-08-24 14:45'
labels:
  - ready-for-human
dependencies:
  - TASK-213.2
parent_task_id: TASK-213
ordinal: 391000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: en person utan registrerat namn visas i personlistan,
persondetaljen och Intresserade-vyn med appens egna, redan korrekt skrivna
fallbacks (förnamn/efternamn, "Okänt namn", eller "Namnlös person -
{email}") i stället för den missvisande platshållarsträngen "Ej
tillgängligt" (186-storleksordningen personer i prod, M-e).

**Detta river konsumtionskartans app-fix-rekommendation, öppet, per
ADR-063 beslut 2 (resolution I BASEN).** Byt grenen i `Personer.Namn`
(`fldnYys0Ac3UGOdpe`) som i dag returnerar `"Ej tillgängligt"` mot `BLANK()`.
Appens tre `displayName`-fallbacks (`PersonsList.tsx:107-111`,
`Intresserade.tsx:16-23`, `PersonDetail.tsx:283-288`) är redan korrekt
skrivna och börjar fungera utan att en rad app-kod rörs.

**Mätbehov täckt av skiva 2:** formelns verbatim text (läst i UI:t) och
bas-sidiga konsumenter (elva vyer på Personer, plus interfaces/formulär) —
detta är den enda åtgärden i P1 där ett tomt `Namn` kan se ut som en
regression i Airtables egna vyer, så kartläggningen är ett hårt villkor,
inte en formalitet.

**Dataförlusten (365 backfill-anmälningar utan namn) rörs INTE** —
Marcus-verifierad 2026-07-09, inte åtgärdbar. Endast platshållarsträngen
byts.

**HITL — Marcus-moment, obligatoriskt.** Formeländring i Airtables UI,
riskklass R2 (bas-sidiga konsumenter). Prod-mutationen sker ALDRIG utan
uttalat Marcus-GO för just denna skiva.

Källa: `docs/research/bas-atgardsplan-2026-08-14.md` § P1 · Å3, med underlag
i `bas-defekt-konsumtionskarta-2026-08-14.md` §43 och `data-model.md`
§ Kända fällor post 43.

Täcker användarberättelser: 4
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Personer.Namn (fldnYys0Ac3UGOdpe) formelgrenen som returnerade "Ej tillgängligt" ersatt med BLANK() — verifierat i staging
- [ ] #2 Efter fixen: M-e:s fråga (Namn="Ej tillgängligt" AND Antal anmälningar (totalt)>0) ger noll träffar i staging
- [ ] #3 Renderad verifiering (ej enbart kodläsning, L450): PersonsList, PersonDetail och Intresserade visar sina befintliga fallbacks korrekt för en person med tomt Namn
- [ ] #4 Bas-sidiga konsumenter (elva vyer på Personer m.fl., kartlagda i skiva 2) kontrollerade — inget bas-vy-beteende regredierar av ett tomt fält
- [ ] #5 Rollback-väg: den gamla formelgrenen sparad verbatim
- [ ] #6 Marcus-GO för prod-mutationen inhämtat och citerat innan formelgrenen ändras i prod
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Rollback-väg dokumenterad och bevisat reversibel (formeltext eller record-ID:n sparade verbatim) FÖRE varje prod-mutation, per skiva
- [ ] #6 Marcus-GO för prod-mutationen explicit citerat i skivans Implementation Notes, per skiva
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
S112 mandatpasset (2026-08-24): SPÄRR BEKRÄFTAD, KORTET RÖRT ENDAST HÄR (denna not). Kommentar #1 (orkestreraren S104, 2026-08-17) lästes och står KVAR: kör INTE denna skiva med nuvarande AC-lista — byt-till-BLANK()-fixen gör mailvägens visatNamn ('(namn saknas)' → 'Hej (namn,') värre. Inget annat på detta kort ändrat: ingen etikett, ingen AC, ingen prod-/stagingoperation. Måste lösas FÖRE denna skiva kan köras: (1) K1-kodfixen (visatNamn tål båda formerna + {förnamn}-egen väg, VariantD.tsx ~999-1001) landar FÖRST, i egen PR; (2) AC-listan utökas med utskicksytan + mail-förhandsvisningen (saknas i nuvarande AC#3). Se docs/reference/s113-basmaxning-dukning.md för S113-ordningen — denna skiva placeras EFTER K1-fixen, inte i S113:s första svep.
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
author: orkestreraren S104
created: 2026-08-17 09:55
---
VARNING från publik-utredningen (S104, 2026-08-17, docs/research/utskickspublikens-leads-och-namnlosa-2026-08-17.md § Den avgörande delfrågan): kör INTE denna skiva med nuvarande AC-lista. Byt-till-BLANK()-fixen gör MAILVÄGEN värre — utskicksytans visatNamn (VariantD.tsx ~999-1001) är en falsy-fallback som med BLANK() ger '(namn saknas)' → mail-hälsningen blir 'Hej (namn,'. AC #3 verifierar PersonsList/PersonDetail/Intresserade men SAKNAR utskicksytan. AC-listan måste utökas med utskicksvyn + mail-förhandsvisningen, och kodfixen K1 (visatNamn tål båda formerna + {förnamn} egen väg) bör landa FÖRE bas-bytet.
---
<!-- COMMENTS:END -->
