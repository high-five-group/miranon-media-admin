---
id: TASK-102
title: >-
  Fynd: backlog-CLI:t är ett odeklarerat förkrav och grindens default löser upp
  till ett främmande paket — form (a) + mätt karens
status: Done
assignee: []
created_date: '2026-07-31 08:21'
updated_date: '2026-07-31 08:59'
labels:
  - ready-for-agent
dependencies: []
priority: high
ordinal: 180000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`backlog.md@1.47.1` är globalt installerad på Marcus maskin, är varken `dependency` eller `devDependency`, och nämns i ingen fil — samtidigt som hela kort-arbetsflödet vilar på den (`/to-prd`, `/to-issues`, `/do-work`, varje AC-bockning i varje bygg-agents leverans).

Research-passet `docs/research/node-cli-deklaration-och-pinning-2026-07-30.md` avtäckte att risken är allvarligare än tråd `T107` formulerade den. `T107` skrev "opinnat paket"; rätt beskrivning är **namnkollision med tyst exekvering av främmande kod**.

Grindens default är `BACKLOG_CMD="${BACKLOG_CMD:-npx backlog}"`. Paketet heter `backlog.md`, binären heter `backlog` — och det finns ett ANNAT npm-paket som heter just `backlog`, av en annan författare, med egen `bin: {"backlog": …}` och utan provenance. `npx` löser upp bara namnet som ett paketnamn. Mätt i isolerad miljö (tom cache, tomt prefix, ingen global installation):

    npm error npx canceled due to missing packages and no YES option: ["backlog@1.4.56"]

npx auto-installerar utan att fråga när stdin inte är en TTY — vilket den aldrig är i CI.

## Marcus beslut 2026-07-31

"Kör (a), och mät karens-fönstret i samma pass."

Form (a) = `backlog.md` som pinnad `devDependency` med `BACKLOG_CMD` pekad på `node_modules/.bin/backlog`. Pinnad på **1.47.1** (versionen som faktiskt är i bruk), inte registrets `latest` 1.48.0 vars ändringar passet uttryckligen inte undersökte.

## Karensen — det andra ledet

Grinden fäller på tillståndet *alla AC bockade + öppet status*. Det är EXAKT det tillstånd varje bygg-agents kontrakt kräver: agenten bockar AC men får inte sätta Done, eftersom DoD kräver "CI grön per jobb" och den signalen saknas när agenten är klar. Utan karens fäller grinden på korrekta kort — under en niovåg på nio samtidigt.

Passet lämnade fönstrets längd **helt obelagd** ("Helt obelagt av mig"). Detta kort mäter den ur git-historiken i stället för att härleda den ur en rimlighetsbedömning.

## Avgränsning

CI-wiringen av grinden ingår INTE — `.github/workflows/**` ägs av en systeragent i PR #496. Wiringen är nästa steg.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Grindens default kan inte längre lösa upp till ett främmande paket — verifierat mekaniskt i testsviten, inte antaget
- [x] #2 backlog.md@1.47.1 deklarerad som pinnad devDependency med äkta integritets-pinning i låsfilen, och npm ci levererar node_modules/.bin/backlog — mätt, inte citerat
- [x] #3 audit-ci mätt SJÄLV mot repots egen nivå med den nya dependencyn — utfall och exitkod redovisade
- [x] #4 Grindens körtid mätt SJÄLV, interfolierad A/B med loadavg per körning — inte projicerad ur passet
- [x] #5 Karens-fönstrets längd härledd ur MÄTNING av hur länge kort faktiskt legat i det fällande tillståndet — n, spridning och vald percentil redovisade, och underlagets tunnhet bedömd öppet
- [x] #6 Beslutet om kort utan updated_date fattat och motiverat i skriptet, inte lämnat implicit
- [x] #7 Karens-värdet bor i .backlog-closure-policy.conf, aldrig i skriptet — repots grindvakts-konvention
- [x] #8 Tvåsidigt grindbevis med exitkoder: grinden FÄLLER ett kort som glömts bortom karensen och är GRÖN mot ett just levererat innanför den
- [x] #9 Ställningstagande till --ignore-scripts och min-release-age redovisat med utfall, även där svaret blir nej
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
T107 löst på Marcus beslut 2026-07-31: "Kör (a), och mät karens-fönstret i samma pass." backlog.md@1.47.1 pinnad som devDependency, BACKLOG_CMD pekad på node_modules/.bin/backlog. NAMNKOLLISIONEN LÖST STRUKTURELLT: npx backlog löste inte upp till backlog.md utan till backlog@1.4.56 — ett annat paket av en annan författare, som npx auto-installerar utan att fråga när stdin inte är en TTY, vilket den aldrig är i CI. Lockfilen bär äkta integrity (sha512) och samtliga sex plattformsvarianter, linux-x64 inkluderad. audit-ci exit 0 på alla tre nivåer. Grinden blev 34 procent snabbare (211,8 s -> 139,4 s). KARENSEN 24 h är MÄTT, inte härledd: n=91 kort ur git-historiken, och 24 h är inte en percentil utan mitt på en platå där 19-28 h ger identiskt utfall (11 av 91 fälls). 12 h fäller 20/91; 48 h fäller 1/91 och neutraliserar grinden. Underlagets svaghet står öppet: 22 av 91 punkter kommer ur EN klumpstängning och är inte oberoende. TVÅ KORRIGERINGAR AV RESEARCH-PASSET, båda mätta: --ignore-scripts är INTE gratis (repots postinstall wirar pre-commit-hooken via core.hooksPath; en repo-vid .npmrc hade tyst slutat göra det) och min-release-age FINNS INTE i npm 11.8.0. Tidszonen mätt: updated_date skrivs i UTC, brytpunkten räknas med date -u — sätt inte TZ i workflowen. AGENTENS EGET MÄTFEL, fångat: git log --name-status citerar sökvägar med icke-ASCII, vilket tappade 145 av 179 kort — och utfallet SÅG trovärdigt ut (n=23, rimlig fördelning). Rättat med core.quotePath=false. CI-wiringen kräver TVÅ tillägg och ingår INTE här: sviten till ci.yml, grinden till nightly.yml med npm ci, plus att larmkedjan skiljer exit 1 (drift) från exit 2 (anropsfel). T107 får därför INTE stängas på detta kort ensamt. Landad #509 (154acca), merge_group grön (30b09422).
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
