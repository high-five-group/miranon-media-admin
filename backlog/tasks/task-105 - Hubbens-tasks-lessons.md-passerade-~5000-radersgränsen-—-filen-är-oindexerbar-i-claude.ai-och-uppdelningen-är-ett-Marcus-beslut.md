---
id: TASK-105
title: >-
  Hubbens tasks/lessons.md passerade ~5000-radersgränsen — filen är oindexerbar
  i claude.ai och uppdelningen är ett Marcus-beslut
status: To Do
assignee: []
created_date: '2026-07-31 08:26'
labels:
  - ready-for-human
dependencies: []
priority: medium
ordinal: 183000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
**REGISTRERING, INTE LÖSNING.** Marcus beslutade 2026-07-31 att hub-lyftet skulle landa trots att det tar filen över gränsen, och att uppdelningen får ett eget kort. Detta är det kortet. **Dela inte upp filen** — formen är ett arkitekturbeslut Marcus äger.

## Problemet

Hubbens egen `CLAUDE.md` § Verktygsfakta som lätt gissas fel slår fast: *"Projektkunskap (Claude Projects) kan inte indexera filer > ~5000 rader. Bryt upp stora filer."* Samma regel bor i spokens `tasks/lessons.md` som en `[UNIVERSAL]`-post, med empirin att Psionautics `Admin.tsx` *"var oåtkomlig tills den extraherades till 19 separata filer"*.

`marcus-system/tasks/lessons.md` bryter nu mot den regeln. Filen är därmed oindexerbar i claude.ai-projektkunskapen — och det är hubbens **enda** lessons-artefakt.

## Mätningen

Mätt 2026-07-31 mot `marcus-system` HEAD `62a78ec`:

| Storhet | Värde |
|---|---|
| Rader före hub-lyftet (`b6ff178^`) | 3 744 |
| Rader efter hub-lyftet (`b6ff178`) | **5 507** |
| Ökning i ett enda steg | +1 763 |
| Överskridande av ~5 000-gränsen | ~507 rader (~10 %) |
| Filstorlek | 472 KB |
| H2-block (sessions-sektioner) | 110 |
| H3-poster (K-numrerade lärdomar) | 342 |

Gränsen passerades alltså i **ett** lyft, inte gradvis — Spår C:s hub-lyft av spoke-rader L284–L359 (72 poster, 22 sessioner).

## Vad som gör uppdelningen icke-trivial

**Korsreferensnätet.** Mätt i samma fil: **40** `[[Lnnn]]`-wikilänkar och **500** `Knn.n`-referenser — 540 interna pekare. `ADR-081` § Alternativ förkastade datum-baserade ID:n för spokens lessons med exakt detta skäl: posterna *"är korsrefererade i löpande prosa … Ett ID-byte river referensnätet utan att lösa något"*. En uppdelning som flyttar poster mellan filer möter samma invändning i en annan form.

## Alternativen — med avvägningar, utan rekommendation

| # | Alternativ | Talar för | Talar emot |
|---|---|---|---|
| 1 | **Kronologisk delning** — `lessons-arkiv-S1-S60.md` + aktiv `lessons.md` | Följer hubbens befintliga `archive/`-mönster; snittet är objektivt | 540 referenser pekar tvärs snittet; "vilken fil ligger K67.1 i?" blir en fråga |
| 2 | **Domändelning** — CI, prompt-design, arkitektur, lifecycle | Läsaren hittar det relevanta; matchar hur lessons faktiskt konsulteras | Snittet kräver omdöme per post (342 st); klass-gränser är suddiga och driver |
| 3 | **Fragment-katalog i hubben** — spegla `ADR-081`:s `lessons.d/` | Formen är redan beprövad i spoken och har en grind | Löser skrivkonflikt, **inte** filstorlek — konsoliderad fil växer ändå |
| 4 | **Index + delfiler** — `lessons.md` blir navigerbart index | Bevarar en ingång; varje del under gränsen | Indexet måste underhållas; risk för drift mellan index och delar |
| 5 | **Acceptera oindexerbarheten** — deklarera den öppet | Hubben läses i praktiken via Code mot disk, inte via claude.ai-projektkunskap | Bryter mot en regel hubben själv skriver ut; regeln blir prosa utan efterlevnad |

**Alternativ 5 förtjänar en riktig prövning, inte ett avfärdande.** Om hubbens lessons i praktiken alltid läses via Code mot lokal disk är >5000-gränsen en teoretisk kostnad — och då är rätt åtgärd att rätta hubbens `CLAUDE.md`-påstående, inte att dela filen. Det är samma klass som `ADR-083`: en regel vars efterlevnad ingen mätt.

**Vad som INTE är mätt och bör mätas före beslut:** om `marcus-system/tasks/` överhuvudtaget ingår i claude.ai-projektkunskapens synk. `ADR-048` reglerar spokens synk-horisont; motsvarande kartläggning för hubben har inte gjorts här. Är filen inte synkad är hela problemet hypotetiskt.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Synk-frågan avgjord FÖRST: ingår marcus-system/tasks/lessons.md i claude.ai-projektkunskapens synk? Mätt, inte antaget — är svaret nej faller resten av kortet och det skrivs ut
- [ ] #2 Alternativ VALT av Marcus bland de fem registrerade (eller ett sjätte) — valet och dess skäl nedskrivna, förkastade alternativ rivna öppet
- [ ] #3 Korsreferensnätet bevarat eller medvetet brutet: de 40 [[Lnnn]]- och 500 Knn.n-referenserna är verifierade efter ändringen, inte antagna intakta
- [ ] #4 Hubbens CLAUDE.md-påstående om ~5000-radersgränsen stämmer med vad som faktiskt gäller efter beslutet — rättas om alternativ 5 väljs
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
