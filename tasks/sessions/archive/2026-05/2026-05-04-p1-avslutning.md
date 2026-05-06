# P1 Avslutning — Städning + nästa session-startkontext

> **Datum:** 2026-05-04
> **Föregående:** `tasks/sessions/archive/2026-05/2026-05-04-byggplan-revision-p1.md` (sessionsdokument, klar)
> **Avsedd användning:** En läsning av detta dokument räcker för att (1) committa P1, (2) starta P2 i ren context, (3) lyfta UNIVERSAL-lärdomar.

---

## Del 1 — P1-leveransstatus

**Stop-test enligt direktiv §6 P1: ✅ PASSERAT 2026-05-04.**

| Klunga | Beslut | Output |
|---|---|---|
| 1 | A4 (Fas B parallell-spår + 2 synk-gates) | §5 rad B uppdaterad |
| 1 | A1 (Fas 3.5 scenariobeslut, 4-rads trigger) | §5 rad 3.5 villkorad |
| 2 | A5 (9 adapter-metoder klassade, 0 EF deployas i Fas 2.5) | §5 rad 2.5 + 6 + E uppdaterade, 2 ADR-krav |
| 3 | A3 (Fas 6 strangler-fig sub-fördelat 6a→6e) | §5 rad 6 utökad till 5 sub-faser |
| 3 | A2 (Fas 5.5 = markera betalning via update-record) | §5 rad 5.5 uppdaterad, 11-punkts DoD, 1 ADR-krav |
| 3 | B1 (hybrid polling 60s + pull-to-refresh, Realtime till Fas E) | Inkluderat i 6d, 1 ADR-krav |
| 4 | B3 (Fas 5 selektiv förenkling, 4 [GA]-tillägg till Fas 7) | §5 rad 5 + 7 uppdaterade, 1 ADR-krav |
| 4 | B2 (Background Sync defer till Fas 8) | §5 ny Fas 8-rad, 1 ADR-krav |

**Totalt: 8 beslut, 7 berörda §5-rader (varav 1 ny), 9 ADR:er identifierade för P3.**

---

## Del 2 — Lessons-poster för `tasks/lessons.md`

Tre starka UNIVERSAL-kandidater från denna session. Alla är generiska och återanvändbara i framtida arbete (P-faser, andra projekt). Färdig-formaterade för inklippning.

### Post 1 — Sessionsdokument från första klunga [UNIVERSAL]

```markdown
## Arbetsflöde och process

### Sessionsdokument från första klunga vid flerstegs-Chat-arbete [UNIVERSAL]
> Datum: 2026-05-04 | Källa: P1-sessionen byggplan-revision

Vid flerstegs-Chat-arbete där varje steg matar nästa (P0/P1/P2/P3-faser, multi-klunga-beslutsarbete, gates med flera milstolpar): skapa sessionsdokument vid första leverans-bit, inte i slutet. Chat-only är fel form även när context window är stort — risken är inte tappade tokens i sessionen utan tappad spårbarhet vid sessionsslut, oförmåga att granska parallellt mellan turer, och Code kan inte konsumera Chat-historik direkt.

**Mönstret:** vid sessionsstart, efter kontext-läsning men före första leverans, föreslå arbetsfilen explicit. Två varianter:
- (a) Eget sessionsdokument om leveransen är multi-del — `tasks/sessions/YYYY-MM-DD-arbete.md`
- (b) Direktredigering av målfilen om leveransen är en enskild dokumentuppdatering

Kostnaden är 5 minuters Code-anrop vid sessionsstart. Vinsten är granskbarhet per klunga, recovery-säkerhet, och Code-konsumerbar leverans.

**Anti-mönster att undvika:** "Jag levererar i chatten och vi konsoliderar i slutet" — sista-steg-konsolideringen är då en single-point-of-failure.
```

### Post 2 — Scenariobeslut när indata saknas [UNIVERSAL]

