# ARKIVERAD — pensionerad, delvis superseded av s108-generering + s108-dokumentytan

Detta facit (S102, `TASK-147.6`, stämplat av Marcus 2026-08-16 med citatet
"godkänner", sha `cc1d7c53`) beskrev Dokument-ytan `/mer/dokument` — den
filtrerbara listan plus **Visa-overlayens tre klasser** (bilaga, mall, kvitto).
Nya dokument-facit: `tasks/sessions/bilagor/s108-generering/facit.json` och
`tasks/sessions/bilagor/s108-dokumentytan/facit.json` (`TASK-309.10`, PR #1961,
2026-08-24).

Katalogen flyttades hit ur `tasks/sessions/bilagor/` på Marcus mandat
(*"Du har mandat att ta besluten. Men var noggrann och chansa inte, ta inget
för givet. Var proffsig och gör saker ordentligt."*, 2026-08-26, S108 resume 11
— orkestrerarens beslut i samma anteckning: `309.21` **pensionera**
s102-manifestet). Formen är den etablerade: arkivflytt, aldrig radering
([[L610]], prejudikat
`s55-hem-konvergens` → `s102-hem-konvergens`, `TASK-243.1`, PR #1426). Arkivet
ligger utanför facit-grindens svep (`FACIT_BILAGE_ROT` i `.facit-policy.conf`).
Innehållet är **FRUSET**: manifestet, de fem bilderna och de tre
AMENDERING-filerna bevaras exakt som de löd — `godkand`-fältet är aldrig rört
av någon agent, och historiken skrivs inte om. Utfört i `TASK-309.29`.

## Varför pensionering och inte omstämpling

Manifestets kärnbeskrivna funktion existerar inte längre i koden. Den
dialog-baserade Visa-knappen (`<iframe>`/`<img>`-inbäddad förhandsvisning,
`TASK-245`/`TASK-246`) revs av `TASK-273.4` (commit `b881fe64`, 2026-08-17) och
ersattes av ikonknappar per rad — se `src/components/dokument/DokumentYta.tsx`,
docblockets `[ERSATT, TASK-273.4]`-stycke. Tre av manifestets fem bilder
(`facit-dokument-visa-{bilaga,mall,kvitto}-desktop.png`) avbildar alltså en
yta som inte går att klicka fram i appen.

`--ersatt` hade inte lagat det. Flaggan skriver **bara** om `godkand`-blocket
(`scripts/facit-godkann.mjs` § `tillampaGodkannande`) — aldrig `bilder`,
`kallor` eller `not`. En omstämpling hade producerat ett färskt-daterat kvitto
för en riven funktion, vilket är sämre än att lämna manifestet stämplat med
sina öppna amenderingar. Fullt underlag, källmärkt:
[`docs/research/facit-pensionering-s102-2026-08-26.md`](../../../../../docs/research/facit-pensionering-s102-2026-08-26.md)
§ 1 och § 5.

## GAPET — täckningen är INTE fullständig

Efterträdarna täcker manifestet **delvis, inte helt**. Ingen av de tre
manifesten (`s102-dokument-konvergens`, `s108-generering`, `s108-dokumentytan`)
visar **ett valt events fullt filtrerbara dokumentlista, med alla filterlägen,
där en befintlig bilaga/mall/kvitto öppnas eller förhandsvisas med dagens
ikonpar-beteende**:

- `s108-dokumentytan` visar samma ikonpar men i **räckviddsläget** ("Delade
  dokument", inget event valt) plus eventväljaren öppen — inte i ett valt
  events kontext med alla tre dokumentklasser blandade.
- `s108-generering` visar en **annan vy** (genereringsflödet, `?vy=generering`)
  där mallraderna är entry points för att skapa nya dokument — inte en
  befintlig bilagas Visa-beteende.

Gapet är inte upptäckt här utan redan bokfört av skiva 9-agenten själv, i
`s108-dokumentytan/facit.json`s eget `not`-fält: *"SUPERSEDERAR INTE
s102-dokument-konvergens, MEN DIVERGERAR MÄTBART FRÅN DEN... Att avgöra vad som
ska hända med s102:s bilder (amendering, omstämpling, eller inget) är Marcus,
inte en agents."*

**Uppföljning:** `TASK-309.32` — facit-fångst av ett valt events fulla
dokumentlista med dagens ikonpar-Visa. Ingen agent och ingen grind fångar
gapet automatiskt; kortet är den enda bäraren.

**Efterträdarna är ännu OGODKÄNDA.** Mätt 2026-08-28 vid arkivflytten bär både
`s108-generering/facit.json` och `s108-dokumentytan/facit.json` `"godkand":
null` — Marcus stämpling (`!`-kanalen, `ADR-104` beslut 2) är inte utförd. Det
betyder att dokument-ytan just nu saknar **varje** stämplat facit: det gamla är
pensionerat här, det nya är inte godkänt än. Kommandoformen för stämplingen
står i utredningens § 6, steg 1–2.

## De tre AMENDERING-filerna

Samtliga tre flyttade MED katalogen och är orörda — de är en del av det frusna
historiska facitet, precis som `AMENDERING-2026-08-15-verbcopy.md` i
`s55-hem-konvergens`. Alla tre bar klassning **(c)** (formen ändrades,
prod-synligt) och avslutades med "Väntar på Marcus omstämpling". Den väntan är
**avslutad genom pensionering, inte genom omstämpling** — manifestet lever inte
vidare, så ingen av de tre kräver längre ett separat stämplings-beslut:

| Fil | Avvikelse | Utfall |
|---|---|---|
| `AMENDERING-2026-08-17-visa-till-ikonpar.md` | Visa-dialogen → ikonpar + ny flik (`TASK-273.4`) | Arkiverad frusen; avvikelsen är själva skälet till pensioneringen |
| `AMENDERING-2026-08-17-rackviddsval-gemensamt-lage-badges.md` | Räckviddsval, gemensamt läge, badges (`TASK-275.3`, `ADR-118`) | Arkiverad frusen; formen täckt framåt av `s108-dokumentytan`s räckviddsläge |
| `AMENDERING-2026-08-23-sidram-promovering.md` | Inline sidkrom → husets `SidRam`-primitiv (`TASK-299.11`) | Arkiverad frusen; `s108-dokumentytan`s bilder (tagna 2026-08-24) visar redan den nya sidramen |

De två **andra** öppna sidram-amenderingarna —
`tasks/sessions/bilagor/s106-aktivitetslogg/AMENDERING-2026-08-23-sidram-promovering.md`
och
`tasks/sessions/bilagor/s111-anmalningssidan-konvergens/AMENDERING-2026-08-23-sidram.md`
— är **helt oberoende** av s102-beslutet och väntar fortfarande på Marcus
`--ersatt`-omstämpling av sina egna manifest (utredningens § 3 och § 6, steg
4–5). De rörs inte av denna arkivflytt.
