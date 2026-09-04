---
owner: marcus803
updated: 2026-08-08
review_by: 2026-09-08
status: draft
---

# ADR-102:s rotorsaker R1–R6 — adversarial verifiering mot disk och git

> **Proveniens:** avgränsat falsifierings-pass 2026-08-08, kört OISOLERAT i
> huvudkatalogen mot `main` vid `b39ffa3c` (`Merge pull request #956`). Inga
> git-mutationer, ingen produktionskod rörd. Hållningen var att FÄLLA varje
> rotorsak, inte att bekräfta den — per `ADR-086` prövas uppdragets premisser
> av mottagaren.
>
> Styrande beslut: [`ADR-102`](../decisions/ADR-102-prototypen-ar-facit-skarpa-ska-vara-identisk.md).

## Kort svar — domen i klartext

**Ingen av R1–R6 står oförändrad. Två är falsifierade som nuläge, en är
falsifierad i sin orsaksförklaring, en är underskattad, och två håller bara
delvis.**

| Kort | Vad som faktiskt bär |
|---|---|
| R1 | Siffran höll vid mätningen — men den bevisar inte det ADR:n säger den bevisar, och gäller inte längre |
| R2 | Instansen är verbatim korrekt; generaliseringen är fel (3 av 38 AC) |
| R3 | Kärnan håller efter `#949`; ADR:ns egna belägg är delvis falska |
| R4 | Håller — och är UNDERSKATTAD. Mekaniseringen täcker 1 av 22 kataloger |
| R5 | Delvis löst. En helt utelämnad yta är fortfarande osynlig |
| R6 | Citatet är exakt; rotorsaken är åtgärdad i 1.32.0. Spärren är självbetjäning |

Den **avgörande delfrågan** var R1 — inte för att den var svårast att mäta,
utan för att dess ORSAKSFÖRKLARING är fel på ett sätt som styr vad
mekaniseringen ska göra. ADR:n säger att kedjan *"tappar facit i första
översättningen och återfår det aldrig"*. Det gjorde den inte. PRD-kortet
`TASK-145` nämner facit **fem gånger**, inklusive raden *"Design-review sker
mot facitbilderna"*, och DoD-posten propagerade till **samtliga sju skivor**.
Facit försvann alltså aldrig ur kedjan som BEGREPP — det saknade en **adress**.
Utförarna av `145.3` och `145.5` skrev båda ordagrant *"bilderna finns inte i
repot"* om bilder som redan låg i git. Det är en helt annan defekt än
vokabulär-frånvaro, och `facit.json` råkar vara rätt medicin — men av ett annat
skäl än ADR:n anger.

---

## Vad jag läste först — och vad som redan var känt

Passet inleddes med inventering. Fyra artefakter täckte delar av frågan redan:

1. **`tasks/sessions/archive/2026-08/2026-08-02-session-93.md` rad 1590 ff. — § "Mekaniseringen
   — och fyra fel agenten fann i min analys."** Bokför redan FYRA rättelser mot
   ADR-102: (a) R1 underskattad, `/prototype` bar inte heller begreppet; (b) R3
   feldiagnostiserad, utföraren letade och rapporterade öppet, och en DoD-post
   kan strukturellt aldrig grinda en merge; (c) R4:s tabell listade 2 av 4
   namnklasser; (d) R5 delvis fel, README rad 785–857 deklarerar redan
   bilderna som prosa. **Mitt pass upprepar inte dessa** — det prövar dem
   oberoende och söker vad de INTE fångade.
2. **[`docs/research/eventsidan-prototyp-mot-skarpa-facitkarta-2026-08-07.md`](eventsidan-prototyp-mot-skarpa-facitkarta-2026-08-07.md).**
   Kartlägger DIVERGENSERNA (elva block, sex avvikelser kvar) — alltså R8:s
   domän, inte R1–R6:s. Komplementär, ingen överlappning. Jag återanvänder dess
   avvikelse-lista som mätsticka för R5 och citerar den där den bär.
3. **`tasks/lessons.d/facit-maste-baras-av-mekanism-inte-av-minne.md`** och
   **`…/uppdragets-kallmarkning-maste-avse-gallande-text.md`** — R4:s lärdomar,
   redan skördade.
4. **`ADR-074`** (växlar-standarden) — den styrande ADR:n bakom R7:s form.
   Läst; R7 ligger utanför detta pass scope men berörs där R5 kräver det.
5. **Systerpasset [`adr-102-rotorsaksverifiering-r7-r9-2026-08-08.md`](adr-102-rotorsaksverifiering-r7-r9-2026-08-08.md)**
   (uppdrag A2b, samma dag) prövar R7–R9 med samma falsifierings-hållning.
   Delningen är ren: den läser koden och grenarna, detta pass läser skills,
   kort, bilagor och grindar. Där ytorna möts — R5:s korsläsning mot
   prototyp-grenarna — pekar jag dit i stället för att räkna om.

**Åldersbedömning:** allt material är 1–2 dygn gammalt. För ADR:er är det
färskt; för **plugin-versioner och grind-tillstånd är det inte det** — hub-
pluginet gick från 1.29.0 till 1.32.0 på samma dygn ADR:n skrevs, och en
CI-grind landade timmarna efter mätningen. Det är precis de delarna jag mätt om.