```markdown
## Arbetsflöde och process

### Scenariobeslut när indata saknas [UNIVERSAL]
> Datum: 2026-05-04 | Källa: A1 i P1, ekar Sentry-DSN-mönstret från Fas A Gate A1

När ett beslut mår bra av indata som inte finns ännu — lås beslutskriterierna nu och defer:a själva valet till indata-punkten. Inte "vi tar det senare" (vag), inte "vi gissar nu" (ovetenskaplig). Skarpa trigger-kriterier som aktiveras av en namngiven framtida observation.

**Mönstret:**
1. Identifiera vilken indata som saknas och var den kommer från (vilken fas, vilket dokument).
2. Skriv 3-5 dimensions-rader med tröskelvärden för varje utfall.
3. Definiera binär trigger-regel ("om minst en av rad 2 eller rad 3 är JA → utfall X, annars utfall Y").
4. Lägg krav på indata-leveranspunkten ("P2 *måste* rapportera (a), (b), (c)").

**Två konkreta instanser i projektet:**
- Sentry-DSN i Fas A Gate A1 — beslutskriterier låsta, valet gjordes med faktisk DSN-info
- Fas 3.5 egen-fas-vs-integrerad i P1 A1 — beslutskriterier låsta, aktiveras av P2:s första `ACCESSIBILITY-CHECKLIST.md`-bedömning

**Anti-mönster:** "Vi får se" + ingen kriteriebeskrivning + ingen trigger-punkt = bara uppskjutet beslut, samma osäkerhet kvar.
```

### Post 3 — Beroendegraf före beslutsserier [UNIVERSAL]

```markdown
## Arbetsflöde och process

### Beroendegraf före beslutsserier [UNIVERSAL]
> Datum: 2026-05-04 | Källa: P1 Klunga 0-strukturering (8 beslut med korsberoenden)

Innan en serie beslut fattas (5+ beslut med inbördes beroenden): kartlägg hård vs mjuk koppling i en explicit graf. Hårda kopplingar = ett beslut kräver ett annat som indata. Mjuka kopplingar = ett beslut informerar ett annat men låser inte.

**Mönstret:**
1. Lista alla beslut som ska fattas.
2. För varje par av beslut (X, Y): finns det en koppling? Om ja, är den hård eller mjuk?
3. Identifiera om det finns en central beroende-nod (ett beslut som flera andra beror på).
4. Välj ordning: "fyra klungors-ordning" (lättviktigt först → nav → kedja → städning) ELLER "kritisk-väg-först" (nav först, sedan resten i valfri ordning).
5. Verifiera grafen mot källdokument innan beslut fattas — beroenden måste ha källspår, inte gissningar.

**Anti-mönster:** "Vi tar besluten i listordning" — det fungerar bara om besluten är oberoende, vilket de sällan är när det handlar om sekvens, scope eller sub-fas-allokering.

**Konkret instans:** P1:s 8 beslut hade A5 som central nod. Fyra-klungors-ordning över kritisk-väg-först eftersom A5 var energikrävande (förtjänade två lättare beslut före).
```

### Hur posterna landar i `tasks/lessons.md`

Tre poster, alla under sektionen **"Arbetsflöde och process"**, alla flaggade `[UNIVERSAL]` för lyft till `marcus-system/tasks/lessons.md` vid nästa veckosynk.

---

## Del 3 — Code-prompt för §5-applicering

Färdig prompt att klistra in i Code (kör efter att P1-sessionsdoket är committat). Code applicerar Del 6:s konsoliderade §5-tabell mot `tasks/byggplan-direktiv.md` §5.

