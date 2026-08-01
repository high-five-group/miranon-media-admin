---
id: TASK-108
title: >-
  Fynd: trådregistrets integritet — falska statuspåståenden, ruttna radnummer
  och en grind som ser 12 % av registret
status: Done
assignee: []
created_date: '2026-07-31 08:38'
updated_date: '2026-08-01 12:35'
labels:
  - ready-for-agent
dependencies: []
priority: high
ordinal: 182000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus beställde 2026-07-31 en kartläggning av trådregistret inför nästa resume av S91. Detta kort är den andra halvan: **integritetskontrollen av registret självt**. Skälet att de är två uppdrag: en karta byggd ovanpå ett register med fel status är en karta som ljuger med auktoritet — restlistans audit 2026-07-28 fann tolv statusfel, samtliga kopior av register som redan hade rätt svar.

### Vad mätningen gav

`tasks/threads/README.md` bär **109 trådrader** (`T01`–`T109`), inte 110. Tillstånd mätt på kolumn-token, inte på prosaförekomst: **13 `active`** (inte 14), **68 `paused`**, **28 `closed`** — summan 109 stämmer med radräkningen. Numreringen är intakt: noll luckor, noll dubbletter, stigande ordning genomgående.

### Fyra falska statuspåståenden, belagda mot backlog-CLI:t

Ingen härledd ur registret självt — CLI:t är enda giltiga källan (restlistans § Filens egna fel post 7).

| Tråd | Registret påstår | CLI:t säger |
|---|---|---|
| `T109` | "`TASK-80` förblir `To Do`" | **Done** — `#447` mergade 2026-07-29T17:29:45Z, cirka 2 h efter registreringen |
| `T80` | "bygget bärs av TASK-29 … ready-for-agent" | TASK-29 **Done** |
| `T85` | "KVAR: 36.8 (QA-vandringen, ready-for-human)" | TASK-36.8 **Done** |
| `T103` | åtgärdspunkt "efter sista migreringsvågen (`TASK-59.6`)" | TASK-59.6 **Done** — triggern har löst ut |

### Ruttna radnummer — `T25` är fel på två av tre punkter

`T25` påstår `chunk<T>` "DEFINIERAD identiskt i TRE EF:er". Mätt mot disk:

- `get-person/index.ts:46` — **korrekt**
- `get-attendance/index.ts:41` — **fel**, faktisk rad **45**
- `get-registrations/index.ts:28` — **ingen `chunk`-definition alls**; borttagen i `220ea19` (task-18.17). Rad 28 är mitt i en sorteringsfunktion.

Substansen faller med referensen: trådens hela premiss är "rule-of-three nådd, 3 call-sites". Det är nu **två**. Tröskeln som motiverar konsolideringen är inte längre nådd.

### Den kontroll som redan finns — och vad den tyst inte ser

Premissen "trådregistret har ingen mekanisk kontroll alls" är **falsk**. `scripts/check-lifecycle.sh` rad 72–130 validerar tråd-kort och är wirad två gånger: `check-docs.sh:163` (grind 6 av 10) och `ci.yml:570`.

Men den bär exakt den egenskap restlistans § Filens egna fel varnar för — *en kontroll som tyst inte täcker en radklass är farligare än ingen kontroll, för den läses som täckande*:

| Klass | Antal | Ser grinden den? |
|---|---|---|
| Trådfil MED `lifecycle:` | 13 | **Ja** |
| Trådfil UTAN `lifecycle:` | 8 | **Nej** — rad 94 `[[ -z ... ]] && continue`, tyst skip |
| Tråd med enbart indexrad | 88 | **Nej** — loopen itererar över filer, inte rader |
| Indexets egen integritet | — | **Nej** — ingen kontroll av numrering, dubbletter, radform, tillstånds-token |

**Faktisk täckning: 13 av 109 trådar = 11,9 %.** Grinden presenterar sig som "Lifecycle på sessionsdok + trådkort" och skriptets header säger "grinden validerar även tråd-kort" — den läses som täckande.

### Vad som var rent

