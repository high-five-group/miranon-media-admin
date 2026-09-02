# En opak hover-platta blir osynlig på tintad bakgrund, mät kontrast och fixa som skrim på tokennivå

**[UNIVERSAL] En hover-effekt byggd som en opak platta i en fast färg kan
visa fullgod kontrast mot en neutral bakgrund och samtidigt vara praktiskt
taget osynlig mot en tintad/färgad variant av samma yta, eftersom
kontrastförhållandet mellan plattan och den tintade bakgrunden kan hamna
nära 1:1. Att verifiera hover-kontrast bara mot standardbakgrunden missar
felet helt.** Mätt 2026-09-01 (S113 Del 14,
`tasks/sessions/2026-08-29-session-113.md` rad 1543 till 1544): en
ghost-hover mättes till kontrastförhållande 1,013:1 mot en tintad bakgrund,
i praktiken osynlig. Fixen gjordes på TOKENNIVÅ, opak platta byttes mot ett
skrim (halvtransparent nedtoning), klassad som en systemfelklass snarare
än en enstaka komponentbugg. Regel: verifiera hover-/fokus-overlägg mot
VARJE bakgrundsvariant en komponent faktiskt kan renderas på, inte bara
standardläget, och föredra en skrim-baserad overlay framför en opak platta
i fast färg när komponenten kan sitta på flera bakgrunder.
