# Ett facit som täcker en av grindens två vyporter gör grinden halv — och en grind som inte grindar säger det aldrig

**Räkna facit mot antalet KÖRKONFIGURATIONER, inte mot antalet testfall. En
svit som kör i två vyporter men bara har facit för den ena är halv, och
luckan har ingen egen signal: den syns varken i PR-CI:s gröna rollup eller i
sviten som aldrig kördes. Frågan att ställa vid varje ny snapshot-svit är
"vilka konfigurationer kör detta, och finns facit för var och en?" — och
"vilken grind fäller om svaret är nej?"**

Instans (S108, 2026-08-24, `TASK-309.16`):
`tests/visual/__aria__/dokument-generering-promoverings-grind.spec.ts/` bar
**5 filer, samtliga `-desktop`**. Spec-filen har 5 `test(...)` och sviten kör
i två Playwright-projekt (`visual-desktop`, `visual-mobile`,
`playwright.config.ts` rad 691/701) — alltså 10 testfall mot 5 facit.
`npm run test:visual -- dokument-generering-promoverings-grind` gav **5
passed / 5 failed**, där varje fällning var `visual-mobile` med *"A snapshot
doesn't exist … writing actual"*. Ingenting hade fångat det: `#1889` var grön
i CI hela tiden (**12 SUCCESS + 3 SKIPPED**), eftersom visual-testerna bor i
`.github/workflows/visual-baselines.yml` vars ENDA trigger är
`workflow_dispatch` (rad 78, verifierat uttömmande) — sviten grindar
ingenting. Kontrollmätt mot de övriga: **11 av 12** promoverings-grindar bär
`-desktop` och `-mobile` i par; denna är den enda utan.

**Det generella:** en snapshot-svit har två oberoende täckningsaxlar —
scenarierna (testfallen) och konfigurationerna (vyporter, teman, lokaler,
browsrar). Facit-katalogen är kryssprodukten, och en saknad rad i den
produkten uppstår tyst eftersom verktyget bara skapar en fil när något
faktiskt kört. Att sviten dessutom är avfyrad manuellt gör luckan
oupptäckbar i normalflödet: den är inte en grind som fällde fel, utan en
grind som ingen bad om ett svar från. Skilj de två frågorna åt vid varje ny
svit — "täcker facitet allt sviten kör?" och "vad kör sviten automatiskt?" —
för en grön PR svarar på ingen av dem.