**Vad som är nytt i detta pass:** oberoende mätning av båda plugin-versionerna,
sandlådetest av `check-facit.sh`:s faktiska fyrning i sex lägen, räkning av
samtliga bilage-kataloger i repot, korsläsning av manifestets ytor mot kodens
prototyp-grenar, och en genomgång av alla 38 acceptanskriterier i `145.1`–`145.5`.

---

## R1 — "Facit försvinner i skill-kedjan"

### ADR:ns påstående

> Räknat i plugin `marcus-system@1.29.0`: `/to-prd` **0**, `/to-issues` **0**,
> `/do-work` **0**. […] Kedjan `prototyp → /to-prd → /to-issues → agent` tappar
> facit i första översättningen och återfår det aldrig. Skillen som SKRIVER
> acceptanskriterierna vet inte att bilderna existerar och kan därför inte peka
> på dem.

### Min mätning

Cachen bär båda versionerna. Räkning av ordet `facit` (skiftlägesokänsligt) i
`SKILL.md` per skill, `/Users/marcus/.claude/plugins/cache/marcus-hub/marcus-system/<v>/`:

| Skill | 1.29.0 | 1.30.0 | 1.31.0 | **1.32.0** |
|---|---|---|---|---|
| `/to-prd` | 0 | 0 | 0 | **4** |
| `/to-issues` | 0 | 0 | 0 | **11** |
| `/do-work` | 0 | 0 | 0 | **6** |
| `/prototype` | **0** | 0 | 0 | **12** |

Vändningen är EN commit i hub-repot:

```text
$ cd /Users/marcus/Repon/marcus-system && git log -1 --format='%h %ad %s' --date=iso 2e34ace
2e34acec3d6a4c6180b1a62bcc4117c03e416b5e 2026-08-07 20:41:20 +0200
feat(skills): [ADR-102] facit-kontraktet genom kedjan — 1.32.0
```

1.30.0 (`93892dd`, arbetsform-tillståndet) och 1.31.0 (`97e4e53`,
pre-compact-skillen) rörde inte facit alls. **Aktiv version nu:** 1.32.0 —
1.29.0, 1.30.0 och 1.31.0 bär alla en `.orphaned_at`-stämpel, 1.32.0 gör det
inte, och dess `.in_use/`-lås är daterat 2026-08-08 07:18.

**R1-tillägget bekräftas oberoende:** `/prototype` bar 0 omnämnanden i 1.29.0.
ADR:ns tabell listar bara de tre nedströms-skillsen och implicerar därmed att
prototyp-passet bar begreppet. Det gjorde det inte. Hub-committens egen
brödtext säger samma sak och kallar det *"MÄTT AVVIKELSE MOT ADR-102 R1"*.

### Falsifieringen — den kausala kedjan höll aldrig

ADR:ns mening *"Skillen som SKRIVER acceptanskriterierna vet inte att bilderna
existerar och kan därför inte peka på dem"* är ett kausalt påstående. Det
prövas mot vad kedjan FAKTISKT producerade, inte mot vad skillen sade.

Räkning av ordet `facit` i de landade korten:

| Kort | Träffar |
|---|---|
| `task-145` (PRD) | **5** |
| `task-145.1` | 5 |
| `task-145.2` | **10** |
| `task-145.3` | 2 |
| `task-145.4` | 1 |
| `task-145.5` | 2 |
| `task-145.6` | 1 |
| `task-145.7` | 2 |
| `task-146` + samtliga sex skivor | **0** |

PRD-kortet, verbatim (rad 140 + 142):

> **Facit är låst av Marcus 2026-08-06** (*"Jag är nöjd. Lås som facit."*)
> efter tjugo iterationsvågor. […] Den tabellen ÄR spec-underlaget för
> skivorna — läs den innan en skiva skrivs, inte efter.
>
> **Design-review sker mot facitbilderna**, inte mot det äldre S73-facit.
> Avvikelser bokförs öppet.

Och `/to-issues` PEKADE på facit i acceptanskriterier, trots att skillen inte
kände ordet:

- `task-145.1` AC #9: *"…samma form facit redan bär (registerListaA)…"*
- `task-145.2` AC #1: *"…i Betalningar-blockets grammatik (facit § 2)"*
- `task-145.2` AC #3: *"…ORÖRDA i sin facit-låsta form"*

**Verdikt: HÅLLER DELVIS — och är falsifierad som nuläge.**

Tre delar, med olika utfall:

- **Siffran** (0 omnämnanden i 1.29.0): HÅLLER, verifierad oberoende, och
  gäller `/prototype` också.
- **Slutsatsen** (*"kedjan tappar facit"*): FALSIFIERAD. Facit bars genom hela
  kedjan av orkestreraren, utanför skillsen. Det som saknades var en
  **maskinläsbar adress**, inte begreppet. Bevisat av att båda utförare som
  fällde granskningen skrev att bilderna *"finns inte i repot"* — om begreppet
  saknats hade de inte letat alls.
- **Nuläget** (1.32.0): FALSIFIERAD. Åtgärdad 2026-08-07 20:41.

### (a) Vad som täcks

1.32.0 wirar in manifestet i alla fyra skillsen med sökväg (`/to-prd` läser det
FÖRST och STOPPAR om facit-bilder finns utan manifest; `/to-issues` skriver AC
som pekar på facit per `B5`; `/do-work` STOPPAR i stället för att dra slutsatsen
"finns inte"). Det adresserar den verkliga defekten även om diagnosen var fel.

### (b) Vad som återstår

