---
id: TASK-301
title: >-
  Fynd: scripts/docraptor-sjalvbarande.mjs lämnar ohämtbara url() orörda — exakt
  422-felklassen Prince fäller hela jobbet på
status: To Do
assignee: []
created_date: '2026-08-22 21:11'
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
- [ ] #1 Skriptet neutraliserar ohämtbara url() med local("") — verifierat med minimaltest (ohämtbar referens in → local("") ut)
- [ ] #2 Kommentaren rad 64–67 beskriver det mätta beteendet (422-klassen), inte 'fail-safe'
- [ ] #3 Klient- och skript-varianten delar samma regel, bokfört i båda filhuvudena med korsreferens
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