Sökt systematiskt, noll fynd: ADR-referenser (29 unika, 0 döda) · TASK-referenser (0 döda) · relativa markdown-länkar (47 unika, 0 döda) · bilage-referenser (5, 0 döda) · trådfil mot index (21 av 21 har rad, 21 av 21 pekar rätt, 0 tillståndsdrift) · numrering (0 luckor, 0 dubbletter). Tio commit-SHA:er saknas i detta repo men samtliga är explicit märkta `hub` — hub-repots historik, inte döda referenser.

### Frontmatter-driften `T20` förutsade

`updated: 2026-07-25`, senaste git-touch **2026-07-30** — fem dagars drift. `T20` beskriver mekanismen exakt: filen står inte i `.frontmatter-policy.conf`, så pre-commit-hooken bumpar den aldrig. Verifierat mot policy-filen: noll träffar på `threads`.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Grovmätningen verifierad mekaniskt med faktiska tal — radantal, tillstånd per enum mätt på kolumn-token (ej prosaförekomst), numreringens integritet. Avvikelser mot uppdragets antagna tal redovisade
- [x] #2 Varje trådrads kort-påstående prövat mot backlog-CLI:t, aldrig mot registret självt. Falska statuspåståenden rättade med CLI-verifierat nuläge; registrets egen tvetydighet mellan tråd-kort (fil) och backlog-kort redovisad
- [x] #3 Varje closed-tråds stängningsskäl prövat mot repot — kortet finns, landade, inget i repot motsäger. Motsägelser rättade eller bokförda som oavgjorda MED skäl i filen
- [x] #4 Döda referenser sökta systematiskt per klass med antal per klass: ADR, kort, markdown-länk, bilaga, commit-SHA, radnummer. Ruttna radnummer rättade mot faktiskt filinnehåll, inte mot antagande
- [x] #5 Trådfilerna prövade mot indexet åt BÅDA håll — fil utan indexrad och indexrad som pekar på saknad fil — samt tillståndsdrift fil mot index
- [x] #6 Kontroll-täckningen MÄTT: vilken andel av registret befintlig grind faktiskt ser, och exakt vilken radklass den tyst hoppar över. Talet redovisat, inte uppskattat
- [x] #7 Mekanisk kontroll av indexet byggd som NY fil med tvåsidigt bevis — fäller mot planterat känt fel per invariant, grön mot rättat register. Beviset körbart i repot, inte bara i rapporttext
- [x] #8 updated-stämpeln i registrets frontmatter synkad mot verklig git-touch
- [x] #9 CI-wiringen för den nya kontrollen BESKRIVEN i kortet men EJ byggd — ci.yml och check-docs.sh ägs av parallella agenter
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Levererat

