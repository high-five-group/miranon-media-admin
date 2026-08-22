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
| Listrubrikerna ("Innehåll, Dag Ett/Två") | `SegoeUI-Bold` | **Selawik Bold** | SIL OFL |

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

## Selawik Bold — SegoeUI-ersättaren (F7, S108 resume 5)

Förlagan sätter EXAKT två rubriker ("Innehåll, Dag Ett" / "Innehåll, Dag
Två") i `SegoeUI-Bold`, 9 pt — allt annat i dokumentet är Calibri (se
tabellen ovan). Segoe UI är Microsoft-proprietär och får INTE bäddas in,
samma regel som stoppade Cavolini ovan.

**Selawik är Microsofts EGEN öppna ersättare för Segoe UI.** Källa:
[`github.com/microsoft/Selawik`](https://github.com/microsoft/Selawik),
release **1.01** (`Selawik_Release.zip`), filen `selawkb.ttf` (Bold,
`weightClass=700`). Repots README säger ordagrant: *"Selawik is an open
source replacement for Segoe UI."* Kända brister enligt samma README:
Selawik saknar kerning och hinting mot Segoe UI — acceptabelt vid 9 pt på
två rubrikord.

**Licensen är mätt, samma metod som Cavolini-avsnittet ovan** (Python,
`struct`-parsning av `OS/2`-tabellen, ingen extern lib):

```text
Selawik-Bold.ttf: OS/2 version=4 weightClass=700 fsType=0x0000 (0)
```

`0x0000` = **Installable Embedding** — det MEST tillåtande värdet som
finns (inga restriktioner alls på inbäddning eller vidaredistribution av
det inbäddade typsnittet). `LICENSE.txt` i releasen bekräftar samma sak
på licensnivå — första raden:

```text
Copyright 2015, Microsoft Corporation (www.microsoft.com), with Reserved
Font Name Selawik. All Rights Reserved. Selawik is a trademark of
Microsoft Corporation in the United States and/or other countries.

This Font Software is licensed under the SIL Open Font License, Version 1.1.
```

Ingen separat `LICENSE.txt` läggs i den här katalogen — Carlito och Comic
Neue Bold ovan dokumenteras uteslutande här i LÄSMIG.md (licens-kolumnen),
ingen av dem har en bredvidliggande licensfil. Selawik följer samma
konvention, inte ett undantag.

## Om någon vill byta tillbaka

Byte av rubrikfont påverkar bara rubrikraden. Byte av brödtextfont påverkar
radbrytningar i hela dokumentet — mät mot förlagan innan, inte efter.