```
LÄS först:
- ~/Repon/miranon-media-admin/tasks/sessions/archive/2026-05/2026-05-04-byggplan-revision-p1.md
  (P1-sessionsdok — Del 6 "Konsoliderad §5-uppdatering" är källan för denna uppgift)
- ~/Repon/miranon-media-admin/tasks/byggplan-direktiv.md
  (Målfilen — §5 är sektionen som ska uppdateras)

RAPPORTERA:
- Bekräfta att §5-tabellen i byggplan-direktiv.md har de 14 raderna som
  P1-sessionsdoks Del 6 utgår från
- Lista de 7 rader som ska uppdateras + 1 rad som ska läggas till (Fas 8)
- Flagga om någon befintlig rad har drift sedan P1-sessionen skrevs
  (t.ex. om någon annan session uppdaterat rader däremellan)

PLANERA:
- En str_replace per uppdaterad rad (7 anrop) + en str_replace för
  att lägga till Fas 8-raden (1 anrop) = 8 totalt
- Numreringsnoten under tabellen behöver eventuell justering om
  Fas 8 är ny (kontrollera fotnot-formuleringen)

IMPLEMENTERA:
- Applicera ändringar enligt P1-sessionsdoks Del 6
- Behåll exakt formattering (mellanslag, fet stil, fotnoter)
- Inga andra ändringar i byggplan-direktiv.md än §5

VERIFIERA:
- Diff mellan före och efter — endast §5-tabellen + ev. fotnot ändrad
- 15 rader i tabellen efter applicering (var 14, +1 ny Fas 8)
- Ingen rad raderad
- Markdown-syntax fortfarande giltig (visa renderad version
  i terminal eller IDE)

DOKUMENTERA + COMMITTA:
- Commit-message: "chore(byggplan): apply P1 §5-updates from session 2026-05-04

  Applies decisions A1-A5 + B1-B3 from P1 phase-sequence revision.
  Sources: tasks/sessions/archive/2026-05/2026-05-04-byggplan-revision-p1.md Del 6.
  
  Updated rows: 2.5, 3.5, 5, 5.5, 6, 7, B, E
  Added row: 8 (framtid - Background Sync defer-target)
  
  Stop-test §6 P1: passed.
  Next: P2 (stödspec-synk)."

- Pusha efter commit
- Säg till Marcus att han ska klicka "Update" i Claude.ai-projektet
  så Chat ärver den uppdaterade direktivfilen inför P2-sessionen
```

---

## Del 4 — P2 startkontext (briefing för nästa Chat-session)

Färdig prompt-mall att klistra in vid start av P2-sessionen. Säkerställer att P2 startar med rätt kontext utan att behöva läsa hela P1-sessionsdoket från början.

```
[P2-START-PROMPT — klistra in i ny Chat-session]

Hej. P1 är klar och committad. Nu kör vi P2 — Stödspec-synkning enligt
direktiv §6 P2. Code-uppgiften att applicera §5-uppdateringen är
genomförd.

Läs i denna ordning:
1. ~/Repon/marcus-system/CLAUDE.md
2. ~/Repon/miranon-media-admin/CLAUDE.md
3. ~/Repon/miranon-media-admin/tasks/lessons.md
4. ~/Repon/miranon-media-admin/tasks/sessions/archive/2026-05/2026-05-04-byggplan-revision-p1.md
   (P1-leveransen — främst Del 5 ADR-katalog, Del 6 §5-uppdatering, och Del 2 A1 trigger-kriterier)
5. ~/Repon/miranon-media-admin/tasks/byggplan-direktiv.md §6 P2
   (uppgiftsbeskrivningen)
6. ~/Repon/miranon-media-admin/docs/specs/SECURITY-SPEC.md
7. ~/Repon/miranon-media-admin/docs/specs/ACCESSIBILITY-CHECKLIST.md
8. ~/Repon/miranon-media-admin/docs/specs/STATE-STRATEGY.md

Mål: Uppdatera de stödspecs som är direkta beroenden för byggplanens
fasprompter. Filer enligt direktiv §6 P2.

Output: 4-5 uppdaterade stödspec-filer, plus ev. anteckningar i
sessionsdok om övriga specs som granskades och passerade utan drift.

Specifika P2-uppgifter ärvda från P1:

A. ACCESSIBILITY-CHECKLIST.md:
   Skriv om för React Aria + WCAG 2.2 AA. Detta är auktoritativt input
   för A1-scenariobeslutet (Fas 3.5 egen fas eller integrerad).
   *Måste rapportera* (a) timmar för omskrivningen, (b) ja/nej på
   test-infrastruktur-behov (axe-config + Playwright a11y-runner +
   fixture-mönster), (c) ja/nej på mönster-bibliotek-behov (kodexempel
   per React Aria-pattern). Trigger-tabellen i P1-sessionsdoks Del 2
   avgör utfallet.

B. SECURITY-SPEC.md:
   Införliva Fas A:s arkitekturmönster: operations-baserat API,
   corsHeadersFor(req), AuthContext|Response, INVARIANT round-trip,
   isOperationalError, structured JSON-loggning, requestId.

C. STATE-STRATEGY.md:
   Synka mot strangler-fig-ordningen i 07. Operations-baserat
   API-mönstret från Fas A M4 ska dokumenteras här så Fas 6:s
   sub-fas-prompter kan referera ett ställe.

D. Kontrollera kort (förväntas oförändrade): DESIGN-MANIFESTO,
   DESIGN-OPERATING-SYSTEM, DESIGN-SYSTEM-SPEC, KVALITETSDEFINITIONER-11,
   PERFORMANCE-BUDGET, URL-STATE-SPEC, ARIA-UPGRADE, FUTURE-COMPAT.

E. data-model.md — verifiera att den är källan för status-typer per dm-110.

Föreslå arbetsupplägg innan vi börjar — sannolikt en sessionsdok-fil
för P2 (samma mönster som P1). En lessons-post från P1 säger explicit:
"sessionsdokument från första klunga vid flerstegs-Chat-arbete".

Code är fri, P1 committad. Detta är Chat-arbete.
```

