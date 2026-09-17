---
id: TASK-447
title: >-
  Fynd: dependabot #2484 (tanstack-gruppen) bryter bygget — overriden
  @tanstack/history 1.161.6 (ADR-028-pin) kolliderar med react-router 1.170.35;
  pin-luckring per ADR-028
status: Done
assignee: []
created_date: '2026-09-17 09:56'
updated_date: '2026-09-17 11:58'
labels: []
dependencies: []
priority: high
ordinal: 771000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Rotorsak

`package.json`s `overrides["@tanstack/history"]` var hårt pinnad till
`1.161.6` sedan `ea59787a` (2026-05-12, ADR-028, GHSA-rmmr-r34h-pfm5 —
malware i @tanstack/history 1.161.9 och 1.161.12). Dependabot-PR #2484
(tanstack-gruppen) bumpar `@tanstack/react-router` 1.170.32→1.170.35,
`@tanstack/router-plugin` 1.168.35→1.168.37, `@tanstack/router-cli`
1.167.33→1.167.35 samt query-familjen 5.102.2→5.102.8. Den nya
`@tanstack/react-router@1.170.35` deklarerar `@tanstack/router-core@1.171.29`
som beroende, och `router-core@1.171.29` kräver `@tanstack/history@1.162.3`
exakt (importerar `normalizeProtocolRelative`, en export som INTE finns i
1.161.6). Overriden tvingade hela trädet kvar på 1.161.6 → ESM-bygget kraschar
vid `vite build` (config-laddningen importerar routern transitivt).

PR #2484:s CI (run 34805552000) föll på "Pure + Build" och
"Webblasarbeteende" med exakt:

```
SyntaxError: The requested module '@tanstack/history' does not provide an export named 'normalizeProtocolRelative'
```

## Advisory-analys (GHSA-rmmr-r34h-pfm5, live `gh api /advisories/...`)

- `vulnerable_version_range`: **exakt** `= 1.161.9` ELLER `= 1.161.12` (inte
  ett `>=`-intervall) — bara de två publicerade malware-versionerna.
- `first_patched_version`: `1.161.13`.
- `withdrawn_at`: null (advisoryn är fortfarande aktiv, inte återkallad).
- `@tanstack/history@1.162.3` (routerns nya krav) ligger UTANFÖR den snäva
  vulnerable-range — malware-versionerna 1.161.9/1.161.12 är dessutom borta
  ur `npm view @tanstack/history versions` (avpublicerade från registryt).
- `npm view @tanstack/history@latest` → `1.162.4` (≠ `1.161.6`) — K0åi-
  triggern i `tasks/todo.md` rad ~8080 slår därmed till för FÖRSTA gången
  sedan ADR-028 skrevs; ingen tidigare pin-luckring finns i historiken
  (grep på "pin-luckring"/GHSA-rmmr-r34h-pfm5 i docs/decisions + tasks/lessons).

## Fixen

`overrides["@tanstack/history"]` TOGS BORT HELT (inte bumpad till 1.162.3
— den ursprungliga beskrivningen ovan antog en bump, men analysen visade
att pinnen var en ensam rest). Tre oberoende belägg: (1)
`@tanstack/router-core@1.171.29` (react-routerns egen, exakt deklarerade
dependency) kräver redan `@tanstack/history: "1.162.3"` EXAKT, utan caret —
samma mönster genomgående i hela TanStack-monorepot; (2) semver-drift-risken
overriden fanns för att stoppa är nu strukturellt omöjlig — malware-
versionerna 1.161.9/1.161.12 är avpublicerade ur npm-registryt och kan
aldrig återuppstå, override eller ej; (3) `react-router-devtools`
(devDependency) ligger i SAMMA Dependabot-`tanstack`-grupp
(`.github/dependabot.yml` rad 37–42) och dess peer-dependency på
`router-core` löses mot samma installerade instans. De övriga fem
historiska overrides-posterna (brace-expansion, fast-uri, js-yaml,
linkify-it, postcss, sharp) rörs inte. `package-lock.json`-diffen mellan
"override bumpad till 1.162.3" och "override borttagen helt" är TOM —
byte-identisk resolution (`npm install` gav "up to date"). `npm ls
@tanstack/history` visar EN version (1.162.3, deduped) efter fixen; `npm
audit` ger 0 träffar på GHSA-rmmr-r34h-pfm5.

**Runda 2 (r1-granskningsfynd, warning/ask-user):** K0åi-triggerns andra
halva — `^`-prefix-återinförande på de fyra exakt-pinnade paketen
(`@tanstack/react-router`, `router-plugin`, `router-cli`,
`react-router-devtools`) — fullbordades. Samma tre belägg ovan gäller: caret-
formen återställer bara den disciplin Dependabot redan de facto körde
(redigerar exakt versionssträng per PR). `npm install` efter caret-ändringen
gav identiska resolverade versioner för alla fem paket (ingen glidning);
`package-lock.json`-diffen är begränsad till rot-paketets specifier-speglade
`dependencies`/`devDependencies`-block, ingen annan nod i trädet rörd. K0åi-
posten borttagen ur `tasks/todo.md` per sin egen "tas bort när K0åi körts"-
klausul.

Se ADR-028 § Updates (2026-09-17-posten, inklusive runda 2-tillägget) för
fullständig motivering och belägg.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Bygget grönt med tanstack-gruppen på #2484:s versioner (npm run build exit 0, ingen normalizeProtocolRelative-SyntaxError)
- [x] #2 @tanstack/history-pinnen luckrad/bumpad med ADR-028-belägg (advisory-analys: vulnerable_version_range = exakt 1.161.9/1.161.12, first_patched_version 1.161.13, ny version 1.162.3 utanför range) och ADR-028 § Updates uppdaterad med daterad post
- [x] #3 DoD gröna: typecheck, biome check, build (exit 0 vardera); test:api/webblasarbeteende/acceptance verifierade oberoende av ändringen (A/B mot origin/main-baslinje för de reproducerbara avvikelserna)
- [x] #4 Inga nya audit-ci-paths — samma två pre-existerande advisories (GHSA-7w5x-hrqm-74c2 smol-toml, GHSA-rgj7-g3m4-5g8c sharp) före och efter
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
BESLUT (efter analys): overriden TOGS BORT HELT, inte bumpad till 1.162.3
som ursprungsbeskrivningen antog. Testet i uppdraget ("är historie-pinnen en
ensam rest?") höll: @tanstack/router-core@1.171.29 (react-routerns egen exakta
dependency) kräver redan @tanstack/history@1.162.3 UTAN vår override;
malware-versionerna 1.161.9/1.161.12 är avpublicerade ur npm-registryt (kan
aldrig återuppstå via semver-drift, override eller ej); react-router-devtools
ligger i SAMMA dependabot-tanstack-grupp och dess peer-dep löses mot samma
installerade instans. Empiriskt bevisat identiskt: package-lock.json-diffen
mellan "override bumpad" och "override borttagen" är TOM (npm install gav
"up to date"). npm audit: 0 träffar på GHSA-rmmr-r34h-pfm5 efter borttagningen.
Full motivering: ADR-028 § Updates 2026-09-17-posten.

PR (draft): #2498 — https://github.com/high-five-group/miranon-media-admin/pull/2498 · gren fix/tanstack-history-pin-luckring-task · commit 10859e33. Ersätter dependabot #2484 (stängs som superseded efter landning).

Done av S125-orkestreraren 2026-09-17: landad via #2498 (main 8d71f77d), review-grinden konvergerad (+ omstämpling efter update-branch), DoD mot PR-kroppens grind-tabell.
<!-- SECTION:NOTES:END -->
