# En lista utan utskrivet inklusions-kriterium kan inte granskas för fullständighet

**En korrekt räkning bevisar bara att listan stämmer med sig själv. Vad som
BORDE stå där är en annan fråga, och den går inte att pröva mot en lista vars
inklusions-regel ingen skrivit ned. Kriteriet är det granskningsbara — posterna
är bara dess utfall.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-31, `TASK-106`):** `scripts/check-docs.sh` lovade i sin
egen första rad att köra *"ALLA dokumentations-grindar CI kör"* och räknade upp
tio. Räkningen var **sann** — tio poster, tio uppräknade, tio körda, och
slutraden sade tio. Ändå körde `ci.yml`:s lint-jobb två grindar som listan
saknade, och båda fäller på en ren `.md`-ändring: `check-fetch-depth-invariant.sh`
(erratum-not i ADR-029/030) och `check-listparitet.sh` (`CONTRIBUTING.md` via
paret `sentinel-markorer`). Mätt mot fixtur samma dag: struken erratum-rad ⇒
exit 1; struken sentinel-backtick ⇒ exit 1.

**Varför ingen granskning fångade det.** Filen hade en uppräkning *och* en
undantagslista (*"Biome, typecheck, audit, actionlint, yamllint, shellcheck,
testsviten — de är kod-grindar"*). Den såg fullständig ut åt båda hållen. Men
undantagslistan var en **naken uppräkning utan skäl per post**, och ingenstans
stod regeln som avgjorde vilken sida en grind hamnade på. En läsare som undrade
*"borde `check-listparitet.sh` stå här?"* hade inget att pröva frågan mot — bara
två listor att jämföra med sin egen magkänsla.

**Detta är en annan felklass än en felaktig räkning.**
[[en-rakning-utan-utskrivna-poster-granskas-aldrig]] handlar om ett aggregat som
motsägs av sina egna poster; där är felet synligt för den som räknar. Här stämde
allt som gick att räkna. Felet satt i **frånvaron av en post**, och en frånvaro
har ingen plats där den syns. Samma sak gäller åt andra hållet: räknings-lesson
fångar inte en lista som är intern-konsekvent och ändå ofullständig.

**Formen som fångar det:** skriv kriteriet före listan, och gör det operativt
nog att en läsare kan pröva en ny kandidat mot det utan att fråga någon. För
`check-docs.sh` blev det *"en CI-grind hör hit om en REN dokumentations-ändring
kan fälla den"* — kausalt, inte natur-baserat. Det kriteriet avgjorde direkt de
två tveksamma fallen: invariant-vakterna ingår (de fäller på `.md`-ändringar),
`check-staging-preflight-wiring.mjs` gör det inte (den läser
`playwright.config.ts` och `scripts/*.mjs`) — och det sista skälet står nu
utskrivet i stället för underförstått, eftersom den grinden kör i samma
alltid-på-jobb som de övriga och annars ser ut som en glömd post.

**Bikostnaden är att undantagen måste bära skäl per post.** En post utan skäl är
inte ett undantag utan en tystad avvikelse — samma krav som
`scripts/check-listparitet.sh` redan ställer på sina egna
`LISTPARITET_UNDANTAG`, och av samma anledning.

Besläktad: [[en-rakning-utan-utskrivna-poster-granskas-aldrig]] (talet som
motsägs av sina poster) ·
[[en-regel-som-pastas-mekaniserad-granskas-inte]] (påståendet som stoppar
granskningen) ·
[[valideringsverktyg-som-inte-kors-ar-franvarande]] (verktyget som finns men
inte avfyras)
