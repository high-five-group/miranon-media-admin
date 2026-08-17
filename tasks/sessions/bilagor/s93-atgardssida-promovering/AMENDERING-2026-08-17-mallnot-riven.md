# Amendering 2026-08-17 — Åtgärdssidans mall-not riven (TASK-273.3)

> Denna sidofil finns för att `facit.json` är AGENT-FRUSEN: `godkand`-fältet
> är satt (`marcus`, 2026-08-11, `efc4091a…`), och ADR-104-hookens mönster
> (se `tasks/sessions/archive/bilagor/s55-hem-konvergens/AMENDERING-2026-08-15-verbcopy.md`
> för precedentet) nekar agent-skrivningar mot ett fruset manifest.
> Inbakningen i manifestets `not`-fält är ett MARCUS-moment; tills den gjorts
> är DENNA fil amenderingens durabla bärare, refererad från TASK-273.3.

**Yta:** `atgarder-mottagarurval` (hub-läget, `src/components/events/atgarder/AtgardsSida.tsx`,
`export function AtgardsSida`s slutgiltiga `return`, rad ~2795–2951). De två
andra facit-ytorna är **overkerörda**: `atgarder-tomt-lage` är en tidigare
`return` (eventId == null, rad ~2745) och `atgarder-granskning` renderas av
den fristående `GranskningsSida`-komponenten (egen `return`, rad ~2776) —
`PrototypNot` monterades bara i hub-returnens `<>…</>`-fragment (rad 2948,
nu riven) och nåddes aldrig från de andra två grenarna.

**Avvikelse (Marcus medvetna UI-beslut, verifierat 2026-08-17, S107-utredningen):**
`PrototypNot`-komponenten ("Mallar. Ämnesrad och brödtext är hårdkodade
stubbar…"), dess anropsplats (`<PrototypNot />`) och docblocket ovanför
funktionen är rivna i sin helhet. Sakpåståendet i noten var verifierat SANT
(fasta standardmallar, Ändra-knappen redigerar bara det enskilda utskicket)
— rivningen är alltså inget rättelse-beslut utan ett medvetet UI-val: Lotta
ska inte längre se den tekniska metatexten om mallar på åtgärdssidan.

**Empiriskt bevis att facit-låsen är opåverkade** (körning 2026-08-17, efter
rivningen): samtliga 40 tester i
`tests/visual/atgardssida-promoverings-grind.spec.ts` (ariaSnapshot-referenser
+ axe-pass + kvalitetsribbans tre lägen, visual-desktop + visual-mobile) är
GRÖNA utan omtagning — ingen av de ariaSnapshot-referenser specen bär
scopar till hub-lägets FULLA yta (de scopar till `atgardssida-tomt`,
`mottagar-kort`, `granskning-yta`), så noden `PrototypNot` renderade låg
utanför samtliga facit-lås redan innan rivningen (verifierat genom läsning
av specfilen, inte antaget).

Formen i övrigt orörd — identisk med den körande, promoverade formen i alla
lägen utom notens frånvaro (ADR-102 B5-kravet).