- **1.32.0:s regler har aldrig körts skarpt.** Ingen skiva har skrivits eller
  byggts under dem. `TASK-145.6` och `145.7` blir första provet.
- **Orkestreraren är inte en skill.** Facit bars in i PRD:n av en aktör som
  ingen av de fyra skillsen styr. Om samma aktör nästa gång inte gör det,
  fångar 1.32.0 det bara om ett `facit.json` faktiskt finns — och det skrivs
  av `/prototype`, som inte är obligatorisk att köra.
- **`TASK-146` bär 0 facit-omnämnanden i samtliga sju kort.** Bilage-fundamentet
  har inget prototyp-pass, så det är korrekt — men det betyder också att
  ingenting i de korten skulle avslöja om ett facit HADE funnits.

---

## R2 — "Acceptanskriterierna beskriver problem i stället för mål"

### ADR:ns påstående

> `TASK-145.5` AC #4 lyder *"Åtgärds-radernas grå löften är hanterade"* — en
> problembeskrivning. […] En mottagare som löser den beskrivna defekten kan
> landa godtycklig form och ändå uppfylla kriteriet bokstavligt.

### Min mätning

Citatet är **verbatim korrekt**, men avkortat. Hela AC #4 lyder:

> `- [x] #4 Åtgärds-radernas grå löften är hanterade: varje rivning eller
> ändring öppet bokförd, och numreringens referentbarhet uttryckligen
> adresserad`

Uppdraget bad mig pröva om mönstret är genomgående. Jag klassade **samtliga 38
acceptanskriterier** i `145.1`–`145.5`:

