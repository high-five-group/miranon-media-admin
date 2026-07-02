# Issue-tracker: Lokal Markdown

Issues och PRD:er för detta repo finns som Markdown-filer i `.scratch/`.

## Konventioner

- En funktion per katalog: `.scratch/<feature-slug>/`.
- PRD:n är `.scratch/<feature-slug>/PRD.md`.
- Implementationsissues är `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numrerade från `01`.
- Triagestatus dokumenteras som raden `Status:` nära början av varje issue-fil; se `triage-labels.md` för rollsträngarna.
- Kommentarer och samtalshistorik läggs längst ned i filen under rubriken `## Comments`.

## När en skill säger ”publicera i issue-trackern”

Skapa en ny fil under `.scratch/<feature-slug>/` och skapa katalogen vid behov.

## När en skill säger ”hämta relevant ärende”

Läs filen vid den refererade sökvägen. Användaren skickar vanligen sökvägen eller issuenumret direkt.
