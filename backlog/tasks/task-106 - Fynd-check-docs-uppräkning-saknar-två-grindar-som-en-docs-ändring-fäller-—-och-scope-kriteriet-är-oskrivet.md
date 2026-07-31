---
id: TASK-106
title: >-
  Fynd: check:docs uppräkning saknar två grindar som en docs-ändring fäller —
  och scope-kriteriet är oskrivet
status: To Do
assignee: []
created_date: '2026-07-31 08:43'
updated_date: '2026-07-31 08:45'
labels:
  - ready-for-agent
dependencies: []
priority: high
ordinal: 180000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`scripts/check-docs.sh` lovar i sin första rad att köra *"ALLA dokumentations-grindar CI kör"* och räknade upp tio. Räkningen var sann — tio poster, tio uppräknade, tio körda. Listan var det inte.

**Fel 1 — talet stod på två ställen och sade olika saker.** `.claude/agents/bygg-agent.md:55` sade *"(nio grindar)"*, skriptets slutrad *"samtliga tio"*. **Tre oberoende agenter rapporterade avvikelsen samma dag** utan att någon kunde åtgärda den — raden bor i deras egen systemprompt, och `.claude/agents/**` låg utanför deras filytor.

**Fel 2 — uppräkningen saknade två grindar som CI kör och som en docs-ändring fäller.** Verifierat mot disk 2026-07-31 med `grep -oE '^[[:space:]]+run: bash scripts/check-[a-z0-9-]+\.sh' .github/workflows/ci.yml`:

| Grind | I ci.yml lint-jobbet | I check-docs.sh:s tio | I undantagslistan |
|---|---|---|---|
| check-fetch-depth-invariant.sh | rad 594 | nej | nej |
| check-listparitet.sh | rad 615 | nej | nej |

`check-fetch-depth-invariant.sh` läser ADR-029 + ADR-030 och kräver att erratum-noten finns. `check-listparitet.sh` läser `CONTRIBUTING.md` via paret `sentinel-markorer` (`.listparitet-policy.conf` rad 138) och `scripts/check-docs.sh` via paret `lychee-scope`.

Tvåsidigt mätt mot fixtur samma dag: båda är gröna på repots innehåll (exit 0) och fäller på en **ren .md-ändring** (exit 1) — struken erratum-rad i ADR-029 respektive struken sentinel-backtick i CONTRIBUTING.md.

Kostnaden: 0,052–0,066 s respektive 0,847–0,874 s lokalt (macOS, loadavg 3,4–4,8, tre körningar var) mot 19,27 s för hela skriptet — ~+4,8 %. **CI-tiden är inte mätt.**

**Detta är inte samma felklass som `TASK-98` lagade** (där påstods en mekanism som inte fanns). Kostnaden är densamma: `npm run check:docs` rapporterade *"samtliga tio körda"* och CI kunde ändå fälla på en docs-ändring. Utvecklaren som körde den lokala grinden grönt trodde sig vara klar.

Rot-orsaken är djupare än de två posterna: **listan hade inget utskrivet inklusions-kriterium.** Räkningen kunde granskas, listan kunde det inte — ingen kunde pröva vad som *borde* stå där. Undantagslistan var en naken uppräkning utan skäl per post.

Riktning B ur `TASK-98`:s AC #5, rapporterad som scope-beslut utanför dess AC.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Scope-beslutet FATTAT och motiverat i filen: de två grindarna in eller utanför — förkastat alternativ bär sitt skäl, och skriptets löfte ('ALLA dokumentations-grindar CI kör') stämmer med utfallet
- [x] #2 Inklusions-KRITERIET utskrivet i check-docs.sh, operativt nog att en läsare kan pröva en ny kandidat mot det utan att fråga någon
- [x] #3 Undantagslistan bär skäl PER POST, inklusive varje grind som kör i samma alltid-på lint-jobb men medvetet står utanför
- [x] #4 Tvåsidigt bevis per tillagd grind: grön mot repots faktiska innehåll OCH fäller på en ren .md-ändring — mätt, inte läst
- [x] #5 Slutradens grind-antal kan inte längre divergera från listan — bevisat genom att talet ändras när listan ändras
- [x] #6 Det felaktiga talet i agent-definitionen rättat, och kopian borttagen i stället för uppdaterad
- [x] #7 Uppräkningen verifierad mekaniskt mot ci.yml med run:-ankrad grep — den okvalificerade formen redovisad där den skiljer sig
- [x] #8 Paret check-docs.sh <-> ci.yml: byggt med tvåsidigt bevis, ELLER eget kort mintat med mätt skäl till varför det inte byggdes här
<!-- AC:END -->