| Kort | AC | Mål-formade | Defekt-formade | Process-/testregler | Pekar på facit |
|---|---|---|---|---|---|
| `145.1` | 11 | 10 | 0 | 1 (#11) | 1 (#9) |
| `145.2` | 8 | 6 | 2 (#6, #8) | 0 | 2 (#1, #3) |
| `145.3` | 4 | 3 | 0 | 1 (#4) | 0 |
| `145.4` | 11 | 11 | 0 | 0 | 0 |
| `145.5` | 4 | 2 | 1 (#4) | 1 (#2) | 0 |
| **Summa** | **38** | **32** | **3** | **3** | **3** |

Klassningen är min bedömning, inte en mekanisk mätning — kriteriet var: bär
kriteriet en beskrivning av MÅLYTAN (mål) eller av ett FEL som ska bort
(defekt)? Exempel på mål-form, `145.4` AC #2: *"Arbetsytan är inflyttad under
registret som LÄSYTA, fällbar, med deadline-badgen bevarad"*. Exempel på
defekt-form, `145.2` AC #6: *"…den latenta buggen där tre av fyra tillstånd
överlevde är stängd"*.

**Verdikt: HÅLLER DELVIS.**

Instansen är äkta och exakt citerad. Generaliseringen — *"Acceptanskriterierna
beskriver problem i stället för mål"* som mönster, presenterat som *"Följden av
R1"* — är **falsifierad**: 32 av 38 kriterier är mål-formade, defekt-formen är
3 av 38 (≈ 8 %).

**Men körsbärsplockat är fel ord, och jag säger det öppet.** Den enda
defekt-formade AC som rör en YTA (`145.5` #4) är exakt den som ägde
**åtgärds-ytan** — den enda belagda divergensen mot facit. Statistiskt är
mönstret marginellt; kausalt träffade ADR:n den bärande instansen. Det som
FALLER är påståendet att formen var systematisk, inte påståendet att den var
skadlig.

Den verkliga systematiska bristen är en annan: **3 av 38 AC pekar på facit**.
Det är den siffra `B5` behöver, inte defekt-räkningen.

### (a) Vad som täcks

`B5` + `/to-issues` 1.32.0 kräver formen `"<ytan> är identisk med facit
<sökväg>"` och slår uttryckligen fast att en yta med `"bilder": []` får
AC:n *"identisk med den körande prototypen i läge X"* — *"frånvaron av bild
sänker aldrig kravet till en defektbeskrivning"*. Det är precis motmedlet mot
`145.5` #4.

### (b) Vad som återstår

- **Ingen mekanism prövar AC-formen.** `B5` är prosa i en skill. Ingen grind
  läser ett korts AC och fäller på defekt-form. `ADR-083`-klassen är inte stängd
  här, bara flyttad ett steg.
- **De redan landade korten är inte omskrivna.** `145.5` AC #4 står kvar i sin
  gamla form på ett kort med status `To Do` och AC #1 obockat.

---

## R3 — "Facit-granskningen är en bock utan spärr"

### ADR:ns påstående

> DoD-posten *"Design-review mot S93:s FACIT-bilder (ej S73-facit); avvikelser
> bokförda öppet"* stod **okryssad** på BÅDA de landade skivorna (`TASK-145.3`
> `#929`, `TASK-145.5` `#933`) — och båda landade gröna. Ingen mekanism i huset
> fäller en skiva vars facit-granskning uteblivit.

### Min mätning

**Delen om `145.3` och `145.5` håller.** DoD #5 står `[ ]` på båda idag,
`b39ffa3c`. Båda landade: `3eeb0e78` (2026-08-07 18:53, PR `#929`) och
`92a3d564` (2026-08-07 19:07, PR `#933`).

**Delen "BÅDA de landade skivorna" är falsk.** FEM skivor landade, inte två:

| Skiva | Landad | Status | DoD #5 |
|---|---|---|---|
| `145.1` | `331dcd35` 2026-08-07 14:30 (PR `#862`) | Done | **[x]** |
| `145.2` | `4cb06272` 2026-08-07 16:03 (PR `#902`) | Done | **[x]** |
| `145.3` | `3eeb0e78` 2026-08-07 18:53 (PR `#929`) | To Do | `[ ]` |
| `145.4` | `1127dbe7` 2026-08-07 17:27 (PR `#915`) | Done | **[x]** |
| `145.5` | `92a3d564` 2026-08-07 19:07 (PR `#933`) | To Do | `[ ]` |

Och den kryssade bocken är **värre än den okryssade**. `145.2` bär en extra
DoD-post #9, kryssad:

> `- [x] #9 Bor över och Avbokade verifierade mot facit-bilderna
> (variant-a-avbokade-oppnad.png m.fl.) — inte mot minnet av hur de såg ut`

`variant-a-avbokade-oppnad.png` **finns inte i repot**. Kortets egna
Implementation Notes bokför det öppet — utföraren hittade den omdöpta filen och
granskade mot den:

> Facit-bildens filnamn (uppdraget citerade "variant-a-avbokade-oppnad.png")
> finns inte längre under det namnet — konvergens-passet döpte om den till
> konvergens-a-avbokade-oppnad.png […] Granskad mot den korrekta filen.

Den korrekta filen är en **`konvergens-a-*`-bild från 2026-08-03**, alltså ett
passerat mellansteg tre dygn FÖRE låsningen 2026-08-06. En DoD-post som säger
*"verifierat mot facit-bilderna"* står kryssad på en granskning mot icke-facit.
Det är R4:s förväxling, bokförd som utförd granskning — och det är ett belägg
ADR:n inte har.

### Finns någon mekanism som fäller en skiva vars facit-granskning uteblivit?

Jag letade efter alla tre lager.

**1. Merge-grinden.** `check-facit.sh` kördes: den prövar adresserbarhet och
rivning, aldrig granskning. Skriptets eget huvud säger det rakt ut (rad 27–31):
*"den avgör INTE om skarpa ytan SER UT som facit […] Jämförelsen självt förblir
mänsklig."* Korrekt deklarerat, ingen `ADR-083`-drift.

**2. Kort-stängningen.** `scripts/check-backlog-closure.sh` HAR en invariant som
rör DoD (invariant 2: status `Done` med obockat AC eller DoD). Jag körde den i
förgrunden:

```text
$ time bash scripts/check-backlog-closure.sh > /tmp/closure.txt 2>&1; echo "EXIT=$?"
… 3:38.68 total
EXIT=1

19 inkonsistenta kort av 308 prövade.
❌ TASK-145.1 — status '✔ Done' men 0 AC och 3 DoD står obockade
❌ TASK-145.2 — status '✔ Done' men 0 AC och 3 DoD står obockade
❌ TASK-146.1 … TASK-158.2 (17 till)
```

Tre fynd ur den körningen:

- Grinden är **röd på `main` just nu**, med 19 kort — `145.1` och `145.2` bland
  dem.
- Den kör **bara i `nightly.yml`** (rad 437), aldrig i `ci.yml` per push. Den
  kan alltså per konstruktion inte fälla en merge.
- Den prövar **konsistens mellan status och kryss**, aldrig om granskningen
  ägde rum. En utförare som kryssar posten utan att granska passerar den.
- `145.3` och `145.5` fångas inte alls: de står `To Do`, och 72 kort ligger
  dessutom inom grindens 24-timmarskarens.

**3. DoD-posten själv.** Del 11:s slutsats står: en DoD-post är strukturellt
nedströms landningen och kan aldrig grinda en merge.

**Verdikt: HÅLLER — i sin omformulerade kärna.**

Ingen mekanism fällde då, och ingen fäller nu, en skiva vars facit-granskning
uteblivit. `#949` ändrade inte det och påstår inte att den gör det.

ADR:ns BELÄGG är däremot delvis falskt: fem skivor landade, posten var kryssad
på tre av dem, och minst en av de tre kryssades mot en konvergens-bild.
Rotorsaken blir **starkare** av rättelsen, inte svagare — problemet är inte att
bocken uteblev utan att bocken saknar betydelse i båda riktningarna.

### (a) Vad som täcks

`check-facit.sh` gör facit **omöjligt att inte hitta** före merge — vilket
stänger den ena av två felvägar (*"bilderna finns inte i repot"*).
`/to-issues` 1.32.0 kräver dessutom att DoD-posten bär manifestets sökväg,
eftersom en post som bara namnger facit inte är adresserbar.

### (b) Vad som återstår

- **Den andra felvägen är öppen:** en kryssad post utan granskning, eller mot
  fel bild. Ingenting hindrar det.
- **Stängningsgrinden är röd och nightly-only.** 19 kort står i drift. Så länge
  den inte är grön kan ingen skilja ny drift från gammal.
- **`145.1`, `145.2` och `145.4` bör omprövas.** Deras DoD #5 är kryssad mot
  bilder som i minst ett fall var konvergens-material.

---

## R4 — "Facit går att förväxla med icke-facit"

### ADR:ns påstående

> `tasks/sessions/bilagor/s93-hallplats-prototyp/` innehåller tretton `.png` i
> EN katalog, utan åtskillnad annat än ett prefix […] `konvergens-a-*.png`
> (passerat mellansteg) / `facit-*.png` (låst facit).

### Min mätning

Antalet stämmer: **13 `.png`**. Namnklasserna gör det inte — det är **fyra**,
inte två:

| Klass | Antal | Datum | Vad det är |
|---|---|---|---|
| `facit-*.png` | 4 | 2026-08-06 | låst facit |
| `konvergens-a-*.png` | 6 | 2026-08-03 | passerat mellansteg |
| `skarp-*.png` | 2 | 2026-08-03 | skarpa vyn, inte prototypen |
| `betalningar-fraga7-oppnad.png` | 1 | 2026-08-02 | helt utan klass-prefix |

Del 11 bokför redan denna rättelse. Mitt bidrag är att mäta **hur långt utanför
katalogen problemet går**. Svep över hela bilage-roten:

| Mätning | Utfall |
|---|---|
| Bilage-kataloger totalt | **22** |
| `.png` totalt | **168** |
| Kataloger med minst en `facit-*`-namngiven bild | **1** |
| Kataloger med `facit.json` | **1** |

Den enda katalogen är `s93-hallplats-prototyp`. **Tjugoen andra kataloger med
sammanlagt 155 bilder är osynliga för grinden** — och minst en av dem bär
uttryckligen låst facit. `tasks/sessions/bilagor/s96-auth-prototyp-facit/README.md`,
verbatim:

> Bilderna i denna katalog är det låsta facit `TASK-127.3` (login) och
> `TASK-127.6` (inbjudan) bygger mot.

Fyra bilder: `login-desktop.png`, `login-mobil.png`, `inbjudan-desktop.png`,
`inbjudan-mobil.png`. Inget `facit-`-prefix, inget manifest. Grinden är grön.

Jag reproducerade det som differentialmätning i sandlåda (kopior av
`check-facit.sh`, `facit-validera.mjs` och `.facit-policy.conf`; inget i repot
rört):

| Test | Uppställning | Utfall |
|---|---|---|
| T1 | manifest korrekt, markörer i `src/`, `godkand: null` | ✅ EXIT=0 |
| T2 | markörerna rivna ur `src/` medan `godkand: null` | ❌ **EXIT=1** |
| T3 | `godkand` satt till datum, markörerna rivna | ✅ EXIT=0 |
| T4 | katalog med `facit-*.png` utan manifest | ❌ **EXIT=1** |
| T5 | katalog med LÅST facit utan `facit-`-prefix (s96-mönstret) | ✅ **EXIT=0** |
| T6 | 105 av 106 grenar rivna, EN kommentarsrad med markörnamnen kvar | ✅ **EXIT=0** |

T2 och T4 bevisar att grinden har tänder. T5 och T6 bevisar var de inte når.

**Verdikt: HÅLLER — och är UNDERSKATTAD.**

Rotorsaken är verklig, ADR:ns tabell fångar hälften av namnklasserna, och
förväxlingen är belagd två gånger oberoende: orkestrerarens öppning av
`konvergens-a-markera-atgarder.png` (ADR:ns eget belägg) och `145.2`:s kryssade
DoD-post mot samma bildklass (R3 ovan, nytt belägg).

### (a) Vad som täcks

`facit.json` löser förväxlingen **inuti en katalog vars bilder följer
namnkonventionen**: `facit-validera.mjs` rad 121–132 fäller varje
`facit-*`-namngiven fil som inte är deklarerad, och `check-facit.sh` (a) fäller
varje katalog med `facit-*`-bilder utan manifest. För `s93-hallplats-prototyp`
är R4 därmed stängd.

### (b) Vad som återstår

- **Grinden är namn-grindad, inte innehålls-grindad.** Täckningen är 1 av 22
  kataloger. Ett prototyp-pass som låser facit utan `facit-`-prefix är
  osynligt — vilket S96 redan är, i produktion, idag.
- **Ingen mekanism säger vilka bilage-kataloger som BORDE ha manifest.** Frågan
  *"är denna katalog ett låst prototyp-pass?"* har inget maskinläsbart svar.
- **De tre S100-katalogerna** (`s100-atgardssidan-varv3`, `-varv4`,
  `s100-dokumentytan`, 26 bilder) bär inget facit-påstående i sina READMEs och
  är rimligen mitt i konvergens — men ingenting i repot skiljer "inte låst än"
  från "låst utan att följa konventionen".

---

## R5 — "Facit-täckningen är ofullständig och det syns inte"

### ADR:ns påstående

> Det finns `facit-*.png` för anteckningar, betalningar (×2) och gruppdynamik —
> **ingen för åtgärds-ytan**. Ingenting deklarerar vilka ytor som HAR låst
> facit, så en frånvaro är omöjlig att skilja från ett förbiseende.

### Min mätning

Bilddelen stämmer exakt: fyra `facit-*.png` — `facit-anteckningar.png`,
`facit-betalningar-arbetsytan.png`, `facit-betalningar-maxat-kort.png`,
`facit-gruppdynamik.png`. Ingen för åtgärds-ytan.

`facit.json` (landat `9a30a31a`, PR `#949`, 2026-08-07 20:38 — **två timmar
efter** ADR:n `e325bfbb` 20:16) deklarerar fyra ytor, varav åtgärds-ytan med
`"bilder": []` och en `not` som pekar ut den körande prototypen som facit.
`facit-validera.mjs` rad 89–96 kräver `bilder`-nyckeln och skiljer tom lista
(deklarerad frånvaro) från saknad nyckel (odeklarerad lucka).

**Går frånvaro att skilja från förbiseende IDAG?** För åtgärds-ytan: JA.
Generellt: NEJ — och luckan är stor.

Korsläsning av manifestets `kallor` mot koden med prototyp-grenar
(`grep -rlE "isHallplatsVariant|protoAktiv|protoDataMode|variantParam"
src/components/events/`, mätt `b39ffa3c`):

| Fil | Grenar | Deklarerad i `facit.json`? |
|---|---|---|
| `detail/Betalningar.tsx` | 44 | ja (`betalningar`) |
| `detail/Deltagare.tsx` | 21 | **NEJ** |
| `detail/Anteckningar.tsx` | 14 | ja (`anteckningar`) |
| `detail/Gruppdynamik.tsx` | 10 | ja (`gruppdynamik`) |
| `detail/Belaggning.tsx` | 10 | **NEJ** |
| `EventDetail.tsx` | 4 | **NEJ** |
| `atgarder/AtgardsSida.tsx` | 2 | ja (`atgarder`) |
| `detail/hallplats-steg-prototyp.ts` | 1 | **NEJ** |

**36 av 106 grenar tillhör ytor som manifestet inte nämner.** Den tyngsta är
`Deltagare.tsx` — registret, den yta Marcus itererade mest på. Enligt
[facitkartan](eventsidan-prototyp-mot-skarpa-facitkarta-2026-08-07.md) sitter
**fem av sex kvarvarande avvikelser i registret** (A2–A6). Manifestet, vars
uttryckliga syfte är att göra täckningens luckor synliga, deklarerar alltså
ingenting om den yta där nästan alla kända avvikelser finns.

`/prototype` 1.32.0 rad 124–127 kräver det uttryckligen: *"Varje yta passet
rörde ska ha en rad, även de utan låst bild."* Manifestet uppfyller inte sin
egen skills krav. Ingen grind kan se det: `facit-validera.mjs` prövar de ytor
som ÄR deklarerade mot disken, och kan strukturellt inte veta vilka som
saknas.

**Verdikt: HÅLLER DELVIS — mekaniseringen löser den deklarerade halvan.**

Frånvaro av BILD för en deklarerad yta är nu skiljbar från förbiseende.
Frånvaro av HELA YTAN är det inte. Rotorsakens formulering — *"Ingenting
deklarerar vilka ytor som HAR låst facit"* — är åtgärdad; dess konsekvens är
det inte.

### (a) Vad som täcks

`"bilder": []` som deklarerad frånvaro, med grind. `not`-fältet bär Marcus
svar för åtgärds-ytan (*"facit är den KÖRANDE prototypen"*). Del 11:s rättelse
(README rad 785–857 deklarerade redan bilderna som prosa) står — manifestet
tillför maskinläsbarhet, inte information som saknades.

### (b) Vad som återstår

- **Fyra av åtta prototyp-berörda filer saknar yta i manifestet**, inklusive
  registret. Detta är den enskilt största luckan detta pass fann.
- **Ingen grind kan pröva fullständighet.** Att gå från manifestets ytor till
  kodens prototyp-grenar är enkelriktat; den omvända riktningen (koden →
  manifestet) finns inte mekaniserad, trots att grep-mönstret redan är
  nedskrivet i `.facit-policy.conf` som `FACIT_PROTO_MARKORER`.
- **Grep-tal ≠ avvikelser.** Del 11 varnar: `Betalningar.tsx`s 44 träffar ger
  noll avvikelser (död kod), och 34 träffar i tre filer är bara
  `protoDataMode`. En fullständighetsgrind byggd på grep-tal skulle larma om
  fel saker. Det talar för att luckan ska stängas i `/prototype`-passet, inte
  i en grind.

---

## R6 — "'Frågan är besvarad' är odefinierat"

### ADR:ns påstående

> `/prototype` föreskriver *"radera eller absorbera när frågan är besvarad"*
> (SKILL.md rad 138, throwaway-kontraktets klausul iv) utan att definiera
> villkoret […] Följden: rivningen schemalades som en vanlig skiva
> (`TASK-145.6`) i beroendekön i stället för som en spärr efter godkännande.

### Min mätning

Citatet och radnumret är **exakta** i 1.29.0:

```text
$ sed -n '138p' …/1.29.0/skills/prototype/SKILL.md
6. **Radera eller absorbera när frågan är besvarad** — per kontraktets
```

Rad 139 fortsätter *"klausul (iv), tvågrenad semantik"*. Klausul-referensen
stämmer (rad 183: *"(iv) radera-eller-absorbera"*). Ingen definition fanns.
Oförändrat i 1.30.0 och 1.31.0.

I 1.32.0 är samma punkt utökad, verbatim:

> **På UI-grenen är "besvarad" DEFINIERAT och inte en bedömning:** frågan
> är besvarad när Marcus sett skarpa och prototypen bredvid varandra och
> sagt att de är identiska (ADR-102 B3). Ingenting annat räknas — inte
> att skivorna landat, inte att AC är bockade, inte att prototypen
> "känns färdig". Villkoret bärs av facit-manifestets `godkand`-fält
> […] Rivningen får ALDRIG schemaläggas som en vanlig beroendepost i kön.

Spärren har tänder — T2 ovan: markörerna rivna med `godkand: null` ger EXIT=1
med `ADR-102 B3` i felutskriften. `TASK-145.6` bär etiketten `blocked` i sin
frontmatter.

**Verdikt: FALSIFIERAD som nuläge; HÖLL exakt vid mätningen.**

### (a) Vad som täcks

Villkoret är definierat i skillen OCH burit av ett fält OCH grindat i CI
(`ci.yml` rad 748, `lint`-jobbet, plus `test-check-facit.sh` rad 859). Det är
den fulla kedjan prosa → data → grind, vilket är mer än `ADR-102` lovade
(ADR:n bokför uttryckligen R1–R6 som *"inte utförda av denna ADR"*).

### (b) Vad som återstår

- **`godkand` är självbetjäning.** T3 mätte det: en enda sträng i JSON släpper
  spärren, och inget i manifestet, grinden eller skillen kräver ett spår av att
  Marcus faktiskt godkänt (ingen commit-signatur, inget citat, ingen
  hänvisning). Den aktör spärren finns för att begränsa kan öppna den själv.
  Jämför `lasning`-fältet, som bär Marcus ord verbatim — motsvarande
  `godkannande`-citat saknas.
- **Halv rivning passerar.** T6 mätte det: markörlistan prövar bara att varje
  namn förekommer i MINST EN fil under `src/`. 105 av 106 grenar kan rivas, och
  en kommentarsrad räcker för grönt. `ADR-102` R7 varnar uttryckligen för att
  *"en halv rivning ger blandläge"* — grinden ser inte den klassen.
- **Markörlistan täcker 2 av 4 mönster.** `.facit-policy.conf` listar
  `isHallplatsVariant` och `protoAktiv`; `protoDataMode` och `variantParam`
  ingår inte, trots att de bär `Belaggning`/`Anteckningar`/`Gruppdynamik`.
- **`B3`:s villkor är tvetydigt.** Facitkartan visar att prototypen själv
  drivit sedan låsningen (D1: `Mottagen 21 juli` → `Mottagen`; D2:
  betalningskrysset). *"Identisk med prototypen"* och *"identisk med
  `facit-*.png`"* är därför inte samma villkor. `godkand` är ett fält; vilket av
  de två det kvitterar står ingenstans.

---

## Dom

**ADR-102:s BESLUT (B1–B5) berörs inte av detta pass — de står.** Det som
prövats är rotorsakerna, alltså underlaget, och underlaget har rört sig
betydligt på ett dygn.

Sammanfattat: ADR:n är rätt i sak och delvis fel i belägg. Den pekar på ett
verkligt haveri, men två av sex rotorsaker (R1, R6) beskriver ett tillstånd som
inte längre finns, en (R2) generaliserar från en instans som inte bär
generaliseringen, en (R3) vilar på ett belägg som är fel i sin räkning, och två
(R4, R5) underskattar sitt eget problem. **Ingen rotorsak är helt grundlös.**

Den viktigaste konsekvensen för grillningen: **mekaniseringen löser
adresserbarhet, inte granskning.** `check-facit.sh` gör facit omöjligt att inte
hitta och rivning omöjlig att göra i förtid — båda mätt. Ingenting i huset
prövar om jämförelsen skedde, om den skedde mot rätt bild, eller om manifestet
täcker alla ytor. De tre luckorna är oberoende av varandra och har olika rätt
svar.

---

## Vad jag inte kunde belägga

- **Om `145.1`, `145.2` och `145.4`:s kryssade DoD #5 var granskningar mot
  facit-bilderna eller mot konvergens-bilder.** Endast `145.2` bokför sin källa
  (och den var en konvergens-bild). `145.1` och `145.4` säger inget om vilka
  bilder som granskades. Jag kan inte skilja korrekt granskning från felaktig.
- **Om `145.1`:s DoD #5 kunde vara sann.** `145.1` landade `331dcd35`
  2026-08-07 14:30. `facit-*.png` landade `ecd4e1c0` 2026-08-06 18:51, alltså
  före — så det var MÖJLIGT. Om det skedde vet jag inte.
- **Varför `check-backlog-closure.sh` är röd med 19 kort.** Jag mätte att den
  är det och att `145.1`/`145.2` ingår; jag har inte utrett om det är känd,
  accepterad drift eller en obevakad regression. Grinden kör bara nightly, så
  ingen per-push-signal finns.
- **Om 1.32.0:s regler faktiskt fungerar i skarpt bruk.** Ingen skiva har
  skrivits eller byggts under dem. Jag mätte texten, inte utfallet.
- **Om `EnterWorktree`/harness-lagret påverkar vilken plugin-version en
  subagent ser.** Jag läste `.orphaned_at` och `.in_use` och drog slutsatsen
  1.32.0. Jag har inte verifierat det mot en körande agents faktiska skill-text.
- **Om S100:s tre bilage-kataloger innehåller låst facit.** Deras READMEs bär
  inget låsnings-påstående i sina första rader; jag läste dem inte i sin helhet.
- **Pixelnivå.** Ingen bildjämförelse gjordes. Alla facit-påståenden i detta
  pass är om FILER och DEKLARATIONER, aldrig om hur ytor ser ut.

---

## Rekommendation

**Detta är en rekommendation, inte ett beslut.** Underlaget till en grillning,
i fallande ordning efter vad som kan gå fel snarast.

1. **Stäng manifestets yt-lucka först.** Fyra av åtta prototyp-berörda filer
   saknar rad i `facit.json`, inklusive registret där fem av sex kända
   avvikelser sitter. Det är en JSON-ändring, ingen ny mekanism — och utan den
   är `B3`:s godkännande ett godkännande av halva ytan.
2. **Ge `godkand` ett spår, inte bara ett datum.** Formen kunde spegla
   `lasning`: ett `godkannande`-fält med Marcus ord verbatim. Kostar inget,
   och gör självbetjäningen synlig när den sker.
3. **Avgör vad `B3`:s villkor mäter mot** — den körande prototypen eller
   `facit-*.png`. Facitkartans D1/D2 visar att de två har glidit isär.
   Manifestet kan bära svaret per yta.
4. **Väg s96-hålet öppet.** Antingen döps S96:s fyra bilder om till
   `facit-*`-formen och får ett manifest, eller så deklareras det att
   grindens täckning är namn-grindad med avsikt. Det farliga är mellanläget:
   en grön grind som ser ut att täcka repot men täcker en katalog av 22.
5. **Ompröva R3:s tre kryssade DoD-poster** (`145.1`, `145.2`, `145.4`) innan
   godkännandet ges. Minst en av dem är kryssad mot en konvergens-bild.
6. **Rör inte AC-formen mekaniskt.** `B5` som skill-regel räcker tills det
   finns fler än en instans; en grind som läser AC-prosa vore spekulativ
   komplexitet ovanför golvet.

---

## Källförteckning

**Förstahands, i detta repo (`b39ffa3c`, `main`):**

- [`docs/decisions/ADR-102-prototypen-ar-facit-skarpa-ska-vara-identisk.md`](../decisions/ADR-102-prototypen-ar-facit-skarpa-ska-vara-identisk.md)
- [`docs/decisions/ADR-074-prototyp-substratets-adress-struktur-och-vaxlar-standard.md`](../decisions/ADR-074-prototyp-substratets-adress-struktur-och-vaxlar-standard.md)
- [`docs/decisions/ADR-083-prosa-som-pastar-mekanism.md`](../decisions/ADR-083-prosa-som-pastar-mekanism.md)
- [`docs/research/eventsidan-prototyp-mot-skarpa-facitkarta-2026-08-07.md`](eventsidan-prototyp-mot-skarpa-facitkarta-2026-08-07.md)
- `scripts/check-facit.sh` · `scripts/lib/facit-validera.mjs` · `.facit-policy.conf`
- `scripts/check-backlog-closure.sh` · `.github/workflows/nightly.yml` rad 425–450
- `.github/workflows/ci.yml` rad 735–760 (`lint`-jobbet) och rad 859
- `tasks/sessions/bilagor/s93-hallplats-prototyp/facit.json` + `README.md`
- `tasks/sessions/bilagor/s96-auth-prototyp-facit/README.md`
- `tasks/sessions/archive/2026-08/2026-08-02-session-93.md` rad 1590 ff.
- `backlog/tasks/task-145*.md`, `task-146*.md` (lästa, aldrig redigerade)
- `src/components/events/` (grep-mätning, ingen ändring)

**Förstahands, hub-repot `/Users/marcus/Repon/marcus-system`:**

- Commit `2e34ace` — *feat(skills): [ADR-102] facit-kontraktet genom kedjan — 1.32.0*, 2026-08-07 20:41:20 +0200
- Commit `97e4e53` (1.31.0), `93892dd` (1.30.0)

**Förstahands, plugin-cachen `/Users/marcus/.claude/plugins/cache/marcus-hub/marcus-system/`:**

- `1.29.0/skills/{to-prd,to-issues,do-work,prototype}/SKILL.md`
- `1.32.0/skills/{to-prd,to-issues,do-work,prototype}/SKILL.md`
- `.orphaned_at` / `.in_use/` per version

**Mätningar utförda av detta pass** (reproducerbara, sandlådan låg utanför
repot i scratchpad):

```bash
# R1 — ordräkning per version
for v in 1.29.0 1.30.0 1.31.0 1.32.0; do
  for s in to-prd to-issues do-work prototype; do
    printf '%s %s %s\n' "$v" "$s" \
      "$(grep -oic facit ~/.claude/plugins/cache/marcus-hub/marcus-system/$v/skills/$s/SKILL.md)"
  done
done

# R4 — svep över hela bilage-roten
for d in tasks/sessions/bilagor/*/; do
  printf '%s png=%s facit-glob=%s manifest=%s\n' "$d" \
    "$(ls "$d"*.png 2>/dev/null | wc -l)" \
    "$(ls "$d"facit-*.png 2>/dev/null | wc -l)" \
    "$([ -f "$d/facit.json" ] && echo ja || echo nej)"
done

# R5 — manifestets ytor mot kodens prototyp-grenar
grep -rlE "isHallplatsVariant|protoAktiv|protoDataMode|variantParam" src/components/events/
node -p "JSON.parse(require('fs').readFileSync('tasks/sessions/bilagor/s93-hallplats-prototyp/facit.json','utf8')).ytor.flatMap(y=>y.kallor).join('\n')"

# R3 — stängningsgrinden (≈3 min 39 s på denna maskin)
bash scripts/check-backlog-closure.sh; echo "EXIT=$?"

# R4/R6 — sandlådetesterna T1–T6: kopiera check-facit.sh, facit-validera.mjs
# och .facit-policy.conf till en tom katalog utanför repot, bygg en
# bilage-katalog + src/ enligt tabellen i § R4, kör grinden per läge.
```
