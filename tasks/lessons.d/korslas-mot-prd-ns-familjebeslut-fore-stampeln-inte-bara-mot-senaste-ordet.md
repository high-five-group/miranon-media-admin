# Korsläs mot PRD:ns familjebeslut före stämpeln — inte bara mot användarens senaste ord

**[UNIVERSAL] En konvergens-stämpel prövar det som visas i ögonblicket mot det
som sades i ögonblicket. Ett FAMILJEBESLUT — "alla ytor av typ X bär Y" — sades
tidigare, gäller fortfarande, och syns inte i den yta som granskas just nu.
Stämpla aldrig utan att korsläsa mot PRD:ns/speccens familjebeslut; annars
fryser du ett undantag som ingen beslutat om, och varje senare yta ärver det
som facit.**

Instans (S111, 2026-08-22 → 23, `718e586f`): PRD `TASK-299` beslutade
**2026-08-22** (beslut 2–3+5) att husets delade `SidRam`-primitiv bärs av
ALLA Mer-sidor, anmälningssidan inräknad, och
`DESIGN-SYSTEM-SPEC.md` § 23 listade ytan uttryckligen som *"tillkommer när
TASK-299.5 landar"*. Promoveringsskivan `TASK-299.5` behöll ändå av misstag
prototypens gamla textlänk (`← Tillbaka till Mer`). Facit-bilderna togs samma
dag och **ärvde missen**; manifestet stämplades på dem.

Fångsten kom från Marcus i QA på förhandsgranskningsbygget, verbatim:
*"Ser bra ut. Men varför har inte anmälningssidan bakåtchevronen?"* — alltså
efter stämpeln, av en människa, på en yta som redan var låst. Rättelsen krävde
en omtagning av sju facit-bilder plus en amenderings-sidofil, eftersom
`facit.json` är agent-fryst så snart `godkand` är satt (ADR-104-hooken).

**Varför "Ser bra ut" inte var en granskning av just detta:** Marcus godkände
formen han såg. Familjebeslutet handlade om något han INTE såg — frånvaron av
ett element. Ett godkännande kan bekräfta det som finns; det kan aldrig av sig
självt upptäcka det som saknas.

## Regeln

1. **Vid varje konvergens-stämpel: läs PRD:ns/speccens beslutslista, inte bara
   den senaste kvittensen.** Familjebeslut ("alla X bär Y", "ingen X får Z")
   är per konstruktion osynliga i en enskild yta.
2. **Korsläs mot systerytorna som redan bär formen.** Här bar väntelistan,
   dokumentytan och aktivitetshistoriken redan sidramen — en jämförelse mellan
   fyra ytor hade avslöjat den femte på sekunder.
3. **En promoverings-skiva är inte en kopiering.** Den ska bära PRD:ns form,
   inte prototypens rester. Det prototypen råkar ha kvar är inte ett beslut.

## Den generella formen

**Ett beslut som gäller en KLASS av ytor har ingen bärare i någon enskild
yta.** Det är därför det driver: varje enskild granskning är lokal och
korrekt, och klassen faller ändå isär. Ytor granskas en i taget; klassbeslut
måste därför granskas som klass — en lista, en korsläsning, en räkning av hur
många ytor som faktiskt bär formen — och det arbetet hör hemma FÖRE stämpeln,
eftersom kostnaden att ångra en frusen artefakt är flerfaldigt högre än att
läsa en beslutslista.