### Anmärkning om P2-omfattning

P2 är specifierat i direktiv §6 P2 som "1 session". Realistiskt är det 1,5–2 sessioner givet att (a) ACCESSIBILITY-CHECKLIST.md är trolig omskrivning, (b) SECURITY-SPEC.md ska införliva Fas A:s arkitekturmönster, och (c) STATE-STRATEGY.md ska synkas mot operations-API + strangler-fig. Var beredd att splitta P2 i 2 sessioner om scope växer — det är samma mönster som Fas A:s M1–M8 sekvensering.

---

## Del 5 — Sessionsavsluts-checklista

Konkreta åtgärder Marcus måste göra för att stänga P1-sessionen ordentligt. Följer projekt-CLAUDE.md "Sessionsavslut"-mönstret anpassat för Chat-arbete.

### Steg 1 — Code-prompt för commit av sessionsdokumentet

Färdig prompt att klistra in i Code. Kör **före** Steg 2 (Steg 2:s prompt förutsätter att sessionsdoket finns i repot).

```
LÄS först:
- ~/Repon/miranon-media-admin/CLAUDE.md
  (för att verifiera commit-stil och repo-konventioner)
- ~/Repon/miranon-media-admin/tasks/sessions/
  (för att verifiera att 2026-05-04-byggplan-revision-p1.md inte redan finns där —
   om filen redan finns: stoppa och rapportera till Marcus, gör inget mer)

RAPPORTERA:
- Bekräfta att working tree är ren (`git status` ger "nothing to commit")
- Bekräfta att filen finns på Marcus' lokala maskin på sökvägen
  ~/Downloads/2026-05-04-byggplan-revision-p1.md
  (eller motsvarande nedladdningskatalog — fråga Marcus om den ligger annanstans)
- Bekräfta att filen är 591 rader (`wc -l`) och börjar med "# Byggplan-revision — P1"
  (head -1 ska matcha)
- Lista vad som kommer committas: en (1) ny fil i tasks/sessions/

PLANERA:
- En `mv` från Downloads till tasks/sessions/
- En `git add` av den nya filen
- En `git commit` med message-mallen nedan
- En `git push`
- Ingen ändring i någon annan fil

IMPLEMENTERA:
- Flytta filen till tasks/sessions/archive/2026-05/2026-05-04-byggplan-revision-p1.md
- git add tasks/sessions/archive/2026-05/2026-05-04-byggplan-revision-p1.md
- git commit med följande message (kopiera ordagrant inkl. blankrader):

    docs(byggplan): add P1 session document — phase-sequence revision

    8 decisions across 4 klungor (A1-A5, B1-B3). All NEW and
    modified-scope phases in §5 have decision + design-note.
    9 ADRs identified for P3.

    Decisions summary:
    - A4: Fas B parallel-spår + 2 synk-gates
    - A1: Fas 3.5 scenariobeslut, 4-rads trigger-tabell
    - A5: 9 adapter-methods classified, 0 EF deploys in Fas 2.5
    - A3: Fas 6 strangler-fig sub-allocation 6a→6e
    - A2: Fas 5.5 = mark-registration-paid via update-record
    - B1: hybrid polling 60s + pull-to-refresh, Realtime to Fas E
    - B3: Fas 5 selective simplification, 4 [GA] additions to Fas 7
    - B2: Background Sync defer to Fas 8

    Stop-test §6 P1: passed.

    Next: apply Del 6 §5-updates to byggplan-direktiv.md
    (separate commit, see session doc Del 3 in p1-avslutning.md).

VERIFIERA:
- `git log -1` visar commit:en med rätt message
- `git status` visar ren working tree igen
- `git diff HEAD~1 HEAD --stat` visar exakt en (1) ny fil, 591 nya rader,
  noll borttagna rader, noll ändringar i andra filer
- Pusha till origin
- `git ls-remote origin HEAD` matchar lokal HEAD (push lyckades)

DOKUMENTERA:
- Inga ändringar i BUILD-LOG.md, CLAUDE.md, lessons.md, eller decisions/
  i denna commit (de hör till separata steg — se p1-avslutning.md Steg 3-4)
- Säg till Marcus: "Sessionsdoket committat och pushat. Redo för Steg 2
  (Code-prompt för §5-applicering, finns i p1-avslutning.md Del 3)."
```

