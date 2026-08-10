# En fil som raderas vid konsolidering tar inte sina inlänkar med sig — svep dem i samma commit

**Raderas en fil vars innehåll flyttar (fragment-konsolidering, dok-flytt) ska
INLÄNKARNA till den sökas och skrivas om i SAMMA commit som raderingen —
annars fäller länk-grinden landningen, eller värre: ingen grind finns och
länkarna ruttnar tyst.** `[UNIVERSAL]`

Mätt 2026-08-09 (S93, skörden `#1065`). Konsolideringen raderade åtta
fragment ur `tasks/lessons.d/` enligt ADR-081:s flöde; två markdown-inlänkar
i sessionsdoket (rad 1367/1369) pekade på två av dem. Lokala grindarna på de
ÄNDRADE filerna var gröna — inlänkarna bodde i en fil diffen inte rörde.
CI:s lychee fällde (`Docs link check`), PR:en sparkades ur kön med konsumerad
armering, och en fixrunda krävdes (`aa2b802c`: länkarna → `[[L486]]`/
`[[L487]]`-referenser).

**Det generella:** samma klass som `[[L488]]` (en ändrad yta kräver svep över
alla konsument-ytor) — fälld på sin egen skörd, i bokstavlig mening: posten
som formulerade regeln landade i den PR som bröt den. Konsument-ytan för en
RADERING är alla filer som refererar filen, inte diffens egna filer. Före en
radering: `grep -rn "<filnamn>"` över repot, skriv om träffarna i samma
commit. Wikilänk-formen (`[[Lnnn]]`, fil-oberoende uppslag) är robustare än
sökvägs-länkar för innehåll som flyttar — använd den där den finns.
