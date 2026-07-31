# Två luckor i samma register kan ha motsatta rätta svar

**Att två poster saknas i samma lista gör dem inte till samma klass av fel.
Klassa efter vad resursen ÄR — inte efter var luckan syns. Den ena kan behöva
läggas till i listan, den andra behöva hållas utanför den för alltid, och
skillnaden syns aldrig på raden där båda är frånvarande.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-27 → 2026-07-31):** restlistans verifieringspass bokförde
två poster tillsammans — *"`ZZ-GRANSKNING-S91` och `app-segment-test` saknas båda
i purge-policyn (0 förekomster vardera)"*. Observationen var korrekt: båda
saknades, mätt.

Slutsatsen var det inte. De hade **motsatta** rätta svar:

- `app-segment-test` är sentinel-rader ett test lämnat efter sig — skräp i samma
  sekund de skapats. De SKA städas av purgen, och fick sin target i `TASK-87`.
- `ZZ-GRANSKNING-*` är granskningsdata en människa **tittar på i en webbläsare**.
  En target hade raderat den mitt under granskningen — setup-purgen kör före
  varje staging-jobb och ålders-guarden är 60 minuter, medan en granskning pågår
  i dagar. Frånvaron i policyn var ett medvetet skyddsräcke, inte en lucka.

**Varför felslutet var lätt att göra:** registret grupperade efter *symptomet*
(saknas i policyfilen), och fyra targets bredvid bevisade att symptomet brukar
betyda just "lägg till en target". Det som skiljer fallen — vem som använder
datan — står inte i policyfilen och syns inte där felslutet dras.

**Varför det var dyrt trots att ingen agerade på det:** felslutet stod i ett
styrande register, alltså exakt den sortens fil nästa läsare litar på. Och
"fixen" hade varit självkaskaderande: skriptet som skapar fixturen korsläser
markörerna mot den skarpa policyn och hade vägrat skapa något alls, varpå nästa
naturliga åtgärd är att försvaga det räcket. En rad river två.

**Formen:** när flera poster buntas som "samma lucka" — skriv ut vad var och en
av resurserna är och vem som använder den, innan du skriver vad som ska göras.
Håller klassningen bara på frånvaron är den inte en klassning, utan en
sammanträffande observation. Och när ett skyddsräcke består i att något
**medvetet inte finns**, bär frånvaron ingen motivering i sig själv: den måste
skrivas där någon som vill fylla luckan faktiskt läser.

Beslutet som kom ur detta: `ADR-084`.
