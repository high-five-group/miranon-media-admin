# Barn-manifest — tråd→kort/tråd, ASYMMETRISK (ADR-095 beslut 4)

> **`barn` deklareras i EN riktning.** En tråd som har egna backlog-kort
> och/eller barn-trådar pekar på dem HÄR. "Vem är förälder till X" härleds
> mekaniskt av den som frågar (grep i den här filen) — det finns ingen
> spegelpost i barnets egen rad eller kort, och ingen ska någonsin skrivas
> för hand. Det är den avgörande skillnaden mot `besläktad`
> (`tasks/threads/README.md`), som är SYMMETRISK och deklareras en gång per
> PAR ([ADR-095](../../docs/decisions/ADR-095-relationsmodellen-dokumentationssubstratet.md)
> beslut 2).

## Så här läser du manifestet

- **Additivt och glest.** Bara trådar med FAKTISKA barn får en post — de
  allra flesta trådarna i registret har ingen rad här, och det är det
  korrekta startläget, inte en lucka.
- **Tråd** — förälderns tråd-ID, samma `T<NN>`-form som
  `tasks/threads/README.md`.
- **Barn** — en eller flera backtick-citerade ID:n, kommaseparerade. Varje
  ID är antingen ett tråd-ID (`T<NN>`, en barn-TRÅD) eller ett backlog-
  kort-ID (`TASK-<N>`, ett kort som är produkten av trådens arbete).
- **Ingen migrering är gjord här.** De befintliga barn-formerna i registret
  (formell to-issues-hierarki, lös radprosa, tvärsnittsproduktion spridd
  över andra trådars PRD-träd) är INTE flyttade in i den här tabellen. Vad
  som räknas som barn i tveksamma fall (t.ex. `T86`:s 15+ nämnda kort) är en
  öppen, medveten fråga — Marcus beslut, inte mekaniskt härledd (ADR-095
  § Avgränsningar).

**Grindad av `scripts/check-thread-index.sh`.** Varje `Tråd`-cell måste peka
på ett tråd-ID som finns i `tasks/threads/README.md`; varje ID i en
`Barn`-cell måste vara antingen ett existerande tråd-ID eller ett
existerande backlog-kort (en fil under `backlog/tasks/`). Manifestet får
SAKNAS helt — grinden läser frånvaro som "inga barn deklarerade ännu", inte
som fel.

| Tråd | Barn |
|---|---|
