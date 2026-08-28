---
owner: marcus803
updated: 2026-08-04
review_by: 2027-02-04
status: draft
---

# `barn:`-fältet — designbeslut för tråd↔kort/tråd-relationen (Code, 2026-08-04)

> **Proveniens:** `T119` § carry-blockets rad *"Trådstatus-färskheten (b):s klass 2 —
> BLOCKERAD med känt skäl"* ([`tasks/sessions/archive/2026-08/2026-08-04-session-97.md:745-751`](../../tasks/sessions/archive/2026-08/2026-08-04-session-97.md)),
> som i sin tur pekar till [`Del 4 § Avvikelse 4`](../../tasks/sessions/archive/2026-08/2026-08-04-session-97.md#L615-L637)
> (rad 615–637) — det mätta negativa svaret att en färskhets-grind inte kan
> byggas korrekt förrän barn-relationen själv är mekaniserad.

## Kort svar

**Inget byggt.** Frågan "var ska `barn:`-fältet bo och vad gör man med de tre
befintliga formerna" kräver ett genuint val mellan minst tre livskraftiga
former, med reella avvägningar mellan dem och en definitions-fråga (vad
*räknas* som barn) som inte faller ut av mätningen ensam. Detta träffar
ADR-baren på alla tre villkor (se § ADR-bar-bedömning). Detta dokument är den
beslutsklara rapporten — bygget väntar på Marcus.

## Premiss-pass — vad som prövades

Uppdraget bad mig verifiera S97:s mätning stickprovsvis snarare än ta den för
given. Allt nedan är kört mot disk i denna worktree (`392b7f57`, samma som
`origin/main` vid start — `git fetch` gav inga nya commits).

| Premiss i uppdraget | Verifierad hur | Utfall |
|---|---|---|
| "`T95` har noll `[T95]`-taggade commits men är repots mest aktiva tråd" | `git log --grep '\[T95\]' --oneline \| wc -l` | **Bekräftat: 0.** Jämförelsevärden samma körning: `T61`=7, `T69`=16, `T85`=34, `T86`=22 |
| "Barn-relationen uttrycks i tre inkompatibla former" | Läst `T69`/`T85`/`T95`/`T61`/`T86` rad + kortfiler i sin helhet, se § De faktiska formerna | **Bekräftat, men ofullständigt** — en FJÄRDE relation (`besläktad`) existerar också och måste hållas isär, se nedan |
| "Indexet är en markdown-tabell med fyra kolumner och en grind som prövar radform" | Läst `scripts/check-thread-index.sh` (98 rader) + `.thread-index-policy.conf` | **Bekräftat.** `THREAD_COLUMN_COUNT=4`, grinden räknar pipe-tecken PER RAD (`EXPECTED_PIPES=THREAD_COLUMN_COUNT+1`) och fäller varje rad vars pipe-antal avviker — en femte kolumn kräver att alla 121 rader ändras mekaniskt, inte bara de rader som faktiskt har barn |
| "Nästa tråd `T120`" (session-dokets `NUMRERING`-sektion, rad 789–795, skriven mitt i S97) | `grep '`T119`\|`T120`\|`T121`' tasks/threads/README.md` | **DIVERGENS, redan självflaggad i källan.** `T119`, `T120` OCH `T121` är alla redan registrerade `active`-trådar (rad 162–164) — numreringsnoten skrev själv "Re-derivera ändå mot disk före varje minting", vilket exakt detta stickprov gör. Ingen ny tråd behövde mintas för detta uppdrag (kommit-taggen `[T119]` gavs direkt av uppdraget), så divergensen blockerar inget här — men den bekräftar regeln: en tråd-siffra i ett dok är ett ögonblicks-snapshot, aldrig en reservation |

**Ingen av divergenserna blockerar det här uppdraget.** Den enda som hade
kunnat göra det (tråd-numret) var redan självflaggad i källan som
provisorisk.

## Mätningen bekräftad — de faktiska formerna, med färska belägg

S97:s tabell (rad 618–625) mätte fyra metoder och deras korrekthet/robusthet.
Jag har inte kört om den tabellen (kostsam, och inget i uppdraget pekade på
att den var fel) — jag har verifierat att **innehållet** bakom "tre
inkompatibla former" fortfarande stämmer, med konkreta fynd:

### Form 1 — formell to-issues-hierarki (ägs redan av backlog-CLI:t)

- `T69` → PRD `TASK-9` → skiv-serien `task-4.x` (kortets rader 28, 53, 86, 90,
  106, 137, 162, 172, 188, 204 refererar serien).
- `T85` → skiv-serien `task-36.x` (kortets rad 50, 177) + tre spinoff-kort
  `TASK-49`/`TASK-50`/`TASK-51` (kortets rad 196: *"TRE FYND blev egna kort"*).
- `T95` → **två** PRD-kort: `TASK-126` (5 skivor, `npx backlog task task-126
  --plain` verifierat: `TASK-126.1`–`.5`) + `TASK-127` (10 skivor,
  `task-127.1`–`.10` verifierat samma väg) = 15 skivor totalt, exakt vad
  index-raden påstår.

Denna form är **redan mekaniskt ägd** av backlog-CLI:t: `TASK-126.1` är ett
strukturellt barn av `TASK-126` via den hierarkiska ID-notationen och
`Subtasks`-fältet som `task view` visar. Ett `barn:`-fält som dupplicerar
kort→kort-relationen vore en andra sanning om samma fakta — motsatsen till
vad uppdraget efterfrågar.

**Vad som INTE är mekaniskt ägt:** länken **tråd→PRD-kort** (`T95`→`TASK-126`).
Jag sökte backlog-kortets frontmatter (`task-126 - PRD-...md` rad 1–11) — inga
fält refererar tillbaka till en tråd. Länken lever uteslutande som fri text:
kortets TITEL bär `(T95 Spår A)` som suffix, och tråd-radens prosa säger
`kort: TASK-126 + TASK-127`. **Detta är den enda av 121 rader som använder
det mönstret** (`grep -c "kort: TASK" tasks/threads/README.md` → 1). Det är
alltså inte ens en etablerad konvention — det är en enskild instans.

### Form 2 — lös radprosa (`T61`)

`T61`:s rad (README rad 104) nämner `task-3`, `task-4.5`, "Batch 2", "Batch 3"
som exempel på vad AFK-loopen körde — men `task-4.5` tillhör `T69`:s
`task-4`-serie, inte `T61` självt. Det är alltså inte en barn-relation i
strukturell mening, bara en illustration i löptext. `T61` har heller ingen
kortfil (`ls tasks/threads/ | grep T61-` → tomt).

### Form 3 — tvärsnitts-produktion spridd över andra trådars PRD-träd (`T86`)

`T86`:s kortfil (`tasks/threads/T86-pocock-v11-integrationen.md`) innehåller
en logg-tabell med **minst 15 distinkta `task-N`-referenser** (`task-39`,
`task-40`, `task-41`, `task-44`, `task-45`, `task-46`, `task-47`, `task-48`,
`task-54.1`, `task-54.2`, ...) — kort som föddes under `T86`:s nattbygge men
som **inte** ligger under någon `T86`-egen PRD. Flera (`task-45`, `task-46`)
nämns i förbigående som fynd ur ANDRA trådars arbete (bl.a. `T69`:s spår).
Detta är strukturellt närmast form 1:s spinoff-mönster (jfr `T85`:s
`TASK-49`–`51`) men mycket bredare — 15+ löst kopplade kort mot 3.

### Den fjärde formen uppdraget inte nämnde: `besläktad` (peer, symmetrisk)

7 av 121 rader använder redan frasen "`besläktad` + backtickade tråd-ID:n"
(t.ex. `T98`s rad skriver besläktad följt av `T85` och `T86`; `T71`s rad
skriver besläktad följt av `T67` och `T56`). Detta är en
**symmetrisk** relation (peer/se-även), semantiskt skild från `barn:` som
uppdraget efterfrågar (asymmetrisk, förälder→barn). Utöver det finns minst en
explicit **asymmetrisk tråd→tråd**-relation som inte är `besläktad`:
`T30`-noten (rad 200) säger rakt ut *"T30 är kluster-parent... T12/T28/T29
förblir öppna symptom-trådar som pekar dit"* — en förälder-barn-relation
mellan TRÅDAR, helt i fri text, ingen mekanism.

**Konsekvens för designfrågan:** relations-rymden är rikare än "tre former av
samma sak". Den innehåller minst: (a) kort→kort [ägt av backlog-CLI],
(b) tråd→kort [tre inkompatibla fria former + en 1-instans-konvention],
(c) tråd→tråd asymmetrisk [en instans, fri text], (d) tråd→tråd symmetrisk
[7 instanser, semi-konvention `besläktad`]. Ett `barn:`-fält som blandar (b)
och (c) med (d) skulle förväxla förälder-barn med peer — exakt den typ av
tvetydighet registrets egen "Så här läser du registret"-sektion redan varnar
för runt ordet "kort" (rad 25–29: *"Tvetydigheten är registrets egen... löses
av prefixet, inte av gissning"*).

## Relations-inventering — vad ska INTE dupliceras

| Relation | Ägs redan av | Källa |
|---|---|---|
| kort→kort (PRD→skiva) | **Ja** — backlog-CLI:t, hierarkiska ID:n (`task-126.1`) + `Subtasks`-fält | `npx backlog task task-126 --plain` verifierat live |
| tråd→commit | **Delvis** — `[T<NN>]`-taggkonventionen + `git log --grep` | `tasks/threads/README.md` rad 254–256; men S97 mätte 25 % missrate (Avvikelse 4-tabellen) — otillförlitlig som ensam källa, men en ANNAN axel (aktivitet över tid) än strukturellt barnskap, så `barn:` ska inte försöka ersätta den |
| tråd→kort (PRD/skiva) | **Nej** | 1/121 rader har en informell konvention (`kort: TASK-N`); resten fri text eller inget alls |
| tråd→tråd (förälder/kluster) | **Nej** | En instans (`T30`), fri text |
| tråd→tråd (peer/`besläktad`) | **Delvis** — semi-konvention, 7 instanser, ingen grind | Ordet `besläktad` följt av backtickade tråd-ID:n, ingen mekanisk validering |

Slutsats: `barn:`-fältets jobb är att göra **tråd→kort** och **tråd→tråd
(förälder)** maskinläsbara, utan att röra kort→kort (redan löst) eller
kollidera med `besläktad` (annan semantik).

## Var ska fältet bo — tre livskraftiga former, verifierade mot disk

**Kort-only är falsifierat av mätningen själv, inte av mig.** `T95` — uppdragets
egna utpekade "testfall som avgör om en migrering ens är möjlig" — har
**ingen kortfil** (`ls tasks/threads/ | grep T95-` → tomt; endast 25 av 121
trådar har kortfiler alls, `ls tasks/threads/T*.md | wc -l` → 25). Ett
`barn:`-fält som bara lever i kortets frontmatter skulle per konstruktion
missa den tråd uppdraget själv pekade ut som avgörande. Detta lämnar tre
alternativ för var fältet primärt bor:

### A. Femte kolumn i indextabellen

- **Fördelar:** en sanningskälla, tabellformat matchar redan `Tillstånd`-
  kolumnens grindade mönster (`check-thread-index.sh` kan utökas med samma
  idiom som redan finns för kolumn 3).
- **Nackdelar:** mekaniskt bekräftat brytande för **alla 121 rader** — grinden
  räknar pipe-tecken per rad (`EXPECTED_PIPES=THREAD_COLUMN_COUNT+1`,
  `check-thread-index.sh` rad 90/120), så även de ~106 trådar utan några barn
  alls måste få en tom cell tillagd mekaniskt. Svårt att rulla tillbaka
  (kräver ett nytt mekaniskt svep över alla rader igen).

### B. Inline-token i befintlig `Ingång`-kolumn (utöka `kort: TASK-N`-mönstret)

- **Fördelar:** ingen brytande ändring av pipe-antal-invarianten; bygger
  vidare på den enda existerande instansen (`T95`).
- **Nackdelar:** `Ingång`-kolumnen är redan tät fri text med länkar, fetstil
  och citat (se `T86`:s rad — en av de längsta i filen). Att lägga strukturerad
  data i en prosa-kolumn blandar två syften i samma cell och är skört att
  greppa tillförlitligt när kolumnen redan innehåller ord som "kort".

### C. Separat manifest (t.ex. `tasks/threads/barn.yml` eller egen md-tabell)

- **Fördelar:** additiv — rör INGEN av de 121 befintliga raderna eller
  pipe-antals-invarianten. Kan starta glest (bara trådar med faktiska barn
  får en post — matchar registrets egen "progressiv disclosure"-princip,
  rad 238–239: *"rad först, kort när den växer"*). Fungerar identiskt oavsett
  om tråden har en kortfil eller ej — löser `T95`-fallet utan specialfall.
- **Nackdelar:** ny fil att hålla i synk; om `Ingång`-kolumnens `kort:`-prosa
  (den enda befintliga instansen) inte samtidigt städas bort finns två
  källor som kan glida isär.

**Detta är den arkitektoniska kärnfrågan** — samtliga tre alternativ är
tekniskt genomförbara, ingen faller bort av mätningen ensam, och valet formar
hur en framtida färskhets-grind måste läsa datan.

## Vad gör man med de tre befintliga formerna — inte heller ett rent format-val

Även om platsen vore beslutad återstår en **semantisk** fråga uppdraget
implicit förutsätter är löst men som mätningen visar inte är det: vad
*räknas* som barn?

- `T69`/`T95`: barn = raka PRD-skivor (entydigt).
- `T85`: barn = skiv-serien PLUS tre spinoff-kort som aldrig var skivor under
  någon `T85`-PRD (`TASK-49`–`51` föddes som fristående QA-fynd).
- `T86`: barn = 15+ fristående kort födda under nattbygget, flera av dem
  egentligen produkter av ANDRA trådars arbete (`task-45`/`46` nämns som fynd
  i `T69`:s spår, ej `T86`:s egna).

Migrering är alltså **inte** en mekanisk sed-körning över befintlig text —
`T86`:s fall kräver ett människo-omdöme om vilka av 15+ nämnda kort som
faktiskt är "barn" i den mening en färskhets-grind ska mäta, kontra kort som
bara producerades intill tråden. Att gissa det svaret själv vore precis den
typ av arkitektur-/scope-beslut `CLAUDE.md` § Triage säger ska eskaleras, inte
fattas på eget bevåg.

## ADR-bar-bedömning

Prövat mot de tre villkoren (alla måste hålla för att en ADR krävs):

1. **Svårt att återställa i kod ELLER koherens** — JA. Alternativ A (femte
   kolumn) kräver ett nytt mekaniskt svep över 121 rader för att rulla
   tillbaka. Alternativ C (manifest) blir, när en färskhets-grind byggs ovanpå
   den (vilket är precis vad `T119` väntar på), en beroende-yta för annan
   mekanism — att byta plats i efterhand innebär att både manifestet OCH
   grinden som läser det måste flyttas tillsammans.
2. **Överraskande utan kontext** — JA. Ingen av de tre platserna är den
   uppenbara defaulten; en ny läsare av registret skulle inte gissa rätt utan
   att läsa detta dokument.
3. **Resultat av en verklig avvägning** — JA. Brytande-ändring-kostnad (A) vs.
   ny-fil-synk-risk (C) vs. skör prosa-inbäddning (B) är genuina, olika
   kostnader — inte en illusion av val.

**Alla tre villkor håller → ADR krävs vid beslut.** Jag mintar den inte själv
(uppdragets STOPPA-GRIND är entydig på den punkten); den skrivs när Marcus
valt form.

## Rekommendation (utan att besluta åt Marcus)

Om en åsikt efterfrågas: **C (separat manifest)** väger tyngst av de tre —
den är den enda formen som löser `T95`-fallet (kortlös men mest aktiv) utan
specialfall, den enda som inte kräver en mekanisk beröring av alla 121
befintliga rader, och den är mest i linje med registrets egen uttalade
princip (progressiv disclosure, rad 238–239). Priset är en ny fil att hålla i
synk — hanterbart med samma grind-idiom `check-thread-index.sh` redan
använder (invariant 3/4: index→fil och fil→index i båda riktningar), utökat
till en tredje riktning (manifest→giltiga tråd-ID:n och kort-ID:n).

Detta är en rekommendation, inte ett beslut — STOPPA-GRIND-instruktionen väger
tyngre än min egen preferens.

## Öppna frågor till Marcus

1. Plats: A (femte kolumn) / B (inline-token) / C (separat manifest) / annan
   form?
2. Scope av "barn": bara raka PRD-skivor (form 1), eller även spinoff-/
   tvärsnitts-kort (form 1b/3)? Om det senare — vem avgör i tveksamma fall som
   `T86`:s `task-45`/`46`?
3. Migrering: obligatorisk för alla 14 `active`-trådar innan färskhets-grinden
   byggs, eller opt-in/gradvis (grinden hanterar frånvaro av `barn:` som "ej
   spårat", samma mönster `check-lifecycle.sh` redan använder för
   `lifecycle:`-fältets frånvaro)?
4. Ska `besläktad`-konventionen (peer, 7 instanser) mekaniseras i samma
   svep, eller hållas explicit isär som en separat, senare fråga?

## Verifikationslogg (för spårbarhet)

Samtliga kommandon kördes i denna worktree mot `392b7f57` (= `origin/main` vid
sessionsstart, `git fetch` gav inget nytt):

```text
git log --grep '\[T95\]' --oneline | wc -l   →  0
git log --grep '\[T61\]' --oneline | wc -l   →  7
git log --grep '\[T69\]' --oneline | wc -l   →  16
git log --grep '\[T85\]' --oneline | wc -l   →  34
git log --grep '\[T86\]' --oneline | wc -l   →  22
grep -cE '^\|[[:space:]]*`T[0-9]+`' tasks/threads/README.md   →  121
ls tasks/threads/T*.md | wc -l                                →  25
grep -c "kort: TASK" tasks/threads/README.md                  →  1
grep -c "besläktad \`T" tasks/threads/README.md                →  7
npx backlog task task-126 --plain   → Subtasks (5): TASK-126.1–.5
npx backlog task task-127 --plain   → Subtasks (10): TASK-127.1–.10
bash scripts/check-thread-index.sh  → ✅ (grönt, baseline oförändrad)
```