### Steg 2 — Code-prompt för §5-applicering

Klistra in prompten från **Del 3** i Code. Den applicerar §5-uppdateringen mot `tasks/byggplan-direktiv.md`, committar och pushar. Förutsätter att Steg 1 är klart (sessionsdoket måste finnas i repot eftersom Del 3-prompten *läser* det som källa).

### Steg 3 — Code-prompt för lessons.md-uppdatering

Klistra in i Code efter Steg 2 är klart.

```
LÄS först:
- ~/Repon/miranon-media-admin/tasks/lessons.md
  (för att se nuvarande sektion-struktur och hitta "Arbetsflöde och process"-sektionen)
- ~/Repon/miranon-media-admin/tasks/sessions/archive/2026-05/2026-05-04-p1-avslutning.md Del 2
  (källan — tre färdig-formaterade lessons-poster i kodblock)

RAPPORTERA:
- Bekräfta att lessons.md har en sektion "## Arbetsflöde och process"
  (om den saknas: skapa den, men flagga till Marcus innan)
- Visa den exakta raden där posterna ska infogas (efter befintliga
  poster i sektionen, före nästa ##-rubrik)
- Lista de tre nya posterna som ska läggas till med deras rubrik:
  1. Sessionsdokument från första klunga vid flerstegs-Chat-arbete [UNIVERSAL]
  2. Scenariobeslut när indata saknas [UNIVERSAL]
  3. Beroendegraf före beslutsserier [UNIVERSAL]

PLANERA:
- En str_replace som lägger till de tre posterna i "Arbetsflöde och process"
- Posterna kopieras *exakt* från p1-avslutning.md Del 2 (utan markdown-fence-wrapparen ```)
- Behåll [UNIVERSAL]-flaggan synlig i varje post-rubrik
- Datum: 2026-05-04 i varje post

IMPLEMENTERA:
- Lägg till de tre posterna
- Inga andra ändringar i lessons.md

VERIFIERA:
- Ren markdown-syntax (rendera och granska)
- Tre nya poster synliga under "Arbetsflöde och process"
- [UNIVERSAL]-flaggan finns i alla tre rubriker (för kommande hub-synk)
- Inga andra sektioner berörda

DOKUMENTERA + COMMITTA:
- Commit-message:

    docs(lessons): add 3 UNIVERSAL lessons from P1 session

    - Sessionsdokument från första klunga vid flerstegs-Chat-arbete
    - Scenariobeslut när indata saknas
    - Beroendegraf före beslutsserier

    All flagged [UNIVERSAL] for lift to marcus-system at next sync.
    Source: tasks/sessions/archive/2026-05/2026-05-04-byggplan-revision-p1.md.

- Pusha
```

### Steg 4 — Code-prompt för todo.md-uppdatering

Klistra in i Code efter Steg 3 är klart.

```
LÄS först:
- ~/Repon/miranon-media-admin/tasks/todo.md
  (för att se nuvarande struktur — vilka kategorier, hur P0/P1 flaggades)

RAPPORTERA:
- Visa hur P0 markerades som klar (för att replikera mönstret för P1)
- Identifiera var P1 står i todo.md (sannolikt under "Pågående" eller "Nästa")
- Lista vad som ska ändras:
  - P1: markera som ✅ KLAR med datum 2026-05-04
  - Lägga till pekare till sessionsdoket
  - Lägg till P2 som nästa uppgift med pekare till
    p1-avslutning.md Del 4 för startkontext
  - Lägg till Code-uppgift för §5-applicering om den inte redan
    är genomförd vid tidpunkten för denna prompt

