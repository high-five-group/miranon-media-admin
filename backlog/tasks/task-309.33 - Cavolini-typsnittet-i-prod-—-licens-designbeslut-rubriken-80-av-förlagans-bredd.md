---
id: TASK-309.33
title: >-
  Cavolini-typsnittet i prod — licens-/designbeslut (rubriken 80 % av förlagans
  bredd)
status: To Do
assignee: []
created_date: '2026-08-28 02:57'
updated_date: '2026-08-28 04:43'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-309
ordinal: 604000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
BESLUTSFRÅGA FÖR MARCUS (licens/design). Härrör ur TASK-309.27 fynd 4
("RUBRIKEN ÄR I FEL TYPSNITT — ÖPPET, KRÄVER MARCUS").

FAKTA (källmärkta):

- Förlagan `~/Desktop/Miranon Media/exempelpdokument/bekräftelsebilaga-exempel.pdf`
  sätter rubriken i Cavolini-Bold (mätt med `pdffonts`).
- Repots låsta väg B (`docs/mallar/bilagor/bilaga-delad.css` § FONTSTRATEGIN):
  Cavolini primärt via git-ignorerad symlänk
  `docs/mallar/bilagor/lokala-typsnitt` → `~/.miranon-fonts/`, Comic Neue Bold
  som AVSIKTLIG fallback (font-stack, ingen JS-detektion).
- `docs/mallar/bilagor/README.md` § Fontstrategin: `fsType` i `OS/2`-tabellen
  mätt till `0x0008` (Editable Embedding) på alla fyra Cavolini-vikter
  (Bold/Regular/Italic/Bold-Italic).
- EF-lagret bundlar Cavolini ALDRIG: `supabase/functions/_shared/mall-render.ts`
  rad ~106–137, `FONT_BASE64_PER_FILNAMN` saknar Cavolini avsiktligt — faller
  till `local("")` (fail-safe, aldrig ett kastat fel). Prod renderar därför
  alltid Comic Neue-fallbacken.
- Mätt (kortets 309.27-notes, fynd 4): vår rubrik är 80 % av förlagans bredd
  och 89,5 % av höjden, i BÅDA bilagorna (bekräftelse- och
  deltagarinformations-mallen).
- Filerna FINNS lokalt, verifierat 2026-08-28:
  `~/.miranon-fonts/Cavolini-Bold.ttf` (117276 B, 2026-08-19 14:02) och
  Office molnfont-cachen
  `~/Library/Group Containers/UBF8T346G9.Office/FontCache/4/CloudFonts/Cavolini/29448758089.ttf`
  (117276 B, 2026-08-19 13:57; TTF `name`-tabellen säger "Cavolini Bold").
  `shasum -a 256` på båda filerna 2026-08-28: **identisk hash**
  (`37ba2494abb25d9beabea86351114a0cc260881593501a25f05eb7d1fc1efb4e`) —
  samma fil, två källor.
- I CloudFonts-filens `strings`-utdata (verifierat 2026-08-28) står VERBATIM:
  "This web font file is intended for use with the Microsoft Sway application
  only, and not for further use or distribution of any kind." — samma sträng
  som TTF-filens egen `name`-tabell (Monotype Imaging Inc., 2015/2016).

BESLUTSFRÅGA: vilken väg för Cavolini-rubriken i prod?

(a) Behåll Comic Neue i prod (låst väg B, ser avsiktligt ut — ingen ändring).
(b) Bundla Cavolini i EF:en (server-side inbäddning i PDF:en). `fsType`
    tillåter dokumentinbäddning, men Sway-EULA-strängen talar emot annan
    användning — juridiskt oklart, kräver licensbesked innan bygge.
(c) Köp/licensiera Cavolini på riktigt, eller välj ett annat OFL-typsnitt
    närmare förlagans karaktär.
(d) Justera Comic Neue-rubrikens storlek/letter-spacing (ren CSS) så bredden
    matchar förlagan bättre — ingen licensfråga, billig förbättring oavsett
    vilken av (a)/(b)/(c) som väljs på sikt.

REKOMMENDATION (agentens, inte bindande): (a) för söndagens deadline —
ändra ingenting akut. (d) som billig förbättring oavsett utfall. (b) endast
efter explicit licensbesked (Sway-EULA-strängen ovan är en stark varningssignal,
inte ett förbud i sig — kräver en människas juridiska bedömning, inte en
agents).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Beslut bokfört med källa: vald väg (a/b/c/d) och motivering skriven i kortet
- [ ] #2 Vald väg byggd/verifierad med npm run mall:pdf + pdffonts + pdftotext -bbox-mätning mot förlagan
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Marcus beslut 2026-08-28: (a) Comic Neue i prod på söndag (låst väg B) + (d) CSS-justering av rubrikbredden som förbättring; (b) bundla i EF endast efter licensbesked (Sway-only-EULA-strängen). Lokal symlänk docs/mallar/bilagor/lokala-typsnitt → ~/.miranon-fonts skapad 2026-08-28 (git-ignorerad).
<!-- SECTION:NOTES:END -->
