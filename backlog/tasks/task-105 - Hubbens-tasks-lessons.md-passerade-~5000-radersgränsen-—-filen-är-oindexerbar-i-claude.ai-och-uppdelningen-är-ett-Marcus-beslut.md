---
id: TASK-105
title: >-
  Hubbens tasks/lessons.md passerade ~5000-radersgränsen — filen är oindexerbar
  i claude.ai och uppdelningen är ett Marcus-beslut
status: Done
assignee: []
created_date: '2026-07-31 08:26'
updated_date: '2026-08-01 11:27'
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
- [x] #1 Synk-frågan avgjord FÖRST: ingår marcus-system/tasks/lessons.md i claude.ai-projektkunskapens synk? Mätt, inte antaget — är svaret nej faller resten av kortet och det skrivs ut
- [x] #2 Alternativ VALT av Marcus bland de fem registrerade (eller ett sjätte) — valet och dess skäl nedskrivna, förkastade alternativ rivna öppet
- [x] #3 Korsreferensnätet bevarat eller medvetet brutet: de 40 [[Lnnn]]- och 500 Knn.n-referenserna är verifierade efter ändringen, inte antagna intakta
- [x] #4 Hubbens CLAUDE.md-påstående om ~5000-radersgränsen stämmer med vad som faktiskt gäller efter beslutet — rättas om alternativ 5 väljs
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
FINAL SUMMARY (2026-08-01, stängning efter hub-landning)

VAL: Alternativ 4 i volymform — tunt index + 4 frysta volymer + aktiv vol-05 (Node.js-changelog-modellen). Marcus beordrade uppdelningen 2026-08-01 och delegerade formvalet explicit ("Du avgör vad som blir bäst och mest branschledarmässigt"); formvalet prövades mot web-researchade precedenter (Node.js CHANGELOG index+volymer; ADR-praxis en-fil-per-record — prövad, förkastad: append-enheten är H2-sessionsblocket; Keep a Changelog #529/Symfony/GitLab). Fullt beslut + rivna alternativ: ADR-085 (docs/decisions/, denna PR).

AC #1 (synk-frågan): mätt mot disk — hub-README § Två läsare utpekar claude.ai-projektkunskapen som Marcus läsyta för hubben; hub-CLAUDE.md bär ~5000-regeln som hub-fakta; ingen ADR-048-motsvarande exkluderingshorisont finns i hubben. Mätningens gräns utskriven: live-fillistan i claude.ai-projektet är onåbar från byggmiljön. Marcus beslut 2026-08-01 stängde nej-grenen oavsett.
AC #2: valet + skälen + förkastade alternativ (kortets fem + en-fil-per-lesson) rivna öppet i ADR-085.
AC #3 (referensnätet): volymkropparna byte-identiska med källutdragen (diff grönt per volym); 110 H2 + 342 H3 + 40 [[Lnnn]] + 500 Knn.n summerar EXAKT per volymkropp mot källfilens totaler. Uppslag är grep-baserade och fil-oberoende — inga pekare brutna.
AC #4: hubbens CLAUDE.md-påstående står oförändrat och hubben UPPFYLLER det igen — största fil 1890 rader. Ingen rättelse behövdes (alternativ 5 valdes inte).

HUB-LEVERANS: PR high-five-group/marcus-system#11, merge-SHA f3ab954caa1282304d5e5623e28e8cf0fe2a107c. tasks/lessons.md (5507 r) → index (62 r) + vol-01 775 / vol-02 1890 / vol-03 1126 / vol-04 1782 / vol-05 16 r (aktiv). Rotation: >3000 rader vid lyft-start ⇒ ny volym FÖRE lyftet (värsta mätta lyft +1764 ⇒ max ~4800 < ~5000; normaltakt 400-800 r/mån mätt ur git-historiken). lessons-hub-sync + phase-end-verify uppdaterade mot aktiv volym; plugin 1.24.0 → 1.25.0, claude plugin update körd och verifierad i samma landning. OBS: hubben saknar CI/ruleset/merge-kö (mätt: rulesets=[], branch not protected) — hub-landningen är PR + direkt merge; DoD #3 avser spoke-PR:erna.

SPOKE-LEVERANS (denna PR): ADR-085 + ADR-indexrad + README-räkning 84→85 (check-adr-count-grinden) + CONTRIBUTING fas-avsluts-raden → aktiv volym + detta kort.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
