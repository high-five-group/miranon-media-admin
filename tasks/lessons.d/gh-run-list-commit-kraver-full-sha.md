# `gh run list --commit` matchar inte förkortade SHA:n — den ger tom lista utan felkod

**En förkortad SHA till `gh run list --commit` returnerar `[]` med exit 0. Inget
fel, ingen varning. Varje vakt som pollar på det svaret läser tomheten som
"körningen har inte startat än" och pollar hela sin budget innan den rapporterar
timeout — alltså ett CI-problem som inte finns.** `[UNIVERSAL]`

**Empiri (S91, 2026-07-27):** en orkestrerad CI-vakt startades med
`--commit d52d6c8` mot en PR vars körning bevisligen fanns och var `in_progress`
(`gh run list --branch` visade den, `gh pr checks` visade sju gröna jobb). Vakten
rapporterade ändå `ingen körning ännu för commit=d52d6c8` i cykel efter cykel.
Skillnaden mättes direkt:

```text
gh run list --commit d52d6c8                                   → []
gh run list --commit d52d6c8b30b76f229e407057e9aff16677faeac2  → [{...}, {...}]
```

**Varför det är värre än ett vanligt argumentfel:** felet uppträder som ett
tillstånd i det system man övervakar, inte som ett fel i anropet. Läsaren
skickas att felsöka CI, GitHub eller workflow-triggern — allt utom den plats
felet faktiskt sitter. Ett mätinstrument som tystnar vid felanvändning är värre
än inget instrument alls; se
[[live-jsonl-ar-ogonblicksbild]] för samma klass av tyst felläsning.

**En gren i samma skript var immun och visade vägen:** `--pr`-läget slår upp
`headRefOid`, som alltid är full SHA. Bara `--commit`-läget bar fällan, eftersom
det skickar sitt värde rakt vidare. Att en syskon-kodväg är immun är en signal
om att den osäkra vägen saknar en validering, inte att den är korrekt.

**Motmedlet, mekaniserat:** `scripts/ci-wait.sh` avvisar sedan 2026-07-27 allt
som inte är 40 hexadecimala tecken på `--commit`, med exit 3 (användningsfel)
och en text som pekar på `git rev-parse HEAD` respektive `--pr`. Skillnaden
mellan exit 2 (timeout) och exit 3 är hela poängen: 2 skickar läsaren till CI,
3 till anropet.

**Valideringen bevisade sig i samma andetag den skrevs.** Den fällde omedelbart
`T8` och `T9` i skriptets egen självtest-svit, som båda anropade
`--commit deadbeef`. De hade fungerat enbart därför att ingen validering fanns —
stubben brydde sig inte om värdet. En härdning som fångar två befintliga
anropare direkt är belagd, inte förhoppad.

**Sidofynd i samma pass:** svitens filhuvud påstod "15 testfall" medan den körde
17 redan före ändringen. En räkning i prosa som ingen kontrollerar driftar; den
är nu 19 och stämmer mot `grep -c '^run_case'` minus funktionsdefinitionen.
