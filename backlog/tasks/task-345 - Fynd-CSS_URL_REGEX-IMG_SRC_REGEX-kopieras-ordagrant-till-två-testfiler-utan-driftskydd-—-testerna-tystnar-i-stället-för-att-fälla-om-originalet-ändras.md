---
id: TASK-345
title: >-
  Fynd: CSS_URL_REGEX/IMG_SRC_REGEX kopieras ordagrant till två testfiler utan
  driftskydd — testerna tystnar i stället för att fälla om originalet ändras
status: To Do
assignee: []
created_date: '2026-08-29 16:51'
labels:
  - fynd
  - ready-for-agent
dependencies: []
ordinal: 629000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Granskningsfynd (warning/ask-user) på PR #2113 runda 1, 2026-08-29.

`CSS_URL_REGEX` och `IMG_SRC_REGEX` definieras i `supabase/functions/_shared/mall-render.ts` (rad 212 resp. 227) och är sedan TASK-342 **kopierade ordagrant** in i TVÅ testfiler:

  tests/api/mall-render.test.ts                       (sedan tidigare)
  tests/api/mall-render-sjalvbarande-resurser.test.ts (TASK-342, rad 46-47)

De är byte-identiska i dag — verifierat av granskaren. Men ingen mekanism fångar drift: ändras originalet utan att kopiorna följer med tystnar båda testerna i stället för att fälla. `mall-render-sjalvbarande-resurser.test.ts` säger det RAKT UT i sin egen kommentar (rad 22-24): *"en framtida ändring av regexerna i mall-render.ts som INTE speglas hit upptäcks inte automatiskt."*

Det är alltså en KÄND, DEKLARERAD skuld — inte ett förbiseende. Kortet finns för att den nu bärs på två ställen i stället för ett, vilket dubblar ytan utan att lägga till något skydd.

VARFÖR KOPIAN GJORDES (och varför en naiv import inte löser det): `mall-render.ts` importerar från `esm.sh` och kan inte laddas rakt in i Node-testmiljön. Testerna läser därför filen som TEXT och regex-matchar källkoden. En vanlig `import { CSS_URL_REGEX }` är alltså inte tillgänglig — det är skälet till kopian, inte lättja.

GÖR — utred vägarna och välj EN, med skälet bokfört:
(i) extrahera regexerna till en egen ren modul under `_shared/` som BÅDE `mall-render.ts` och testerna kan importera (kräver att modulen är fri från esm.sh-beroenden);
(ii) låt ETT test läsa båda källorna som text och jämföra regex-literalerna mot varandra — fäller vid drift utan att kräva import;
(iii) motivera att kopian får bestå, och skriv då in i BÅDA testfilerna vad som ska uppdateras och var, i stället för dagens konstaterande att drift inte upptäcks.

Väg (ii) är den billigaste och löser exakt det fyndet pekar på; (i) är renast men kan dra in mer refaktorering än frågan förtjänar. Över-engineering-vakten gäller: det finns i dag EN känd konsument-klass (testerna), inte en generell paritets-motor att bygga.

INGEN ÄNDRING AV RENDERINGSBETEENDET i denna skiva — precis som TASK-341/342.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 En av vägarna (i)/(ii)/(iii) vald och genomförd, med skälet och de förkastade alternativen bokförda i Implementation Notes
- [ ] #2 Tvåsidigt bevis: en ändring av regexerna i mall-render.ts som inte speglas till testfilerna FÄLLER; en korrekt speglad ändring är grön
- [ ] #3 Båda testfilerna (mall-render.test.ts, mall-render-sjalvbarande-resurser.test.ts) omfattas; ingen renderingslogik rörd
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
