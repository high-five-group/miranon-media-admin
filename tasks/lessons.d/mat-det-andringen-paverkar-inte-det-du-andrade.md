# Mät det ändringen påverkar, inte bara det du ändrade

**En mätning riktad mot ändringens egen yta missar vad ändringen gjorde med
grannarna. Text som växer trycker ihop det som delar dess rad.** `[UNIVERSAL]`

Mätt 2026-08-06 (S93, iterationsvåg 3). Passet mätte knappgeometri noggrant —
höjd, bredd, `border-radius`, bakgrundsfärg, i vila och hover, före och efter —
och rapporterade allt med tal. Varje knapp var 32 px och 4 px radie som avsett.

Samtidigt förlängdes registrets fot från `"Visar 14 av 14 i registret"` till
`"Visar 14 av 14 i registret — 2 av dem är avbokade"`. Foten är en
`flex justify-between` med tre element: texten, "Rensa filter" och "Skriv ut".

Marcus skärmavbild visade resultatet: texten bröt till två rader, **och båda
knapparna bröt inuti sig själva** — "Rensa / filter", "Skriv / ut". Mätningen
hade tittat rakt på de knapparna och sett 32 px höjd, i ett läge där "Rensa
filter" inte var renderad (inget filter aktivt).

**Två fel i samma mätning.** (1) Den mätte objekt, inte layout — geometri per
element säger ingenting om hur de får plats tillsammans. (2) Den mätte ett
tillstånd, inte alla — knappen som bröt visas bara när filter är aktiva, och
mätskriptet körde med tomt filter.

**Praktiskt:** när en ändring rör text i en delad rad, mät radens totala
utrymmesbehov mot dess faktiska bredd, och kör mätningen i det tillstånd där
FLEST element är synliga. Ett `flex`-barn utan `whitespace-nowrap` bryter inuti
sig självt långt innan raden wrappar — det är sällan vad som avses.

Samma disciplin som fällde breddlåset i iterationsvåg 1 (teckenantal är fel proxy
för renderad bredd), men en nivå upp: där mättes fel STORHET, här mättes rätt
storhet på fel OMFÅNG.

Besläktad: [[en-rekommendation-kraver-hela-ytan-inte-bara-filen-du-oppnade]] —
båda är samma grundfel, att avgränsa observationen till det man själv rörde.
