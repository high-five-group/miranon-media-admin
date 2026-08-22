# En grind som körs inuti ett skript är osynlig för hooken som vaktar grindanrop — pipe-maskeringen släpps igenom

**PreToolUse-hookar matchar KOMMANDOSTRÄNGEN, inte vad kommandot i sin tur
kör. Flyttas ett grindanrop in i ett skript ser hooken bara `bash skript.sh`
— och en pipe utanför skriptet maskerar då exitkoden utan att någon vakt
fäller. Skriptets eget `set -o pipefail` skyddar INTE mot en pipe som ligger
utanför det.** `[UNIVERSAL]`

Mätt i S111 (2026-08-22, `TASK-299`:s skivpublicering). L440-hooken hade
fällt två gånger tidigare samma session — den kände igen `audit-ci` och
`check-facit` i kommandosträngen och krävde bevarad exitkod, korrekt båda
gångerna. Sedan flyttades tre `task create`-anrop in i
`skivor-1-3.sh` och kördes som:

```bash
bash skivor-1-3.sh 2>&1 | grep -E "^Created task|^File:"
```

Hooken såg `bash` och `grep`, inga grindnamn, och släppte igenom. Pipen
returnerade **`grep`s** exitkod. Skriptet bar `set -euo pipefail`, men den
raden gäller pipes INUTI skriptet — den kan inte påverka en pipe som
omsluter hela anropet. Utfallet: **ett** av tre kort skapades, jobbet
rapporterade **exit 0**, och notifikationen sade "completed (exit code 0)".

**Fångsten var inte hooken utan en räkning:** utdatan bar en enda
`Created task`-rad där tre väntades. Utan den räkningen hade två skivor
saknats i grafen och beroendena i efterföljande kort pekat på ID:n som
aldrig fanns.

**Det generella:** en mekanisk vakt som matchar på ytform skyddar exakt så
långt som ytformen är synlig. Att bunta anrop i ett skript är ofta rätt —
men det flyttar samtidigt anropen ur vaktens synfält, och då är det
anroparens ansvar att bära exitkoden. Formen som fungerar: kör skriptet
naket (`bash skript.sh`), logga per-anrops exitkod inuti det, och verifiera
utfallet mot FAKTISKT TILLSTÅND på disk — aldrig mot jobbets samlade kod.

**Besläktat:** `L440` (grindens exitkod går förlorad i pipen) — denna post är
den varianten där vakten inte kan se att den borde fälla.

**Den andra halvan, mätt i samma session:** vakten fäller också på ett
grindnamn som råkar stå i kommandosträngen utan att vara ett grindanrop.
Ett `git commit -m "… markdownlint 0 issues." 2>&1 | tail -3` avvisades
som pipe-maskerad grind — pipen fanns, men den omslöt `git commit`, inte
en grind. Formen som fungerar är `git commit -F <fil>`.

**Det gemensamma:** en vakt som läser ytform har BÅDA felriktningarna —
den missar grinden som gömts i ett skript, och den fäller på namnet som
bara nämns. Ingen av dem är ett fel i vakten; de är dess pris. Kostnaden
bärs av anroparen: bär exitkoden själv där vakten inte ser, och flytta
prosan ur kommandosträngen där den ser för mycket.