**Ny grind:** `scripts/check-thread-index.sh` + `.thread-index-policy.conf` (config-driven per Lesson #6) + `scripts/test-check-thread-index.sh`.

Fyra invarianter, ingen överlappar `check-lifecycle.sh`: radform och kolumnantal · enum-giltigt tillstånd läst ur **rätt kolumn** · numrering (dubblett, lucka, omkastning) · index↔fil åt båda håll.

Medvetet utanför scope, deklarerat i skriptets header så det inte läses som glömt: tillståndsdrift fil↔index (ägs av `check-lifecycle.sh` — två grindar med rätt att säga emot varandra är värre än en) · `updated:`-färskhet mot git (kräver historik en shallow CI-checkout inte garanterar; en grind vars utfall beror på klondjup är en falsk-röd-fabrik) · innehållets sanning (omdöme mot extern källa, inte en filinvariant).

## Tvåsidigt bevis

**Testsvit: 17/17**, varav 15 planterar ett känt fel och 2 prövar grönt på korrekt indata. `T4` är falskpositiv-regressionen (ordet "paused" i prosan får aldrig räknas som radens tillstånd). `T11` är täcknings-regressionen: trådfil UTAN `lifecycle:`-fält, alltså exakt klassen `check-lifecycle.sh` tyst hoppar över. `T16`/`T17` prövar en policy som sourcar men tappat en nyckel — utan tomhetskontrollen validerar grinden mot tom sträng och rapporterar grönt.

**Skarp plantering i det VERKLIGA registret, sex prov, ett per invariant** — alla exit 1 med rätt radnummer:

| Planterat fel | Grindens svar |
|---|---|
| T74 före T73 (det fel som rättades 2026-07-29) | `:116 LUCKA mellan T72 och T74` + `:117 T73 står EFTER T74` |
| `` `done` `` som tillstånd på T50 | `:93 T50 har tillstånd 'done' i kolumn 3` |
| T61 omnumrerad till T60 | `:104 T60 är en DUBBLETT` |
| T42 omnumrerad till T142 | `:85 LUCKA mellan T41 och T142` |
| Oescapad pipe i T03:s titel | `:46 T03 har 6 pipe-tecken (förväntat 5)` |
| T01 länkar en trådfil som saknas | `:44 T01 länkar T01-finns-inte.md som inte finns` |

Registret återställdes bit-identiskt efteråt (`diff` rent) och grinden är grön mot det rättade registret.

## Grindar, mätta

`check:docs` **exit 0** (tio grindar) · `shellcheck --severity=style --enable=all` med CI:s exakta scope **exit 0** (0/0/0/0 per ADR-033) · `biome check .` **exit 0** · `test-check-lifecycle.sh` **16/16** (befintlig grind obruten).

## CI-wiringen — BESKRIVEN, EJ BYGGD

`ci.yml` och `check-docs.sh` ägs av parallella agenter. Tre ändringar krävs, alla en rad:

1. **`scripts/check-docs.sh`** — lägg `run_gate "Tråd-registrets index" bash scripts/check-thread-index.sh` bredvid rad 163:s lifecycle-anrop, och räkna om headerns grind-uppräkning från tio till elva. **Räkningen i headern är en `ADR-083`-yta**: `TASK-98` fann att samma uppräkning redan påstår en CI-körning som inte finns.
2. **`.github/workflows/ci.yml`** — grinden följer med automatiskt via `check-docs.sh`, men lägg **`.thread-index-policy.conf` i shellcheck-scopet** (raderna 905–917). Skriptet självt fångas av `scripts/*.sh`, conf-filen inte. Kommentaren på rad 897 säger det rakt ut: *"en sourced conf utanför scopet är samma lucka som de övriga redan stänger."* Räkningen "åtta" i samma kommentar blir nio.
3. **`ci.yml` testsvits-steget** — `bash scripts/test-check-thread-index.sh` bredvid rad 672:s `test-check-lifecycle.sh`.

Utan steg 2 är den nya conf-filen den nionde sourcade conf:en utanför en grind som finns för att täcka just dem.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Leveransen (PR #514, head 26b3af4, merge ab73dfa): grinden scripts/check-thread-index.sh + .thread-index-policy.conf + testsvit 17/17, fyra falska statuspåståenden rättade, T25:s ruttna radnummer rättade, täckningen mätt till 13/109 = 11,9 procent. DoD#3 verifierad i efterhand: run 30618762741 alla körda jobb success (skips by-design), landad via merge queue. CI-WIRINGEN (AC#9 beskriven, ej byggd här) är nu BYGGD av ci.yml-agenten i PR #529 (merge c717c3c, merge_group-run 30696934638 alla jobb gröna): eget steg i lint-jobbet + test-check-thread-index.sh i gatekeeper-steget + .thread-index-policy.conf som nionde conf i shellcheck-scopet. AVVIKELSE mot kortets wiring-beskrivning, bokförd i #529: antagandet att grinden 'följer med automatiskt via check-docs.sh' var falskt — CI kör inte check-docs.sh (noll run-träffar), så ett eget lint-jobb-steg krävdes; utan det hade check-docs.sh:s rubrik påstått en mekanism som inte finns (ADR-083-felklassen). Grindens CI-kostnad mätt: 2 s i CI mot 41-43 s lokalt (macOS bash 3.2 är den långsamma parten). Kortets tre-ändringar blev fyra.
<!-- SECTION:FINAL_SUMMARY:END -->
