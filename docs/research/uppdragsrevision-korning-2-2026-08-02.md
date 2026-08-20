---
owner: marcus803
updated: 2026-08-02
review_by: 2027-02-02
status: draft
---

# Uppdragsrevision, körning #2 (T110 mätled 2 / T113 mätpunkt 2) — femtonvågen + artonde resumen (Code, 2026-08-02)

> **Proveniens:** beställd som ett av åtta parallella pass i "Våg 1"
> (`tasks/sessions/archive/2026-07/2026-07-26-session-91.md` Del 41, tjugoandra resumen):
> *"uppdragsrevision #2 (`npm run revision:uppdrag`, T110 mätled 2 = första
> n≥2-punkten, T113 mätpunkt 2)"*. Detta är den körningen. Instrumentet
> (`scripts/uppdragsrevision.mjs`, ADR-086) och baslinjen (körning #1, mot
> session `fd0eef00…`, dokumenterad i
> [`tasks/threads/T110-orkestrerarens-felklasser.md`](../../tasks/threads/T110-orkestrerarens-felklasser.md)
> § Första uppdragsrevisionen) prövas INTE om här — de tas som givna och
> jämförs mot.
>
> **Denna rapport drar inga effektslutsatser.** Sessionsdokets rad 8046–8048
> och T110-tråden är uttryckliga: *"T110-effektpåståenden förbjudna tills
> revision n≥2."* Denna körning ÄR n=2 — men n=2 föder en jämförelsepunkt,
> inte ett orsakssamband. Alla jämförelser nedan mot baslinjen är redovisade
> som DATA. Synteser (om premiss-passet eller Sonnet-omställningen "verkar")
> hör till orkestrerarens/Marcus efterföljande läsning, inte till detta
> dokument.

## Målsession — identifiering, källmärkt

Uppdraget angav målet i prosa: *"uppdragen från orkestreringen 2026-07-31→08-01
(femtonvågen + fredagens vågor)"*, med explicit instruktion att identifiera
rätt sessionsfil via mtime/storlek OCH innehåll — inte gissning — samt att
utesluta baslinjefilen (`fd0eef00…`) och den pågående sessionen (ingen
bygg-uppdrag ännu).

**Fil-mtime visade sig opålitlig som ensam signal** (första divergensen,
se § Premiss-pass nedan) — identifieringen gjordes i stället mot
**innehållets egna tidsstämplar** och mot `tasks/sessions/archive/2026-07/2026-07-26-session-91.md`:

