# ADR-127: Backlog-stängningsformerna — härledd DoD-rad och avstådda krav ersätter det obockningsbara

- **Status:** Accepted (Marcus GO 2026-08-24 för väg iii, `TASK-281` §
  Options-rymden vägd; ADR-baren prövad av orkestreraren vid mintningen — se
  § Kontext)
- **Datum:** 2026-08-24
- **Rör:** `scripts/check-backlog-closure.sh` § STÄNGNINGSFORMERNA (mekanikens
  hemvist) · `.backlog-closure-policy.conf` (de fyra nya variablerna) ·
  `scripts/test-check-backlog-closure.sh` (testsviten) ·
  `backlog/config.yml` (DoD-mallens rad + `intentionally-unchecked`-etiketten)
  · `.github/workflows/nightly.yml` (jobbet `backlog-closure`, `fetch-depth: 1`)
  · `plugins/marcus-system/skills/do-work/SKILL.md` (hub-repot, steg 5b,
  Final Summary-mallen) · `TASK-281` (detta beslut) · `TASK-319` (öppen gräns,
  se § Konsekvenser)
- **Relation till tidigare beslut:** bygger på
  [`ADR-073`](ADR-073-parallella-batch-pipelines.md) beslut 5 (den
  tvåstegs-stängning — leverans-commit + stängnings-commit efter
  CI-verifiering — som skapar det tidsfönster där DoD-raden aldrig kan bockas
  av den som gjorde arbetet) och [`ADR-117`](ADR-117-backlog-grindens-faktainsamling-bulk-och-korsvalidering.md)
  (samma grind, fakta-insamlingens bulk-form som denna ADR:s härledning läser
  ur). Tillämpar [`ADR-083`](ADR-083-prosa-som-pastar-mekanism.md) (en regel
  utan mekanism efterlevs inte) och [`ADR-096`](ADR-096-subagentens-vantekontrakt.md)
  (subagenten är Activity, äger ingen väntan) som skälen två av tre
  kandidatvägar förkastas, se § Alternativ. Härledningen vilar på
  [`ADR-076`](ADR-076-merge-grinden-ruleset-pr-flode.md) (merge-kön mergar
  aldrig en post vars required checks är röda) — det är den egenskapen som
  gör härledningen sann, inte ett antagande.

---

## Kontext

### Mätningen, inte en hypotes

`check-backlog-closure.sh`s invariant 2 (status `Done` men AC eller DoD
obockat) fällde 2026-08-24 på **17 kort**. Ingen av de 17 var det fel
invarianten skrevs för att fånga (`ADR-073` beslut 5, `TASK-102`). En
utredning (`TASK-281`, grundad i `TASK-249.1`/`TASK-249.9`) fann att det inte
var 17 slarvfel utan **två skilda strukturhål**, båda lagade i samma
landning.

### Hål 1 — "CI grön per jobb" hade ingen ägare

DoD-mallens rad `CI grön per jobb på pushad commit`
(`backlog/config.yml`) kan bygg-agenten strukturellt inte bocka: dess arbete
slutar vid pushen, och CI-utfallet finns inte förrän efteråt.
`TASK-249.5` kommentar #1 säger det verbatim: *"DoD-status: #3 (CI grön per
jobb) lämnas obockad — CI-verifikation ägs av orkestrerarens svep, inte av
mig."* Stängnings-commiten flippade sedan bara status till `Done` — mätt på
`ea1cffbc`: noll kryssrutor rörda, bara status, `updated_date` och ett Final
Summary-block. Ingen part ägde steget däremellan. Följden: nattens drivande
mängd växte från 20 kort (2026-08-18) till 31 (2026-08-20) på två dygn —
grinden larmade korrekt men mängden växte snabbare än den städades.

### Hål 2 — invariant 2 hade ingen undantagsform för en legitim, ärlig stängning

