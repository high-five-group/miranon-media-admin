# Fragment — ett okänt CLI-flagga som --help faller igenom till skarp körning i stället för att visa hjälp

**Fångad:** 2026-08-02, Session 93, seed-eventet `ZZ-GRANSKNING-FIXTUR`.

**Vad som hände:** ett `--help`-försök mot `npm run seed:review` kördes
SKARPT i stället för att visa användning. Grundorsaken är verifierad i
källkoden: `scripts/seed-review-fixture.mjs`s `parseArgs()` (rad 566–664) är
en `switch`-sats över kända flaggor (`--ort`, `--bekraftade`,
`--obekraftade`, `--dagar`, `--livstid`, `--legacy`, `--clean`, `--dry-run`,
`--sweep`, `--ingen-svep`, `--bekrafta`) med `default: break` (rad 638–639)
— ett okänt argument som `--help` matchar ingen `case`, ger inget fel och
ingen hjälptext, utan faller tyst igenom till samtliga default-värden
(`config.defaults`). Eftersom default-summan av `bekraftade`+`obekraftade`
inte är 0, passerar körningen även guard-kontrollen på rad 655–657
(`--bekraftade + --obekraftade är 0 — inget att skapa`), och skriptet
skapar ett RIKTIGT event i staging: `ZZ-GRANSKNING-FIXTUR`
(`reco44UBx6GXcxwu5`, Event-3905), 16 anmälningar, betalningsspridning,
livstid till 2026-08-16.

**Vad som INTE gick fel:** samtliga skyddsräcken (bas-guard mot prod,
purge-policy-korsläsningen) höll — ingen data hamnade fel plats och ingen
permanent skada skedde. Kostnaden var att ett försök att LÄSA om skriptet i
stället skapade skarp data av misstag.

**Lärdomen:** ett CLI-skript vars argumentparser tyst ignorerar okända
flaggor (i stället för att fela på dem, eller explicit hantera `--help`/
`-h`) gör att ett försök att LÄRA SIG verktyget kan trigga en skarp körning
med default-parametrar. Ett skript som skapar data — särskilt mot en delad
miljö som staging — bör antingen (a) explicit hantera `--help`/`-h` med en
usage-text, eller (b) fela på ett okänt argument i stället för att falla
igenom till default. `default: break` är ett tyst ja-till-körning i
praktiken, aldrig en avsiktlig no-op.

**Varför INTE `[UNIVERSAL]`:** den observerade instansen är en egenskap hos
DETTA repos seed-skript (`n=1`, ett enda skript, en enda observerad
instans) — inte ett mönster som visats upprepas över flera verktyg eller
repon, till skillnad från syskonfragmenten i denna skörd som antingen har
flera instanser inom samma session eller en princip som uppenbart
generaliserar oberoende av kodbas. Registreras som skript-hygien-kandidat,
lokal till detta repo tills fler instanser (i detta eller andra skript)
visar motsatsen.

**Källa:** `tasks/sessions/2026-08-02-session-93.md` Del 2 § "Bokfört i
övrigt" (rad ~126–129) + PAUSLÄGE-blockets CARRY-lista, kandidat (5).