| Fil | Innehållets tidsspann (första/sista rad) | Motsvarande resume (sessionsdok) | Roll i denna körning |
|---|---|---|---|
| `f1ff4bcd-da49-4442-a771-4db95abbdd38.jsonl` | 2026-07-30T18:52:47Z – 2026-07-31T07:23:31Z | **Artonde resumen** — Del 34–37 (rad 6939–7304), *"vågen ut"* + *"Vågen: sju agenter"* + natten som gick sönder två gånger; paus landad 2026-07-31 (*"artonde pausen"*, rad 7304) | **Ingår** — "fredagens vågor" |
| `ae112ab2-52bb-4878-a16e-82d9417621a1.jsonl` | 2026-07-31T07:14:49Z – 2026-07-31T10:18:36Z | **Nittonde resumen** — Del 38 (rad 7395), *"hub-skulden betald, och femton agenter"*; paus landad *"nittonde pausen 2026-07-31 efter femtonvågen"* (rad 7544) | **Ingår** — "femtonvågen" |
| `fd0eef00-17db-4a2c-b439-3787315b28a6.jsonl` | 2026-07-31T09:47:19Z – 2026-08-01T20:38:51Z | **Tjugonde resumen** — Del 39, *"vågen som landade, natten som inte väckte någon"* | **Uteslutet** — detta ÄR baslinjen (körning #1, 34 uppdrag — talet reproducerat, se nedan) |
| `c64f6755-96bb-4f25-b076-295091a57d00.jsonl` | 2026-08-01T14:09:12Z – 2026-08-01T21:25:27Z | **Tjugoförsta resumen** — Del 40, *"Sonnet-omställningen och stängningspaketet"* (Lördag, 1 bygg-agent-spawn) | **Uteslutet, se § Scope-beslut** |
| `a964302a-1c0e-4bb6-ad0f-f6842bb80a21.jsonl` | 2026-08-01T21:26:59Z – | Denna revisions egen subagent-session | **Uteslutet per uppdraget** ("bär inga bygg-uppdrag ännu") |

**Korroborering, oberoende av sessionsdoket:** `ae112ab2` innehåller exakt
**15 `bygg-agent`-spawns** (+ 1 `claude-code-guide`) — en exakt bokstavlig
träff mot *"femton agenter"* (T110-tråden rad 28, sessionsdok rad 7395-titeln).
Detta bekräftar filidentifieringen oberoende av tids-resonemanget ovan.

### Scope-beslut, öppet redovisat

"Femtonvågen + fredagens vågor" pekar entydigt ut nittonde resumen
(`ae112ab2`, femtonvågen) och artonde resumen (`f1ff4bcd`, vars paus landade
på fredagen och vars två vågor — *"vågen hemma"*/*"vågen ute"*,
`tasks/todo.md` rad 131/151 — är de andra "fredagens vågor"). **`c64f6755`
(tjugoförsta resumen) exkluderades medvetet**: dess Del-rubrik daterar den till
lördag (2026-08-01), inte fredag, och den bär bara ETT uppdrag (troligen
Sonnet-omställningens egen exekvering). Detta är ett tolkningsval av en
prosa-formulering utan exakt käll-citat i sessionsdoket för själva frasen
"femtonvågen + fredagens vågor" — den är uppdragstextens egen sammanfattning,
inte ett verbatim-citat. Beslutet redovisas här så orkestreraren kan korrigera
om avsikten var en annan avgränsning.

## Korpus

**30 uppdrag** (26 `bygg-agent` · 3 `research-pass` · 1 `claude-code-guide`),
**3 004 rader, 0 trasiga, 0 sidechain-exkluderade** (summerat över de två
källfilerna; körda separat eftersom instrumentet läser en fil per anrop):

```text
$ node scripts/uppdragsrevision.mjs --session f1ff4bcd --katalog <transcript-dir>
källa: …/f1ff4bcd-da49-4442-a771-4db95abbdd38.jsonl
14 uppdrag (bygg-agent=11 · research-pass=3) · 0 sidechain-exkluderade · 1560 rader (0 trasiga)

$ node scripts/uppdragsrevision.mjs --session ae112ab2 --katalog <transcript-dir>
källa: …/ae112ab2-52bb-4878-a16e-82d9417621a1.jsonl
16 uppdrag (bygg-agent=15 · claude-code-guide=1) · 0 sidechain-exkluderade · 1444 rader (0 trasiga)
```

Ingen av de 30 uppdragstexterna hade ett explicit `model`-override i
Agent-anropet (`modell: null` för samtliga) — båda källfilerna föregår
Sonnet-omställningen (PR #557, landad under tjugoförsta resumen, `c64f6755`,
lördag). **Både baslinjen (körning #1, `fd0eef00`) och denna körning
(`f1ff4bcd` + `ae112ab2`) är alltså pre-Sonnet-data** under samma
agent-default. Ingen av de två körningarna kan därför själva svara på
Sonnet-frågan — det kräver en körning #3 mot en post-`c64f6755`-session.

## Metod

Samma metod som körning #1 (T110-tråden § Extern prövning + § Första
uppdragsrevisionen): läs varje uppdragstext i sin helhet, extrahera varje
prövbart faktapåstående (filsökväg, radnummer, SHA/commit, tal/antal, direkt
citat, tillståndspåstående), pröva mot `git`/`grep`/`wc -l`/backlog-CLI:t i
huvudrepot. Historiska radnummer/tal prövades mot rätt tidpunkt via
`git show <commit-precis-före-uppdraget>:<fil>`, inte mot dagens disk — ett
påstående som höll VID SKRIVTILLFÄLLET men senare legitimt driftat klassas
GRÄNSFALL, inte HÅRT FEL.

Arbetet delegerades till tre parallella `general-purpose`-agenter (10 uppdrag
vardera: fil 01–10, 11–20, 21–30), var och en med identisk metodinstruktion
och identisk klassningsskala (HÖLL / HÅRT FEL / GRÄNSFALL / OPRÖVBAR /
OPRÖVAD), plus en KÄLLMÄRKT J/N-flagga per påstående (bar uppdragstexten SJÄLV
en hänvisning till varifrån talet/raden kom?).

**Synteshantering — en självupptäckt divergens (se § Premiss-pass):** de tre
subagenternas EGNA sammanfattningsrader innehöll räknefel mot sina egna
detaljtabeller (batch 1 uppgav 44 påståenden, tabellraderna gav 49; batch 3
uppgav "8 hårda fel", tabellraderna gav 7). Denna rapports tal är därför
**omräknade direkt ur samtliga 30 detaljtabeller med ett skript**
(`T110-count-verdicts.py`, radparsning av alla `| # | claim | verdict | bevis
| källmärkt |`-tabellrader), inte hämtade från subagenternas sammanfattningar.
Ett urval av de starkaste fynden spot-verifierades ytterligare en gång direkt
av mig (se § Premiss-pass).

## Resultat — census

| | Antal | Andel av 188 |
|---|---:|---:|
| **Totalt prövade påståenden** | **188** | 100 % |
| HÖLL | 160 | 85,1 % |
| HÅRT FEL | 11 | 5,9 % |
| GRÄNSFALL | 5 | 2,7 % |
| OPRÖVBAR (ögonblickstillstånd, ej rekonstruerbart) | 4 | 2,1 % |
| OPRÖVAD (lågrisk/extern källa, medvetet ej kollad) | 5 | 2,7 % |
| OPRÖVAD, sandbox-begränsad (hub-repo-claims, git blockerat i worktree) | 3 | 1,6 % |

**Avgjorda** (HÖLL + HÅRT FEL + GRÄNSFALL) = 176. **Felrate av avgjorda:**
11/176 = **6,25 %** hårda fel; med gränsfall 16/176 = **9,09 %**.

**Källmärkning:** 107 av 188 påståenden (**56,9 %**) bar en explicit
hänvisning i uppdragstexten till varifrån talet/raden/citatet kom.

**Per-uppdrag:** 10 av 30 uppdrag (samtliga `bygg-agent`, 10/26 = **38,5 %** av
bygg-agent-uppdragen) bar minst ett hårt fel. Noll fel i `research-pass`- eller
`claude-code-guide`-uppdragen (4 uppdrag, 18 prövade påståenden, samtliga HÖLL
eller GRÄNSFALL/OPRÖVBAR).

## De 11 hårda felen — och en strukturell observation

**7 distinkta underliggande sakfel, 11 instanser** — 4 av felen upprepas
oförändrade i mer än ett uppdrag samma dag:

| Fel (verbatim eller nära) | Instanser | Faktiskt läge | Rotorsak |
|---|---|---|---|
| "TASK-92 rör/landat rad 1015" i `ci.yml` | TASK-91-uppdraget, TASK-85-uppdraget (2 st) | Rad 1046 resp. 1126 vid respektive skrivtillfälle — talet var korrekt bara i TASK-92-kortets ursprungstext, skriven FÖRE två mellanliggande commits flyttade raden | Kort-text återanvänd utan omverifiering mot rörligt disktillstånd |
| "Verifiera med `npm run check:docs` (nio grindar)" | TASK-96-, ADR-084-, task-106-uppdragen (3 st) | Skriptets egen slutrad säger "tio"; felet satt i `.claude/agents/bygg-agent.md:55`, EN gång felaktigt tillskrivet `CLAUDE.md` (task-106-uppdraget) | Samma redan kända stale-siffra återanvänd tre uppdrag i rad; ett av dem fel källa också |
| "110 trådrader, 14 active" (trådregistrets grovmätning) | Trådkartan-uppdraget, Trådregistrets-integritet-uppdraget (2 st) | Faktiskt 109/13 — men **båda instanserna var uttryckligen hedgade** ("grovmätning — verifiera, bygg inte på den") och **båda mottagande agenter fann och rättade felet självständigt** | Exakt det hedge-mönster ADR-086 efterfrågar, fungerande innan ADR:n fanns |
| "De 17 posterna utan `[UNIVERSAL]` lyfts inte" | Hub-lyftet-uppdraget | Faktiskt 4, inte 17 — direkt konsekvens av att `[UNIVERSAL]`-räkningen (59 mot verkliga 72, se nedan) missade 13 poster med markören på egen rad | Samma instrumentblindhet T110-tråden självt katalogiserar som sitt klass A-exempel |
| "Vaktens plats hos de sex syskon-EF:erna är rad ~9–33" | TASK-38-uppdraget | Fyra av sex låg långt utanför intervallet (65, 90, 120, 133–134) | Ett radintervall generaliserat från för få observerade filer |
| "60 stycken fragment i `tasks/lessons.d/`" | A2:10-uppdraget (hub) | 65 vid tidsnära commit | Räkning ej omgjord vid uppdragets skrivtillfälle |
| "Session-91-doket är 7391 rader, Del 1–37" | Trådkartan-uppdraget | 7208 rader, 36 Del-sektioner vid tidsnära commit | Samma klass som ovan — ett växande dokument mätt en gång, återanvänt |

**Metodologiskt notabelt:** två av de sju (nio-grindar-felet och
[UNIVERSAL]-undertäckningen som ligger bakom 17-mot-4-felet) är **samma
instanser T110-trådens egen ursprungsberättelse redan katalogiserar**
(Del 38.6, klass A respektive B) — eftersom `ae112ab2` (nittonde resumen)
bokstavligen ÄR den session Del 38 beskriver. Denna körning verifierar alltså
för första gången KVANTITATIVT den uppdragstext som bar två av T110:s
grundande exempel, och finner att det ena (nio grindar) i sig upprepades tre
gånger samma dag — högre repetition än den enskilda instans T110-tråden
ursprungligen bokförde.

## Gränsfall (5)

- **check-docs.sh rad 40–46 "tio grindar"** (TASK-98): radintervallet
  innehöll faktiskt sex poster; talet tio avsåg filens TOTALA scope. Frasen
  var kopierad ordagrant ur TASK-98-kortets egen text.
- **backlog.md-dependency-status** (T107-research-passet): höll exakt vid
  skrivtillfället (2026-07-30); ändrades legitimt dagen efter (TASK-102,
  2026-08-01) — samma pass som själv rekommenderade ändringen.
- **PAUSLÄGE "punkt 4"** (Hub-lyftet-uppdraget): citatet var ordagrant korrekt
  men var i verkligheten punkt 5, inte 4.
- **"TASK-53 (PR #500) är armerad"** (task-103-uppdraget): PR:en var redan
  LANDAD 4,5 minuter innan uppdraget skrevs — ett tillstånd som redan hunnit
  gå förbi det påstådda.
- **AC-koppling till TASK-76** (TASK-87-uppdraget): tematisk men något
  utsträckt koppling, ärvd från kortets egen ursprungstext.

## Källkrav — bakgrundsvariation, ingen trend

56,9 % källmärkning i denna körning mot 64 % i baslinjen. **Båda siffrorna är
FÖRE ADR-086** (källkravet landade under tjugoförsta resumen, efter båda
källfilerna i denna körning såväl som efter baslinjens `fd0eef00`) — skillnaden
är alltså inter-vågs bakgrundsvariation under samma regim, inte en trend under
en förändrad regel. En mätning av ADR-086:s källkrav kräver en körning mot en
post-ADR-086-session; ingen sådan finns ännu i corpus.

## Jämförelse mot baslinjen — DATA, ingen slutsats

| Mätvärde | Körning #1 (baslinje, `fd0eef00`) | Körning #2 (denna, `f1ff4bcd`+`ae112ab2`) |
|---|---:|---:|
| Uppdrag | 34 | 30 |
| Prövade påståenden | 192 (~5,6/uppdrag) | 188 (~6,3/uppdrag) |
| Avgjorda | 156 | 176 |
| Hårda fel | 6 (3,8 % av avgjorda) | 11 (6,25 % av avgjorda) |
| Hårda fel + gränsfall | 9 (5,8 %) | 16 (9,09 %) |
| Uppdrag med ≥1 hårt fel | 6/28 bygg-agent (21 %) | 10/26 bygg-agent (38,5 %) |
| Källmärkning | 64 % | 56,9 % |
| Modell | pre-Sonnet | pre-Sonnet (samma regim) |

Denna körnings felrate ligger högre än baslinjens på samtliga fyra axlar. Per
uppdragets uttryckliga instruktion dras **ingen** slutsats av det här — två
vågor från SAMMA pre-Sonnet-regim är en naturlig varians-observation, inte en
trend med n=2. Att båda körningarna råkar vara pre-Sonnet är i sig en premiss
värd att bära vidare: T113:s Sonnet-jämförelse väntar fortfarande på sin
FÖRSTA datapunkt, inte sin andra.

## Premiss-pass — vad som prövades, och avvikelserna

Prövat mot uppdragets egna påståenden, innan design:

- **"Identifiera rätt sessionsfil via mtime/storlek och innehåll, inte
  gissning."** Mtime visade sig vara en FALSK signal (se tabellen ovan — flera
  filers mtime låg timmar-till-dygn efter deras faktiska sista
  konversationsrad, sannolikt pga trailing `summary`-rader utan
  `timestamp`-fält som uppdaterar filens OS-mtime utan nytt samtalsinnehåll).
  **Avvikelse, hanterad:** identifieringen gjordes om helt mot radens EGNA
  `timestamp`-fält plus sessionsdokets Del-rubriker, aldrig mot `ls -la`.
- **"`fd0eef00*` är baslinjefilen — uteslut den."** Verifierat: `fd0eef00`
  innehåller exakt 34 top-level `Agent`-spawns, identiskt med T110-trådens
  bokförda baslinjetal. HÖLL.
- **"Den senaste filen kan vara DENNA pågående session — uteslut även den."**
  Verifierat: `a964302a…` (denna revisionsagents egen subagent-transcript) har
  8 egna `Agent`-spawns (sub-subagenter för själva denna revision) men noll
  bygg-uppdrag åt appen — konsekvent med uppdragets varning. Exkluderad.
  **`c64f6755` (tjugoförsta resumen) var INTE nämnd i uppdraget alls** —
  hittad genom eget sessionslistnings-pass, och exkluderad genom ett eget
  scope-beslut (se ovan), inte genom en uttrycklig uppdragsinstruktion.
- **"T113 väntar på denna körning som sin mätaxel 2 — uppdatera INTE
  trådregistret eller trådkorten."** Efterlevd: inga filer i `tasks/threads/`
  rörda av detta arbete.
- **"Rapporten landar enligt instrumentets/repots konvention
  (`docs/research/` med datumsuffix)."** Verifierat: inget existerande
  `docs/research/uppdragsrevision*`-dokument fanns sedan tidigare (körning
  #1:s rapport dog med sin session — sessionsdok rad 7955–7958 bokför detta
  uttryckligen: *"Agenter i flykt vars rapporter DÖR med sessionen: …första
  uppdragsrevisionen (read-only; fynden går förlorade)"*). Detta är alltså
  den FÖRSTA landade rapportfilen för detta instrument.

**Ingen divergens fälldes som blockerande** — samtliga hanterades genom att
följa verkligheten (radens tidsstämpel, faktiska Agent-spawn-typer) i stället
för uppdragets bokstav (mtime-instruktionen, den outtalade gissningen om
`c64f6755`), och redovisas här öppet i stället för att tystas.

## Avgränsningar

- **Verifieringen gjordes av tre parallella subagenter, inte av mig personligen
  för varje enskild rad.** Jag spot-verifierade fyra av de starkaste fynden
  direkt (TASK-92-radnumren mot `git show 2308a256:.github/workflows/ci.yml`
  → rad 1046 bekräftad; "nio"/"tio"-källan mot `scripts/check-docs.sh` rad 46
  och 278 samt `CLAUDE.md` — bekräftat att `CLAUDE.md` inte nämner grindantalet
  alls) — samtliga höll. Jag litar INTE på subagenternas egna
  sammanfattningsrader (se § Metod, synteshantering) utan räknade om alla 188
  verdicts direkt ur detaljtabellerna.
- **3 hub-repo-relaterade påståenden (A2:10-uppdraget) kunde inte oberoende
  verifieras** — subagentens git-kommandon mot hub-repot blockerades av
  worktree-sandboxens repo-gräns. Bokförda som OPRÖVAD (sandbox), inte HÖLL.
  Detta är en instrumentbegränsning värd att bära vidare: en spoke-worktree
  kan strukturellt inte revidera hub-repo-claims.
- **Ingen seeding, ingen capture-recapture.** Precis som körning #1 mäter
  denna körning bara FÅNGADE fel i uppdragstexten mot disk — inte hur många
  fel som fanns men aldrig fångades av vare sig mottagande agent eller denna
  revision.
- **n=2 av en flervågsserie.** Ingen effektslutsats om premiss-passets verkan
  eller Sonnet-omställningen dras här — det är uttryckligen förbjudet och
  hör till orkestrerarens/Marcus efterföljande syntes.

## Slutsats i fem punkter (data, ingen effekt)

1. **Nämnaren för denna våg är ~6,3 prövbara påståenden per uppdrag** — i
   linje med baslinjens ~5,6, inte en storleksordning ifrån.
2. **Felraten i denna våg (6,25 % av avgjorda, 9,09 % med gränsfall) ligger
   högre än baslinjens (3,8 % / 5,8 %)** — redovisat som observation, inte
   som trend (n=2, olika vågor, samma pre-Sonnet-regim).
3. **Repetition är ett eget mönster:** 4 av 7 distinkta sakfel återanvändes
   oförändrade i 2–3 separata uppdrag samma dag — samma stale tal skickat
   vidare till flera syskonagenter utan omverifiering. Detta är precis
   T110-trådens klass B ("referens som skickas vidare utan att ha lästs"),
   nu räknat i stället för anekdotiskt.
4. **Hedging fungerade före sin egen mekanisering:** de två instanserna av
   "110/14"-felet var uttryckligen flaggade som ohärledd grovmätning i
   uppdragstexten, och båda mottagande agenter fann och rättade felet
   självständigt — noll skada nådde leveransen. Källmärkning tycks alltså inte
   bara vara en avgörbarhets-vinst (körning #1:s slutsats 5) utan i dessa två
   fall en direkt felfångst-vinst, om än på n=2.
5. **Denna körnings eget process visade samma felklass den mäter:** de tre
   granskande subagenternas sammanfattningsrader innehöll räkne-avvikelser mot
   sina egna detaljtabeller (upptäckt och rättat genom omräkning direkt ur
   tabellerna, inte genom att lita på sammanfattningen) — ett tredje,
   oberoende exempel (efter körning #1:s prövningsbokföring och
   T110-trådens egen huvudtals-avstämning) på att självrapporterade totaler
   är den svagaste länken i just den här sortens arbete.
