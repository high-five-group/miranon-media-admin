---
id: TASK-301
title: >-
  Fynd: scripts/docraptor-sjalvbarande.mjs lämnar ohämtbara url() orörda — exakt
  422-felklassen Prince fäller hela jobbet på
status: Done
assignee: []
created_date: '2026-08-22 21:11'
updated_date: '2026-08-28 04:40'
labels:
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 551000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ur kvittots Prince-omgranskning (S108 resume 7, 2026-08-22, `docs/research/kvitto-prince-gap-grid-omgranskning-2026-08-22.md` § Övriga avvikelser). KORTET SKAPAS, LÖSES INTE HÄR.

## Signalen

`scripts/docraptor-sjalvbarande.mjs` rad 64–80: referenser som inte hittas på disk lämnas ORÖRDA — rad 66 kallar det *"fail-safe, samma princip som prototypens FOUC-fallback"*, rad 80: `if (!existsSync(abs)) continue; // fail-safe: lämna url() orörd`.

## Varför det inte är fail-safe mot DocRaptor (mätt, S108 Del 10 § B punkt 1)

En ohämtbar `url()` som lämnas orörd läses av Prince som ett försök att nå renderarens filsystem och fäller HELA jobbet med HTTP 422 `File system access is not allowed`. Fail-safe som fungerar i en webbläsare (tyst uppgivande) är destruktiv server-side. Klientvarianten `src/components/dokument/prototyp/sjalvbarande.ts` neutraliserar därför ohämtbara referenser med `local("")` sedan `#1815` — skriptet gjorde aldrig samma resa.

## Mätt instans

Kvitto-omgranskningens agent byggde självbärande HTML ur `kvitto.granskning.html` via skriptet; `bilaga-delad.css`s `@font-face` för Cavolini-Bold pekar på en gitignorerad symlänk som saknas i en worktree → referensen lämnades orörd → hade fällt DocRaptor-jobbet. Neutraliserades för hand i scratchpad-kopian; skriptet orört.

## Vad som ska göras

Samma `local("")`-neutralisering i skriptet som i klientvarianten, med ett minimalt test (en CSS med en ohämtbar url() → utdatan bär `local("")`, inte den råa sökvägen). Kommentaren rad 64–67 skrivs om — "fail-safe" är fel ord för ett beteende som fäller jobbet.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Skriptet neutraliserar ohämtbara url() med local("") — verifierat med minimaltest (ohämtbar referens in → local("") ut)
- [x] #2 Kommentaren rad 64–67 beskriver det mätta beteendet (422-klassen), inte 'fail-safe'
- [x] #3 Klient- och skript-varianten delar samma regel, bokfört i båda filhuvudena med korsreferens
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
Levererat i PR #2034 (MERGED fda2c36b, 2026-08-28). scripts/docraptor-sjalvbarande.mjs neutraliserar nu ohämtbara url() till local("") i stället för att lämna dem orörda (den 422-felklass Prince fäller hela DocRaptor-jobbet på). AC #3 löst mot supabase/functions/_shared/mall-render.ts (EF-varianten), inte klientvarianten uppdraget ursprungligen pekade på — src/components/dokument/prototyp/sjalvbarande.ts är riven sedan TASK-309.6 (5632e164); korrekt korsreferens bokförd i båda filhuvudena. Ny gatekeeper-svit scripts/test-docraptor-sjalvbarande.mjs (4 fall) CI-wirad i ci.yml. Divergens bokförd öppet i PR-kroppen: ett skarpt scarp-test mot riktig DocRaptor med GAMLA buggiga koden reproducerade INTE 422 i just det fallet (grundorsaken kräver Vites /@fs/-omskrivning, som inte finns i ren Node-skriptväg) — fixen kvarstår ändå korrekt eftersom den matchar EF-lagrets redan produktionsbeprövade semantik. CI: statusCheckRollup 16 checks, samtliga SUCCESS/SKIPPED, inga FAILURE.
<!-- SECTION:NOTES:END -->
