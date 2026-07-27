# Staplade blockquotes separeras med en `>`-rad, aldrig med en tom rad

**Två blockquote-block åtskilda av en HELT tom rad fäller `markdownlint` MD028.
Husets form är en `>`-rad emellan — alltså ett block med flera stycken, inte två
block.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-27):** ADR-063 skulle få en andra additiv not bredvid den
befintliga S81-noten. Den skrevs som ett eget blockquote-block med en tom rad
emellan, och `check:docs` föll:

```text
ADR-063-airtable-bas-som-forstklassig-leverabel.md:17
error MD028/no-blanks-blockquote Blank line inside blockquote
```

Markdown ser inte två block där skribenten ser två block — den ser **ett** block
med en tom rad inuti, vilket är tvetydigt nog för att regeln ska fälla.

**Husets form fanns redan och var lätt att verifiera:** ADR-073 bär tre
amenderingar staplade i EN blockquote, separerade med rader som innehåller
enbart `>`. En blick i den filen hade räckt.

**Förhistorien är själva poängen.** Denna lärdom stod i S91:s fjärde
PAUSLÄGE som stikkordet *"husets `>`-separerade blockquote-stapling"* — utan
empiri, utan motmedel. Vid skörden gick den inte att belägga: sessionsdokets
Del-text, fem commit-meddelanden och configdiffarna genomsöktes utan träff, och
den lämnades hängande som öppen post. **Den återuppstod två timmar senare genom
att exakt samma fel gjordes igen** — nu med logg, radnummer och regel-ID.

Det är den skarpaste möjliga bekräftelsen på
[[lesson-kandidat-som-stikkord-overlever-inte-pausen]]: en kandidat utan empiri
är inte en sparad lärdom, den är en anteckning om att man en gång visste något.
Kostnaden blev att felet fick begås en andra gång för att kunna skrivas ned.

**Motmedlet:** när ett dokument ska få ytterligare en not-, amenderings- eller
varningsruta — läs hur den befintliga är avgränsad innan den nya skrivs. Formen
är redan bestämd i filen du håller på att ändra.