PLANERA:
- En till två str_replace beroende på todo.md-strukturen
- Ingen omstrukturering — behåll Marcus' format

IMPLEMENTERA + VERIFIERA + COMMITTA:
- Commit-message:

    chore(todo): mark P1 complete, add P2 as next

    P1 byggplan-revision (phase-sequence) completed 2026-05-04.
    See tasks/sessions/archive/2026-05/2026-05-04-byggplan-revision-p1.md.
    P2 startup context: see Del 4 in p1-avslutning.md.

- Pusha
```

### Steg 4.5 — Committa avslutningsdokumentet självt

Avslutningsdokumentet (`2026-05-04-p1-avslutning.md`, denna fil) ska också committas till repot — den är källa för Steg 3-4 lessons- och todo-prompterna och kommer att refereras från P2-startprompten i Del 4. Klistra in i Code efter Steg 4 är klart:

```
LÄS först:
- Bekräfta att 2026-05-04-p1-avslutning.md inte redan finns i tasks/sessions/

RAPPORTERA:
- Bekräfta att filen finns på Marcus' maskin (Downloads eller motsvarande)
- Bekräfta filstorlek (~14-15 kB, ~310-330 rader efter dessa redigeringar)

PLANERA:
- mv från Downloads till tasks/sessions/archive/2026-05/2026-05-04-p1-avslutning.md
- git add + commit + push

IMPLEMENTERA + VERIFIERA + COMMITTA:
- Commit-message:

    docs(byggplan): add P1 session-closure document

    Companion to 2026-05-04-byggplan-revision-p1.md.
    Contains: lessons-poster för lessons.md, Code-prompts för
    §5-applicering och uppföljning, startkontext för P2-sessionen,
    sessionsavsluts-checklista.

    Referenced by future P2-session via Del 4 startup prompt.

- Pusha
```

### Steg 5 — Klicka "Update" i Claude.ai-projektet

Synkar GitHub-repot till Chat-projektet så att P2-sessionen ärver den uppdaterade direktivfilen + sessionsdoket + avslutningsdoket + lessons-posterna.

### Steg 6 — Veckosynk till hubben (kan göras nu eller senare)

```bash
cd ~/Repon/marcus-system
# Säg till Code: "Synka universella lärdomar från alla projekt till hubben."
# Code läser de 3 nya [UNIVERSAL]-posterna från miranon-media-admin/tasks/lessons.md
# och kopierar till marcus-system/tasks/lessons.md.
```

### Steg 7 — Starta P2-session

I ny Chat-session: klistra in P2-startprompten från Del 4. Sessionen startar med ren context och rätt kontext samtidigt.

---

## Del 6 — Sammanfattning för framtida läsare

**Vad denna session levererade:** Slutgiltig fas-lista för byggplanen (uppdaterad §5-tabell, 15 rader inklusive ny Fas 8) + design-not per ny eller scope-ändrad fas + ADR-katalog (9 st) för P3 + 3 UNIVERSAL-lärdomar.

**Vad denna session inte gjorde:** Ändrade inte direktivfilen själv (det är Code-uppgift, se Del 3). Skrev inte byggplanen (det är P3). Uppdaterade inte stödspecs (det är P2).

**Vad nästa session ska göra:** P2 — stödspec-synkning enligt direktiv §6 P2. Specifikt: omskrivning av ACCESSIBILITY-CHECKLIST.md (som triggar A1-scenariobeslutet), uppdatering av SECURITY-SPEC.md (Fas A-mönster), synk av STATE-STRATEGY.md (operations-API + strangler-fig).

**Var den auktoritativa P1-trailen finns:** `tasks/sessions/archive/2026-05/2026-05-04-byggplan-revision-p1.md` — 591 rader, åtta delar + tre bilagor.

**Var den auktoritativa byggplan-strukturen finns (efter Code applicerat §5-uppdateringen):** `tasks/byggplan-direktiv.md` §5 — 15 rader, kommer matcha P1-sessionsdokets Del 6.
