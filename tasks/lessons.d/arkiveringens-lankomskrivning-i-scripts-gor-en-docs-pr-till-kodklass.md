# Arkiveringens länkomskrivning i `scripts/` gör en docs-PR till kod-klass — backstoppen fäller i kön

**`scripts/arkivera-sessionsdok.sh --utfor` skriver om varje referens till
det flyttade doket, även i kommentarer i `scripts/*.mjs`. `scripts/**` står
utanför D0-allowlisten, så en PR som i sak bara arkiverar sessionsdok
klassas som kod av CI, och `review-backstopp` fäller den i kön med
"[saknas]" — armeringen konsumeras och en granskning måste till för en
enda kommentarrad.** Mätt 2026-09-17 (S125, #2507, kökörning
`35224500498`): arkiveringen av S111/S113 rörde en sökväg i
`scripts/create-betalningsfalt.mjs`; PR:en var byggd och armerad som
D0 och föll först i kön. Regel: kör `git diff --name-only origin/main...HEAD`
mot D0-listan INNAN en docs-batch armeras — bär den en fil under
`scripts/**`, `src/**`, `supabase/**` eller `package*.json` är den kod-klass
och behöver utlåtande före armering, oavsett hur trivial ändringen är.
Alternativet (lämna kommentaren oomskriven) bryter mot arkiveringens
kontrakt om noll kvarvarande referenser; det rätta är granskning, inte
undantag.
