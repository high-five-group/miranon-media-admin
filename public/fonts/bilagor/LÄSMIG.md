# Fonter för bilage-mallarna

Dessa fonter finns här för att `ADR-119`s HTML/CSS-renderade bilagor ska kunna
sätta text som ser ut som Roger & Lottas nuvarande dokument, **utan** att kräva
Microsoft-fonter som varken vi eller renderaren har rätt att bädda in.

## Vad förlagorna faktiskt använder (mätt med `pdffonts`, 2026-08-19)

| Roll i dokumentet | Font i förlagan | Vår ersättare | Licens |
|---|---|---|---|
| Rubrik | `Cavolini-Bold` | **Comic Neue Bold** | SIL OFL |
| Brödtext | `Calibri` | **Carlito Regular** | SIL OFL |
| Fetade ord | `Calibri-Bold` | **Carlito Bold** | SIL OFL |
| Innehållslistans meditationer | `Calibri-BoldItalic` | **Carlito BoldItalic** | SIL OFL |
| Enstaka rubrik | `SegoeUI-Bold` | Carlito Bold *(ingen egen fil)* | — |

## Varför just dessa

**Carlito är metrikkompatibel med Calibri.** Samma teckenbredder och samma
radhöjder, tecken för tecken — den är byggd som en drop-in-ersättare och
används av LibreOffice för exakt detta. Radbrytningar hamnar därför på samma
ställen som i förlagan.

**Comic Neue är INTE metrikkompatibel med Cavolini** — någon sådan ersättare
finns inte. Den valdes på KARAKTÄR efter visuell jämförelse mot rubriken
renderad ur `bekräftelsebilaga-exempel.pdf`: rundade, informella
bokstavsformer med handskriven grund. Kandidater som prövades och förkastades:
Baloo 2 (rätt tyngd, men geometrisk och upprätt — saknar handskriftskänslan),
Quicksand (för lätt och geometrisk), Fredoka (samma invändning som Baloo),
Caveat (äkta skrivstil — mycket mer kursiv än Cavolini).

**Comic Neue är något ljusare än Cavolini.** Det är den kvarvarande
avvikelsen, och den är medveten.

## Cavolini kunde inte användas

Fonten är INTE installerad på maskinen — den finns bara som Office
molnfont-förhandsvisningar i `~/Library/Containers/com.microsoft.*/`. Den ÄR
inbäddad i förlagornas PDF:er, men **subsatt** (`pdffonts` visar `sub: yes`),
alltså med enbart de tecken de dokumenten råkade använda. Otillräckligt för
godtyckliga kursnamn. Licensbiten (`fsType`) kunde därför aldrig mätas, och
frågan lämnas obesvarad snarare än gissad.

## Om någon vill byta tillbaka

Byte av rubrikfont påverkar bara rubrikraden. Byte av brödtextfont påverkar
radbrytningar i hela dokumentet — mät mot förlagan innan, inte efter.
