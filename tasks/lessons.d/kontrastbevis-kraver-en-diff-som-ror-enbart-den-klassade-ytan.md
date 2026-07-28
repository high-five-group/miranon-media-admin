# Ett kontrastbevis kräver en diff som rör ENBART den klassade ytan

**En ändring av klassningslogiken kan aldrig vara sitt eget kontrastbevis:
själva ändringen faller ur klassen den inför. Beviset måste tas av en
efterföljande diff som rör enbart den nya ytan — och den diffen får inte bära
en enda fil till.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-28, `TASK-71`):** skivan gjorde `.claude/**` docs-klassad
i `ci.yml` och täckt av de tre docs-grindarna. Två av kortets sju
acceptanskriterier krävde ett run-ID där en PR som rör **enbart** `.claude/`
klassas som docs — och de kunde strukturellt inte tas av kortets egen PR, som
ändrar `ci.yml` och därmed per definition faller ur klassningen
(`!.github/workflows/**`).

Bygg-agenten identifierade det själv och **bockade dem inte**, utan skrev i
rapporten att de var utestående och varför. Beviset togs efteråt av en separat
PR som bytte namn på en agentfil och inget annat:

| Check | Utfall |
|---|---|
| `Test suite` | **skipped** |
| `Docs link check` | **success** |

**Den PR:n fick därför inte bära namnbytets fyra referenser** (`CONTRIBUTING.md`,
`tasks/todo.md`, två skript). En enda fil utanför `.claude/` hade upphävt beviset
— referenserna landade i en egen PR direkt efter.

**Mönstret generaliserar:** varje allowlist-, klassnings- eller dedup-ändring har
samma egenskap. Planera in beviset som ett eget, senare steg redan när skivan
speccas, annars upptäcks omöjligheten först när kortet ska stängas — och
frestelsen blir då att bocka kriteriet på ett svagare underlag.

Besläktad: [[frånvaro-av-bevis-är-inte-bevis]]