`intentionally-open` undantar öppna kort. För ett **stängt** kort med
medvetet obockade rutor fanns ingen motsvarighet — och en sådan stängning är
legitim, mätt fem gånger samma dag (`TASK-283`, `283.5`, `285`, `285.12`,
`286.6`, städvåg A, `PR #1910`): Marcus avstod QA:n verbatim (*"Nej inget
Q&A, skit i det. Gör klart allt de andra."*), och kortet stängdes som
formellt avskrivet snarare än genomfört. Att bocka rutorna hade varit en
osann utsaga om att arbetet gjorts. Samma klass: `TASK-283` DoD, obockad för
att kravet blev inapplicerbart efter en arkitekturpivot (väg B,
[`ADR-123`](ADR-123-forladdat-personregister-sok-och-bokstavsindex-i-klienten.md)).
Utan en undantagsform blev grinden **rödare ju mer korrekt den utfördes** —
en grind som straffar den ärligaste stängningen lär ut fel sak.

### ADR-baren, prövad

**Svår att återställa** — i koherens: formen binder varje framtida korts
stängning, inte bara de 17. **Överraskande utan kontext:** en obockad
DoD-rad som ändå räknas som grön kräver en förklaring en läsare annars
saknar. **Verklig avvägning:** tre vägar vägdes mot varandra (§ Alternativ)
med explicit motivering för den förkastade huvudvägen. Alla tre håller —
ADR krävs.

---

## Beslut

### B1. Härledd DoD-rad + landnings-pekare (hål 1)

En obockad DoD-rad som matchar `BACKLOG_HARLEDD_DOD_MONSTER`
(`"CI grön per jobb"`) räknas **inte** som obockad — **förutsatt** att
kortets Final Summary bär en landnings-pekare som matchar
`BACKLOG_LANDNINGS_PEKARE_MONSTER` (`Landning:\s*PR #[0-9]+`). Saknas
pekaren räknas raden precis som förut, och grinden fäller med besked om
vad som saknas.

Härledningen vilar på rulesetet, inte på ett antagande: direktpush till
`main` avvisas (`ADR-076`) och merge-kön mergar aldrig en post vars
required checks är röda. "CI grön per jobb" är därför en **egenskap hos
landningen**, inte något en människa ska intyga — DoD-raden var en manuell
omskrivning av en invariant rulesetet redan upprätthåller. Bytet är ett
utbyte: ett påstående (bocken) ersätts av en maskinläsbar adress till
beviset (pekaren).

Samma ändring lagar death pointer-formen (`TASK-281` bifynd a): sex kort bar
slutraden *"PR: se kortets notes/kommentarer"* utan att något nummer fanns i
notes — numren gick bara att få fram med `git log --grep`. Nu är pekaren det
som gör kortet grönt, så den kan inte utelämnas obemärkt.

### B2. Stängning med avstådda krav (hål 2)

En tvåfaktors undantagsform, avsiktligt inte enfaktors: etiketten
`intentionally-unchecked` (`BACKLOG_AVSTADD_KRAV_ETIKETT`) **och** markören
`OBOCKAT MED AVSIKT:` (`BACKLOG_AVSTADD_KRAV_MARKOR`) i kortets Notes eller
Final Summary. Etikett utan markör fäller med eget meddelande; markör utan
etikett gör ingenting.

Skälet till två faktorer är asymmetrin mot `intentionally-open`: den
etiketten tystar ett kort som ännu inte är stängt (lågt pris — kortet prövas
igen nästa körning), medan denna tystar ett **stängt** kort för alltid. En
enfaktors-form hade varit en blankocheck utskrivbar med ett enda
`--add-label`.

### B3. Options-rymden, vägd (`TASK-281` AC #2)

Tre kandidater för hål 1, i den vägning som styrde valet:

1. **Orkestreraren bockar** manuellt som ett steg i landnings-svepet.
   Förkastad som huvudväg — se § Alternativ.
2. **Bygg-agenten armerar och bockar själv** efter en CI-vakt. Förkastad —
   se § Alternativ.
3. **Grinden slutar kräva rutan** och härleder grönheten maskinellt (B1
   ovan). **Vald.**

### B4. Fetch-depth styr verifieringens gräns

Nattjobbet (`.github/workflows/nightly.yml`, jobbet `backlog-closure`)
checkar ut med **`fetch-depth: 1`** (`actions/checkout`-steget). Det finns alltså ingen
git-historik i den checkouten att slå `Merge pull request #N` mot — en
ancestry-baserad verifiering av pekaren hade fungerat lokalt och fallit
tillbaka tyst i natten, den dyraste sorten av grind. Grinden verifierar
därför pekarens **närvaro och form**, inte dess **sanning**. Se § Konsekvenser
för vad den öppna gränsen kostar och var den är bokförd.

### B5. Hub-mallens följdändring

`do-work`-skillens Final Summary-mall (hub-repot `marcus-system`,
`plugins/marcus-system/skills/do-work/SKILL.md` steg 5b, commit `8d5f5d4`,
2026-08-24) bär nu raden `Landning: PR #<nr>` explicit i mallen. Utan den
hade nästa orkestrerade stängning fällts av samma grind trots att mekaniken
fungerar — death pointer-formen var ett beteende, inte en mall, och nu bär
mallen numret.

---

## Alternativ som övervägdes

**Väg (i) — orkestreraren bockar manuellt vid CI-verifiering.** Förkastad
som huvudväg. Den lägger tillbaka exakt den manuella handling som redan
bevisligen uteblir: `ADR-073` beslut 5 beskrev steget som orkestrerarens
redan, och 17 kort visar att en nedskriven beskrivning inte räckte. Det är
`ADR-083`-felklassen ordagrant — en regel utan mekanism efterlevs inte — och
det var precis vad detta kort finns för att bevisa. **Behålls som
mandaterad fallback** om B1 hade fallit tekniskt; den föll inte.

**Väg (ii) — bygg-agenten armerar och bockar själv efter en CI-vakt.**
Förkastad, inte på smak utan på kontrakt: den bryter `ADR-096`s
väntekontrakt. Subagenten är Activity — den saknar en framtida tur att vakna
i, och Monitor-callbacken levereras aldrig till en subagent (`L340`, mätt
2026-07-25). En agent som väntar in CI är en parkerad agent med färdig,
oredovisad leverans; `T112` mätte elva sådana på en natt. Vägen hade kostat
exakt den tillståndsklass orkestrerings-arkitekturen är byggd för att
undvika.

**Pekar-mönstret `PR #[0-9]+` rakt av, utan etikettord.** Förkastad, och det
är mätt, inte försiktighet: provkörningen 2026-08-24 godkände `TASK-285` med
den formen utan att någon rört kortet — dess slutrad nämnde `PR #1811` (ett
visuellt baslinje-lås) som kontext, medan kortets faktiska landning var
`PR #1910`. Rätt kort, fel bevis. Etikettordet `Landning:` skiljer en
deklarerad landning från ett omnämnande.

**`wontfix` breddad till att också undanta obockade krav.** Förkastad för
hål 2: etiketten finns redan och betyder "vi gör inte detta" — ortogonalt
mot "rutorna är obockade med avsikt". Att ge en befintlig etikett ny
tystande verkan hade ändrat innebörden retroaktivt för varje kort som redan
bär den.

**Undantag per rad i stället för per kort** (hål 2). Förkastad: kräver en
deklarations-syntax bunden till radnummer, och radnummer flyttar sig när ett
AC läggs till.

**En ny status (`Avskriven`/`Parked`)** för hål 2. Förkastad, samma skäl som
redan gäller för `intentionally-open`: `backlog/config.yml` deklarerar exakt
tre statusar, och en fjärde ändrar tavlan för varje kort och varje verktyg —
större sprängradie än en etikett.

**gh-API-uppslag eller ancestry-verifiering (`git log --grep`) mot pekarens
sanning.** Förkastad för denna landning, mätt hinder: nattjobbet checkar ut
med `fetch-depth: 1` (B4), så det finns ingen historik att slå mot lokalt.
Ett gh-API-anrop lägger till ett nätverksberoende i en grind som i dag inte
har något — rate-limit eller offline hade tvingat fram valet mellan tyst
grönt (oacceptabelt) och falskt rött i en required check (som devalverar
nästa larm, `T87`). Jobbet bär dessutom bara `contents: read`. Kvarstår som
öppen fråga, se § Konsekvenser.

**Precedent-rymden:** detta är ett internt process-/tillstånds-beslut om
repots egen backlog-tillstånd-mekanik, inte ett arkitekturmönster med
jämförbara externa produkter — samma bedömning `ADR-117` gjorde för samma
skript. Ingen branschledar-precedent söktes; den tunna rymden deklareras
öppet i stället för att fejkas (`~/.claude/CLAUDE.md` § Web-research).

---

## Konsekvenser

### Vad som gäller framåt

- Ett kort med obockad `CI grön per jobb`-rad är grönt **om och bara om**
  Final Summary bär `Landning: PR #<nr>`. Mallen (B5) gör detta default för
  varje orkestrerad stängning.
- En stängning med medvetet obockade AC/DoD kräver etiketten
  `intentionally-unchecked` OCH markören `OBOCKAT MED AVSIKT:` med en
  motivering — annars fäller grinden.
- Mekanikens fullständiga options-vägning, de förkastade formerna och
  källbeläggen för varje mätning bor i `scripts/check-backlog-closure.sh`
  under rubriken `═══ STÄNGNINGSFORMERNA — TVÅ UNDANTAG FRÅN INVARIANT 2
  (TASK-281) ═══` samt i `.backlog-closure-policy.conf`s kommentarer vid
  variablerna. Denna ADR är **beslutet**, inte en kopia av
  implementationen (`ADR-100` § karta, aldrig kopia) — läs skriptets huvud
  för den mekaniska sanningen, inte denna fil.

### Den öppna gränsen — pekarens sanning, inte dess form (`TASK-319`)

Grinden verifierar att en landnings-pekare **finns och har rätt form**. Den
verifierar **inte** att PR:en existerar, är mergad, eller rör kortet. Ett
påhittat PR-nummer ger i dag en grön härledning. Detta är bokfört som ett
öppet fynd-kort, `TASK-319` (registrerat 2026-08-24, samma session), med två
kandidatvägar redan skisserade där: `fetch-depth: 0` i
`backlog-closure`-jobbet plus ancestry-verifiering
(`git log --grep 'Merge pull request #N' origin/main`), eller ett
gh-API-uppslag med fail-closed offline-hantering. Kostnaden (den utökade
checkoutens tid i natten) ska mätas före val — exakt den disciplin B4 redan
tillämpade för det ursprungliga valet.

### Vad detta beslut INTE gör

- Det löser inte den historiska skulden — de kort som redan bär gamla,
  obockade DoD-rader utan pekare prövas alltjämt som förut (`TASK-281` §
  Avgränsning höll fast vid att historiken är en separat fråga).
- Det bygger inte pekar-sanningen. `TASK-319` äger den frågan.
- Det ändrar inte karensen (`ADR-073`/`TASK-102`s 24-timmarsfönster för
  invariant 1) eller förälder/barn-invarianten (invariant 3) — endast
  invariant 2 fick nya undantag.
