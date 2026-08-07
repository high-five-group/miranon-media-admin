---
owner: marcus803
updated: 2026-08-03
review_by: 2026-10-31
status: stable
lifecycle: paused
---

# T110 — Går orkestrerarens fel att mekanisera bort?

> **Registrerad 2026-07-31 (S91, nittonde resumen) på Marcus fråga:** *"Har vi
> tillräckligt med empiri för att mekanisera bort orkestrerarens fel tror du?
> Det är en bra uppgift för agenter i nästa resume att titta på."*
>
> **Frågan är registrerad, inte besvarad.** Denna fil bär empirin och
> klassningen så att en utredning slipper rekonstruera dem — inte en föreslagen
> lösning. Trådens form väljs efter utforskning.

## Varför frågan uppstod

Sessionsdok S91 **Del 36.2** bokförde ett mönster som sedan upprepats:

> *"Felen uppstår i **orkestreringen**, inte i utförandet. Agenterna arbetar mot
> ett kontrakt med explicita AC och DoD och en grind som prövar dem.
> Orkestreraren arbetar mot sitt eget omdöme — den empiriskt svagaste mekanismen
> vi har, och den enda som saknar en grind."*

Under den nittonde resumen (2026-07-31) levererade **femton agenter**.
Orkestreraren gjorde **fem fel**, samtliga fångade av agenter och **noll av
Marcus**. Mönstret höll alltså en tredje gång.

## Empirin — cirka fjorton instanser över tre resumer

Källor: sessionsdok S91 **Del 35.4** (tre fel), **Del 36.2** (sex fel, kvällens
facit), **Del 38.6** (fem fel). Instanserna nedan är de som går att belägga ur
doken; listan är inte hävdad som uttömmande.

### Klass A — mätning med ett instrument som ser EN form men inte alla

| Instans | Vad instrumentet missade |
|---|---|
| `[UNIVERSAL]`-räkningen 59 mot verkliga **72** | grep såg rubrikraden; 13 poster (`L347`+) bär markören på egen rad under den feta titeln |
| Trådregistrets grovmätning: 110 rader / 14 `active` mot verkliga **109 / 13** | räknade tillstånds-orden var som helst på raden i stället för i tillståndskolumnen — registret nämner dem i löptext |

**Klassen är INTE orkestrerar-specifik — den är instrument-specifik.** Två
agenter gjorde samma fel samma dag: `git log --name-status` tappade **145 av
179** kort eftersom sökvägar med icke-ASCII citeras (`TASK-102`), och
`grep -l 'Deno\.'` klassade en fil på en **kommentar** (`TASK-103`). Båda
utfallen såg trovärdiga ut — `n=23` med rimlig fördelning i det första fallet.

**Det är klassens farlighet: ett mätfel som producerar ett trovärdigt resultat.**

### Klass B — en referens som skickas vidare utan att ha lästs

| Instans | Verkligheten |
|---|---|
| Uppdrag pekade ut en deny-smoke-testfil | `git log --all --diff-filter=A` över hela historiken: **noll träffar**, filen har aldrig funnits |
| *"nio grindar"* tillskrivet `CLAUDE.md` | Raden står i `.claude/agents/bygg-agent.md:55` — agenternas egen systemprompt, vilket förklarar tre oberoende rapporter |
| Ett SHA vars 33 sista tecken fylldes på ur ingenting | Vakten matchade noll objekt ⇒ **fail-open**, rapporterade "klart" utan att ha väntat (Del 35.4) |
| `TASK-98`-kortet: self-testen *"rad 623"* | Faktisk rad **674** |
| `lessons-hub-sync`-skillen: *"hub-CLAUDE.md rad 507-526"* | Filen är **196 rader** och saknar rubriken; den flyttades i `2a4a8c7` |

### Klass C — ofullständig läsning av ett kontrakt

Stängningen 2026-07-30 läste kortens **AC** (noll) och drog slutsatsen att inget
återstod. **DoD-blocket lästes aldrig** — och två punkter per kort var *Marcus
design-review*. Fångat av `TASK-90`:s grind, som fällde sin egen orkestrerare
(Del 36.1). Samma klass: *"tre äkta fel"* rapporterat 2026-07-31 där agentens
rapport sade **fem**.

### Klass D — slutsats generaliserad ur för få observationer

Påståendet att `autoMergeRequest` alltid är `null` under en merge queue landade i
`CLAUDE.md` ur **två** observationer som mätte fel sak — den ena togs post-merge,
då fältet nollas oavsett. Motbevisad av `#475`, PR:en som bar texten (Del 35.4).

## Det strukturella skälet till att grinden saknas

**Grindarna kör på commits. Orkestrerarens fel sitter i uppdragstexten, som
aldrig committas** — den går direkt till en agent och försvinner med sessionen.
En grind som ska fånga dem måste därför sitta i **uppdrags-ögonblicket**, inte i
landnings-ögonblicket. Det är en annan mekanism-klass än allt som byggts hittills.

Närmast liggande befintliga familj är `T108`:s hooks (`Stop`/`SubagentStop`), men
den bär ett känt hinder: **hooks kan inte distribueras via pluginet** (de tappas
tyst), så formen måste bo per repo och driver isär över tid.

## ⚠️ Empirins systematiska lucka — läs denna före något byggs

**Vi mäter fångade fel, inte begångna.**

Samtliga fem fel under nittonde resumen fångades av agenter som följde **regeln**
i sitt uppdrag i stället för **talet** orkestreraren gav dem. Hur många fel som
INTE fångades är omätt. Vi vet inte heller om fångsterna var tillförlitliga eller
lyckosamma — hub-lyftets agent räddade 13 poster just för att uppdraget råkade
formulera regeln före talet.

Detta är samma svaghet all incidentstatistik bär: **nämnaren är okänd.** En
mekanism designad mot en okänd nämnare riskerar att optimera fel sak.

Dessutom: n ≈ 14, från **en** orkestrerare i **en** session över tre resumer.
Det är inte oberoende data.

## Vad en utredning bör avgöra

1. **Är klassningen ovan rätt?** Den är gjord av den som begick felen — det är
   precis den granskning som empiriskt är svagast. Pröva den mot doken.
2. **Går nämnaren att uppskatta?** Finns en väg att mäta begångna fel, inte bara
   fångade? Utan den kan ingen effektsiffra hävdas.
3. **Klass B ser nästan trivialt mekaniserbar ut** — en pre-flight som validerar
   varje fil-, rad- och SHA-referens i ett uppdrag mot disk **innan** agenten
   spawnas. Håller det vid granskning, eller finns ett hinder?
4. **Klass A kräver korsvalidering av mätningar** (två oberoende metoder innan
   ett tal skickas vidare). Är det görbart för specifika mätklasser, eller blir
   det en regel utan mekanism — den form `L328` visade inte efterlevs?
5. **Klass C och D är omdömesfel.** Är de mekaniserbara alls, eller ska de
   hanteras av kontrakts-design i stället?
6. **Vad kostar mekanismen?** En pre-flight på varje agent-spawn har en
   latenskostnad som ingen mätt.

## Släktskap

`T108` (hook-familjen — närmaste mekanism-klass, och dess distributionshinder) ·
`ADR-083` (prosa som påstår mekanism — klass B är dess syskon) ·
`TASK-90` (stängnings-grinden, den enda mekanism som hittills fällt
orkestreraren) · `L328` (en regel utan mekanism efterlevs inte).

## Extern prövning (2026-07-31)

> Utförd av en granskare som inte skrev klassningen, på uppdragets uttryckliga
> premiss att den ska **prövas, inte ärvas**. Metod: de tre källsektionerna
> (Del 35.4, 36.2, 38.6) lästa i sin helhet, och varje påstående som gick att
> mäta om har mätts om mot disk. Ingen mekanism byggd — Marcus beslutar.

### Vad som mättes om, och höll

| Trådens påstående | Oberoende mätning | Utfall |
|---|---|---|
| `[UNIVERSAL]` 59 mot 72 | rubrikrads-grep över `L284–L359` → **59** · per-post-räkning oavsett radform → **72** av 76 poster | **Exakt reproducerad, båda talen.** Och blindheten är värre än exemplet: av de 13 räddade bär bara **3** ren egen-rad-backtickform (`L347` `L353` `L355`) — markören har fler former än två |
| Skill-pekare till rad 507–526 i en 196-radersfil | `wc -l` hub-`CLAUDE.md` | **196** — stämmer |
| `TASK-98`-kortet *"rad 623"* | kortfilen på disk | Kortet bär *"rad 623"* — och kortet är en **committad** artefakt; se tes-prövningen |
| Stängnings-grinden som fällt orkestreraren | `scripts/check-backlog-closure.sh` | Finns — och är **commit-sidig**; se tes-prövningen |
| Bokföringsfelets mekanism | `backlog/config.yml` rad 13 | `check_active_branches: true` — klassen har redan en partiell mekanism |

**Empirin är äkta.** Där den gick att mäta om håller den, siffra för siffra.
Bokföringen KRING den gör det inte — vilket är prövningens första fynd.

### 1. Klassindelningen: användbar mnemonik, ingen partition

Avstämningen instans ↔ klass ↔ källa går inte ihop åt något håll:

| # | Instans | I källsektionerna? | Trådens klass |
|---|---|---|---|
| 1 | Påhittat SHA → vakt fail-open | 35.4:1 / 36.2:1 | B |
| 2 | `autoMergeRequest`-regeln | 35.4:2 / 36.2:2 | D |
| 3 | Nummerkollisionen (uppskjuten bokföring) | 35.4:3 / 36.2:3 | **oklassad** |
| 4 | Grind körd röd, committad utan gren på exitkoden | 36.2:4 | **oklassad** |
| 5 | Stängning utan DoD-läsning | 36.2:5 | C |
| 6 | Del 34-påståendet — sant när det skrevs, inte när det lästes | 36.2:6 | **oklassad** |
| 7 | Deny-smoke-fil som aldrig funnits | 38.6:1 | B |
| 8 | `[UNIVERSAL]` 59 mot 72 | 38.6:2 | A |
| 9 | *"Tre äkta fel"* var fem | 38.6:3 | C |
| 10 | Trådregistret 110/14 mot 109/13 | **nej** | A |
| 11 | *"Nio grindar"* tillskrivet `CLAUDE.md` | **nej** | B |
| 12 | `TASK-98`-kortet *"rad 623"* | **nej** | B |
| 13 | Skill-pekaren *"rad 507–526"* | **nej** | B |

Tre fynd:

1. **Tre belagda instanser är oklassade** (#3, #4, #6) — och ingen av de fyra
   klasserna rymmer dem. Bokföringsfel av delat tillstånd, oläst exitkod och
   temporal ogiltighet är egna mekanismer. En taxonomi som inte täcker sitt
   eget källmaterial retrodiktivt är gruppering, inte partition.
2. **Fyra klassade instanser saknar källa i de tre utpekade sektionerna**
   (#10–#13). De är sannolikt äkta — #12 och #13 verifierade här mot disk —
   men trådens käll-rad täcker dem inte. Det är i miniatyr klass B:s eget
   mönster, i artefakten om klass B.
3. **Huvudtalen reconcilerar inte.** Belagda unika instanser: **13** — *"cirka
   fjorton"* håller inom sin tilde men går inte att härleda ur någon delmängd.
   Skarpare: trådens ingress säger **fem** fel nittonde resumen, Del 38.6:s
   rubrik säger **tre**. Talen möts endast om #12/#13 räknas till nittonde
   resumen, vilket inget dok säger explicit.

Klasserna är inte heller ömsesidigt uteslutande: #9 (*"en rapport i handen,
misläst"*) passar B:s definition minst lika väl som C:s, och #2 är samtidigt
ett A-fel (post-merge-avläsningen var ett instrument som såg fel form).
Klassningen skär efter **felets psykologi**. För mekaniserings-frågan är det
fel snitt — skär efter **vilken grind som skulle ha fällt**:

| Omklassning | Instanser | Grind-yta |
|---|---|---|
| **I. Oläst källa i handen** — sanningen fanns i en redan tillgänglig artefakt (fil, rapport, hjälptext, exitkod, DoD-block) och lästes inte eller lästes fel | #1 #4 #5 #7 #9 #11 #12 #13 | Deterministiskt prövbar: referens-mot-disk, kvitto-mot-exitkod, strukturerade returformat |
| **II. Instrumentblindhet** — ärlig mätning, instrumentet såg en delmängd | #8 #10 | Endast per återkommande mätklass med dedikerat skript (jfr `check:docs` som räknar sina egna grindar); generell korsmätningsregel är `L328`-klass |
| **III. Inducerad regel** — sann observation generaliserad bortom sitt giltighetsområde, i antal (#2) eller i tid (#6) | #2 #6 | Ingen grind — kontraktsdesign: proveniens + giltighetsvillkor obligatoriska när en regel landar i styrande prosa |
| **IV. Delat tillstånd utan synkron bokföring** | #3 | Redan delvis mekaniserad (`TASK-93`); resten är konvention |

Notera att tre av fyra omklasser **redan har påbörjade mekanismer** (`TASK-90`
för #5, `TASK-93` för #3, `autoMergeRequest`-tabellen som rättad prosa för #2).
Mekanisering har hittills lyckats **per skarpt definierad felinstans**, aldrig
som generell vakt — det är ett empiriskt argument i sig.

### 2. Nämnaren: inte enhetligt okänd — olika mätbar per klass

Trådens varning håller: fångade fel ger existensbevis och kostnadsdata, aldrig
rater, och inget effektpåstående får byggas på dem. Men prövningen skärper den
i en riktning tråden missar: **nämnaren är inte en, den är fyra.**

- **Klass I:s nämnare är väldefinierad och ändligt uppräknelig:** antalet
  verifierbara referenser (fil, rad, SHA, tal, citat) i samtliga
  uppdragstexter. Den är inte omätbar — den är **ologgad**. Och
  uppdragstexterna finns redan: orkestrerarens transcript-JSONL bär dem
  (samma källa `T111`-passet läste `usage` ur). En retrospektiv revision av
  EN resumes samtliga uppdrag är görbar i dag utan någon ny mekanism:
  extrahera uppdragen, räkna referenserna (nämnare), pröva var och en mot
  disk (täljare). Det ger den första äkta felfrekvensen.
- **Fångst-sensitiviteten** skattas med två oberoende detektorer
  (capture-recapture): agenterna är detektor 1, en post-hoc-revisionsagent
  detektor 2, överlappet ger Lincoln-Petersen-skattningen av det ofångade.
- **Seeding** (planterade kända fel) mäter sensitivitet direkt men **avråds i
  uppdragskanalen**: en orkestrerare som medvetet ljuger i uppdrag förgiftar
  exakt den kanal mekanismen ska skydda. Görs den alls: öppet deklarerad,
  utanför skarpa uppdrag.
- **Klass II–III:s nämnare förblir genuint suddig** ("antal mätningar",
  "antal generaliseringar" saknar naturlig enhet) — därför ska effektanspråk
  begränsas till klass I även efter att loggen finns.
- **n = 1 kvarstår och är det hårdaste taket:** en orkestrerare, en session.
  Mönstret *"felen sitter i orkestreringen"* är tre gånger bokfört men noll
  gånger oberoende — det ska mätas om över minst en session till innan något
  dyrt byggs på det.

### 3. Strukturella tesen: håller till hälften — och slutsatsen överlever

*"Grindarna kör på commits men orkestrerarens fel sitter i uppdragstexten som
aldrig committas."* Prövad mot de tretton: **fem satt i committade
artefakter** — #2 (`CLAUDE.md`), #5 (kortens statusändringar), #6
(sessionsdoket), #12 (kortfilen), #13 (skill-filen i hubben). Och den enda
mekanism som hittills fällt orkestreraren (`TASK-90`) är **commit-sidig**.
Tesen som diagnos av hela felmängden är alltså för stark.

Det som överlever är viktigare: **luckorna är två, inte en.**

1. **Committad prosa grindas på form, inte på fakta.** #2, #6, #12, #13
   passerade alla sina grindar eftersom ingen grind prövar *påståenden*.
   Repo-precedenten finns redan i miniatyr — listparitets-grinden och
   `check:docs`-mönstret prövar prosa mekaniskt mot verklighet — och
   generaliseras **per påstående-klass**, aldrig som universalgrind.
2. **Uppdrags-ögonblicket saknar yta helt.** Här håller tesen fullt ut, och
   här sitter de fel som är dyrast (#7 kostade en diagnosrunda, #1 gjorde en
   vakt fail-open).

**Principskiss för uppdrags-grinden** (byggs ej nu):

- **Källkrav i uppdragsformatet** — varje fil-/rad-/SHA-/tal-påstående bär
  kommandot som producerade det, annars märks det `HYPOTES`. Kontraktsdesign,
  ingen mekanism; träffar klass III på köpet.
- **Agent-sidigt premiss-pass** — mottagarens obligatoriska FÖRSTA handling:
  pröva varje referens i uppdraget mot disk; avvikelse → stanna och
  rapportera strukturerat. Detta mekaniserar exakt det beteende som stod för
  samtliga agent-fångster (*"följde regeln i stället för talet"*), och
  embryot finns redan i agent-kontraktet (*"avviker det faktiska tillståndet
  från vad uppdraget antog: stanna och flagga"*) — steget är från reaktiv
  regel till obligatoriskt pass. Formen bor i `.claude/agents/bygg-agent.md`
  som redan lever per repo: **`T108`:s distributionshinder gäller inte här.**
- **Uppdragslogg per spawn** — uppdraget skrivs till fil och blir artefakt:
  revisionsbart, nämnarbärande, och på sikt grindbart. Retrospektivt räcker
  transcript-JSONL redan i dag.
- **Kostnaden** (trådens fråga 6) landar i agentens tid, parallellt — inte i
  orkestrerarens latens. Men den är **omätt** och ska mätas i första skarpa
  användning, inte antas.

### 4. Slutsats och rekommendation

**Empirin räcker för EN smal mekanism och EN mätåtgärd. Den räcker inte för
mer, och det den inte räcker till ska inte byggas.**

| Vad | Dom | Grund |
|---|---|---|
| Agent-sidigt premiss-pass + källkrav i uppdragsformatet (klass I) | **JA NU** | 8 av 13 instanser; deterministisk; nära nollkostnad; distributionshindret gäller inte; existensbevis räcker för billiga deterministiska kontroller — nämnarkravet gäller *effektpåståenden*, inte dem |
| Retrospektiv uppdrags-revision av en resume ur transcript-JSONL | **JA NU** | Kräver ingen mekanism; ger första äkta felfrekvensen + capture-recapture-baslinje; förutsättning för varje framtida effektanspråk |
| Generell korsmätningsregel (klass II) | **NEJ** | Regel utan mekanism — `L328`-klassen; mekaniseras endast per återkommande mätklass när en sådan identifierats |
| Hook-baserad orkestrerar-grind (`T108`-familjen) | **NEJ** | Fel yta (landning, inte uppdrag) + känt distributionshinder |
| Effektpåståenden, alla slag | **NEJ** | Nämnaren omätt tills loggen/revisionen finns; n = 1 orkestrerare, 1 session |
| Klass III–IV | **Ingen ny mekanism** | III är kontraktsdesign (källkravet täcker den); IV har redan `TASK-93` + konvention |

**Samlas först, i ordning:** (1) uppdragslogg per spawn — gör klass I:s
nämnare mätbar i stället för skattbar; (2) revisionen ovan; (3) kostnadsmätning
av premiss-passet i första skarpa användning; (4) minst en session till innan
mönstret behandlas som stabilt.

**Prövningens facit i en mening:** empirins *data* höll för extern ommätning
siffra för siffra, men dess *bokföring* (huvudtal, källhänvisningar,
klasstäckning) gjorde det inte — och det är själv den starkaste illustrationen
av tesen: även artefakten om orkestrerarens fel bär orkestrerarens felklasser,
och det som fällde dem var en extern läsning mot disk, inte självgranskning.

## Implementation (2026-08-01) — prövningens två JA NU landade

> Marcus GO 2026-08-01. Byggt: exakt det § Extern prövning dömde att empirin
> räcker för — inget ur NEJ-kolumnen. Beslut: `ADR-086`.

1. **Agent-sidigt premiss-pass + källkrav** — `.claude/agents/bygg-agent.md`
   bär nu ett obligatoriskt pass (§ Premiss-pass): varje verifierbar premiss i
   uppdraget prövas mot disk före design, `git fetch` ingår, divergens
   rapporteras i stället för att byggas på, och obelagda påståenden behandlas
   som HYPOTES. Slutrapporten bär passets utfall obligatoriskt. Formen bor per
   repo — `T108`:s distributionshinder gäller inte.
2. **Mätåtgärden som extraktion, inte ny logg** — `scripts/uppdragsrevision.mjs`
   (`npm run revision:uppdrag`) drar en sessions samtliga Agent-spawns med full
   uppdragstext ur transcript-JSONL. Prövningens premiss verifierad mot disk
   före bygget: spawn-loggen (`agent-spawn-log.sh`) bär enbart metadata, aldrig
   prompten; transcripten bär allt. Skriptet räknar medvetet INTE referenser —
   det vore klass A-instrumentblindhet i mätinstrumentet. Provkörning mot den
   levande orkestrerar-sessionen (`fd0eef00`, ögonblicksbild 2026-08-01):
   **31 uppdrag** (bygg-agent 26 · general-purpose 3 · claude-code-guide 1 ·
   research-pass 1), 0 sidechain-exkluderade, 1 062 rader, 0 trasiga.
   Nämnaren är därmed extraherbar — själva revisionen (räkna referenser, pröva
   mot disk) är beställbar som eget arbete och är INTE utförd här.
3. **Kostnadsmätningens första punkt** (prövningens samlingspunkt 3): denna
   landnings eget premiss-pass kostade ~7 verktygsanrop och fångade en skarp
   divergens — bygg-worktreen var bakom `main` och saknade § Extern prövning
   tills `git fetch` hämtade den. En observation, lokal; ingen rat hävdas.

Kvar ur prövningens ordning: (2) revisionen av en hel resume, (4) minst en
session till innan mönstret behandlas som stabilt. Effektpåståenden förblir
förbjudna tills båda finns.

## Första uppdragsrevisionen (2026-08-01) — nämnaren mätt

> Körd med det landade instrumentet mot session `fd0eef00` (S91:s tjugonde
> resume) av extern revisor-agent; rapporten landad av orkestreraren vid
> session-limit. Supersederar PAUSLÄGE-punkt 3 (tjugonde pausen) — revisionen
> behöver INTE köras om; detta är dess resultat.

**Korpus:** 34 uppdrag (28 bygg · 4 general-purpose · 1 guide · 1 research),
1 132 rader, 0 trasiga. **192 prövbara faktapåståenden** (~5,6/uppdrag);
**64 % källmärkta** (baslinje FÖRE ADR-086-kravet). Prövning i praktiken
census: 156 avgjorda, 11 oprövbara (ögonblickstillstånd), 25 oprövade
(externa käll-citat + lågriskdetaljer).

**Utfall: 6 hårda fel (3,8 % av avgjorda), 3 gränsfall (5,8 % med dem).**
Alla sex i bygg-agent-uppdrag (6/28 uppdrag = 21 % bar ≥1 fel):
"arton Paushistorik-rubriker" (17) · "natten gick sönder två gånger" (EN
cancelled run) · "ci.yml rad 897" (varningen står ~961) · "14 cachade
versioner" (13 vid mättillfället) · "i går" om volym-proceduren (samma dag) ·
"första skarpa natten grön run 30683902551" (run-nivå failure, jobb-nivå
success). Gränsfall: TanStack "enbart patch" (query var minor) ·
"konsolideringssteget i #506" (landade i hubben `fb01767`) · instrument-
referens före landning.

**Kalibrering:** 2 av 4 kända fel fanns i spawn-korpusen — båda återfanns.
De två övriga begicks i andra artefakter (Del-texter/rapporter) —
**instrumentets täckning är uppdragstexterna, inte orkestrerarens hela
produktion**; mätbar täckningsgräns för ADR-086. Revisorns två egna
preliminära "fynd" föll vid prövning (kö-commit-tid ≠ `mergedAt`) och bokförs
öppet: revisorns första intryck är också en hypotes.

**Slutsats i fem punkter (revisorns, nära verbatim):**

1. Nämnaren är ~6 prövbara påståenden per uppdrag — en storleksordning de 13
   kända fångade felen aldrig visade.
2. Felraten i uppdragstexter: ~ett fel per femte–sjätte uppdrag, inte ett per
   uppdrag.
3. Felen koncentreras HELT till räknade tal och tidsord; fil-adresser,
   radnummer och SHA:n gick 0 fel på ~60 prövade — orkestrerarens adresser
   håller, dess huvudräkning gör det inte.
4. Revisionen fann 4 nya hårda fel + 3 gränsfall som ingen tidigare mekanism
   fångat — mätåtgärden betalade sig vid första körningen.
5. Källmärkning hindrar inte fel, men gjorde varje fel avgörbart på under en
   minut med källan i hand — exakt ADR-086:s poäng. Effektpåståenden om
   premiss-passet förblir förbjudna tills revision n≥2 (post-ADR-086-session).

## Andra uppdragsrevisionen (2026-08-02) — n=2, fortfarande pre-Sonnet

> Körd mot sessionerna `f1ff4bcd…` (artonde resumen) + `ae112ab2…` (nittonde
> resumen). Rapport: `docs/research/uppdragsrevision-korning-2-2026-08-02.md`,
> **OLANDAD vid denna landning** — verifierat 2026-08-02 via `gh pr view 573`
> (`state: OPEN`) och läst direkt ur grenen `docs/uppdragsrevision-korning-2-t110-t113`
> med `git show`, inte via `main`.

**Korpus:** 30 uppdrag (26 bygg-agent · 3 research-pass · 1 claude-code-guide),
3 004 rader, 0 trasiga. **188 prövbara påståenden** (~6,3/uppdrag); **56,9 %
källmärkta**. **11 hårda fel (6,25 % av 176 avgjorda), 5 gränsfall (9,09 %
med dem).**

| Mätvärde | Körning #1 (baslinje) | Körning #2 (denna) |
|---|---:|---:|
| Uppdrag | 34 | 30 |
| Hårda fel | 6 (3,8 %) | 11 (6,25 %) |
| Hårda fel + gränsfall | 9 (5,8 %) | 16 (9,09 %) |
| Källmärkning | 64 % | 56,9 % |
| Modell | pre-Sonnet | pre-Sonnet (SAMMA regim) |

**Ingen effektslutsats dras.** Rapporten är uttrycklig: båda körningarna
föregår Sonnet-omställningen (samtliga 30 Agent-anrop `modell: null`) — n=2
här mäter bakgrundsvarians inom SAMMA pre-Sonnet-regim, inte ett före/efter.
`T113`:s Sonnet-jämförelse väntar fortfarande på sin FÖRSTA datapunkt.
**7 distinkta sakfel bakom de 11 instanserna**, varav 4 upprepades oförändrat
i 2–3 uppdrag samma dag (repetitions-mönstret är klass B, nu räknat i stället
för anekdotiskt) — inklusive "nio grindar" (rätt tal: tio) som visar sig ha
upprepats **tre** gånger samma dag, mer än den enskilda instans denna tråd
ursprungligen bokförde.

## Nya instanser — S91:s tjugoandra resume (2026-08-02)

Fångade under detta synteskorts eget uppdrag. (i)–(iii) är orkestrerar-empiri
(märkta som sådan i uppdragstexten); (iv) fångades av mottagaren via
premiss-passet mot SAMMA uppdrag.

- **(i) Rad-referens fel mot fel fil.** Ett tidigare uppdrag i vågen angav
  *"sessionsdok rad 813–817"* — raderna bor i restlistan, inte sessionsdoket.
  Fångat av mottagande agents (beslutsunderlags-agenten) premiss-pass.
  Verifierat mot `tasks/sessions/2026-07-26-session-91.md:8130`, som bokför
  fyndet i klartext: *"…klass B-fel fångat av mottagaren per ADR-086; andra
  mätpunkten i följd där ett premiss-pass fäller en orkestrerar-referens."*
  Klass B.
- **(ii) Hypotes om flera öppna Done-kort, falsifierad genom mätning.**
  Orkestrerarens hypotes *"flera av sex Done-kort öppna i kroppen"* höll inte:
  restlista-agenten mätte `TASK-56`/`88`/`93`/`95`/`97`/`113` mot
  `tasks/s91-restlistan.md` — endast `TASK-88` hade en egen kroppsrad,
  `TASK-113` fanns inte i filen alls (verifierat: rad 38 säger uttryckligen
  *"bara **`TASK-88`** hade en"*, och ingen träff på `TASK-113` utanför
  loggraderna). Klass D (slutsats/hypotes ur för få observationer,
  självfalsifierad innan den byggdes på).
- **(iii) Stängningsbatch-agenten dead-parkade på egen bakgrundsgrind.**
  Bokförd i `T112` (§ Mätt, ny instans 2026-08-02) i stället för här — kortets
  form passar bättre (T112 äger exakt denna vakt-klass).
- **(iv) SJÄLVFÅNGAD, denna landning: en tvåstegs källkedja inom SAMMA
  uppdrag.** Detta synteskorts ursprungstext hävdade *"samtliga [åtta PR:er]
  landade first-pass … noll nya TASK-115-instanser under hela vågen"*.
  Falskt på två axlar: (a) 2 av 8 PR:er (`#569`, `#574`) var fortfarande
  `OPEN`, inte landade, vid verifieringstillfället; (b) en åttonde
  G0-transient-instans inträffade (PR `#572`, se `TASK-115` instans 8 +
  `T113` § Mätpunkt 2 axel 3). Orkestreraren självrättade (b) i en
  uppföljande korrigering SAMMA dag — men korrigeringens EGEN premiss
  (*"task-115-kortet är Done"*) var i sin tur felaktig: verifierat via
  `npx backlog task 115 --plain` → `Status: ○ To Do`, inte `Done`. Fångat av
  mottagarens premiss-pass mot korrigeringen, innan kortet byggdes vidare på
  det falska antagandet (instansen lades i stället i kortets öppna
  instansregister). **Klass B, dubbel instans i en enda kedja:** en
  korrigering av ett klass B-fel bar själv ett nytt klass B-fel — samma
  mönster § Extern prövning redan dokumenterade (*"även artefakten om
  orkestrerarens fel bär orkestrerarens felklasser"*), nu observerat i en
  korrigering snarare än i originaluppdraget.

## Ny instans — S96:s andra resume (2026-08-03): klass C på ett SKILL-kontrakt

**Detta är klassens första instans där det brustna kontraktet är committat,
versionerat och läsbart hela tiden** — och den motsäger delvis § Det
strukturella skälet till att grinden saknas.

### Vad som hände

`session-resume` kördes på Marcus order. Skillens procedur har sex steg.
**Steg 6 — tillstånds-återställningen — utfördes aldrig.** Sessionen stod
kvar `lifecycle: paused` medan tre PR:er landade i den (`#672`, hub `#16`,
plus dev-servern startad). Dessutom hoppades tre av LÄS-fasens steg över:
`lessons.md`, `docs/BUILD-LOG.md` och `docs/byggplan.md`.

Orkestreraren rapporterade själv i sin första transparens-rapport att
återställningen skulle göras "som första skrivning när du kvitterat" — och
gled sedan rakt in i nästa uppgift utan att göra det. **Formen var alltså
känd, uttalad och ändå ej utförd.**

**Fångad av Marcus:** *"har du gjort tillstånds-flipp och standardproceduren
för session-resume?"* Inte av orkestreraren, inte av någon grind.

### Varför den utvidgar klassen

Klass C har hittills mätts på kontrakt som **aldrig committas** — DoD-block i
en stängning, påståenden i en uppdragstext. Kortets strukturella tes bygger
på just det: *"Grindarna kör på commits. Orkestrerarens fel sitter i
uppdragstexten, som aldrig committas … En grind som ska fånga dem måste
därför sitta i uppdrags-ögonblicket."*

Den här instansen har inte den egenskapen. `session-resume`s SKILL.md är
distribuerad via pluginet, versionerad (1.26.0 vid tillfället) och läsbar i
sin helhet när som helst. **Kontraktets otillgänglighet var alltså inte
orsaken.** Det som brast var att procedurens steg aldrig prövades mot en
checklista före leverans — ett omdömesfel i utförandet, inte en
åtkomstbegränsning.

Det skärper § Vad en utredning bör avgöra punkt 5 (*"Är klass C och D
mekaniserbara alls?"*): för DENNA underform finns kontraktet i maskinläsbar
form på disk, vilket gör en do-confirm-grind billigare att tänka sig än
kortet hittills antagit. Ingen sådan grind föreslås här — observationen
registreras, den byggs inte.

### Vad som INTE är fyndet

Att `check-lifecycle.sh` var **grön** genom hela förloppet är inget fynd.
Grinden prövar konsistens mellan frontmatter-fältet och kropps-rubriken, och
`paused` + `## PAUSLÄGE`-rubrik är ett giltigt par. Trådregistrets egen text
säger redan rakt ut att detta är avsiktligt: *"Ingen av dem prövar om en rads
INNEHÅLL är sant; det bärs av kort och granskning, aldrig av en grind."*

Orkestreraren framställde först grindens gröna status som en obehaglig
upptäckt och knöt den till `T116`:s öppna klassfråga. **Båda leden var fel**
— grinden gjorde precis vad den är byggd för, och `T116`:s fråga (*vilka
interaktiva loopar kör vi genom landnings-maskineriet av vana?*) handlar om
arbetsform mot maskineri, inte om vad en grind kan verifiera. Marcus fällde
hopkopplingen: *"Om du säger att T116 täcker det problemet också så behövs ju
ingen ny tråd?"* Rättelsen ledde hit, till rätt hemvist.

**Två egna fel i EN observation:** en falsk klass-hopkoppling och en
felaktig framställning av en grinds syfte — bokförda i samma anda som
§ Extern prövning redan noterat, att även artefakten om orkestrerarens fel
bär orkestrerarens felklasser.

### Övriga instanser samma pass (ej klass C)

- **Rörde huvudkatalogen tre gånger** trots att S93 ägde den (ADR-090) — två
  `merge --ff-only` och en gren skapad där. Rena träd, rena fast-forwards,
  ingen skada; fel form, inte fel utfall.
- **Läste `mergeStateStatus: UNKNOWN` som ett verkligt tillstånd** på
  hub-`#16` och rapporterade det — PR:en var redan `MERGED` sedan flera
  minuter. **Klass A** (instrument som ser en form men inte alla) och exakt
  den fälla `CLAUDE.md` § Landning varnar för: *vakt-event är väckarklocka,
  aldrig fakta*.

## Migrerat ur indexraden (`TASK-157.2`, 2026-08-07)

> Ordagrann text som tidigare bodde i `tasks/threads/README.md`s Titel-
> och/eller Ingång-kolumn för denna tråd, flyttad hit av registrets
> tunna radform-migration (ADR-098). Inget härunder är omskrivet —
> emfas-markörernas STIL (*...* vs *...*) normaliseras separat av
> `npx markdownlint-cli2 --fix` mot filens egen etablerade MD049-stil,
> inte av denna migration.

**Titel (fullständig, ursprunglig):**
**Går orkestrerarens fel att mekanisera bort?** Registrerad 2026-07-31 (S91, nittonde resumen) på Marcus fråga. **Mönstret är bokfört tre gånger** (Del 35.4, 36.2, 38.6): felen uppstår i ORKESTRERINGEN, inte i utförandet — agenterna arbetar mot AC/DoD med en grind som prövar dem, orkestreraren mot sitt eget omdöme, den enda yta som saknar grind. Nittonde resumen: femton agenter levererade, orkestreraren gjorde **fem fel, samtliga fångade av agenter och noll av Marcus**. **Fjorton instanser klassade i fyra klasser** — A: mätning med instrument som ser EN form men inte alla (`[UNIVERSAL]` 59 mot 72; trådregistret 110/14 mot 109/13) — och klassen är INTE orkestrerar-specifik, två agenter gjorde samma fel samma dag (`git log --name-status` tappade 145 av 179 kort på icke-ASCII; `grep -l 'Deno\.'` klassade på en kommentar), båda med **trovärdiga** utfall · B: referens som skickas vidare utan att ha lästs (deny-smoke-fil som aldrig funnits; *"nio grindar"* tillskrivet fel fil; påhittat SHA som gjorde en vakt fail-open; rad 623 mot 674; skill-pekare till rad 507–526 i en 196-radersfil) · C: ofullständig läsning av ett kontrakt (DoD-blocket olästs vid stängning — fångat av `TASK-90`:s grind, som fällde sin egen orkestrerare) · D: slutsats ur för få observationer. **DET STRUKTURELLA SKÄLET:** grindarna kör på COMMITS, men orkestrerarens fel sitter i UPPDRAGSTEXTEN, som aldrig committas — en grind måste sitta i uppdrags-ögonblicket, inte landnings-ögonblicket. Närmast liggande familj är `T108`:s hooks, som bär ett känt distributionshinder. **⚠️ EMPIRINS SYSTEMATISKA LUCKA:** vi mäter FÅNGADE fel, inte BEGÅNGNA — nämnaren är okänd, n≈14 från EN orkestrerare i EN session, och en mekanism designad mot okänd nämnare riskerar optimera fel sak. **Klass B ser nästan trivialt mekaniserbar ut** (pre-flight som validerar fil-/rad-/SHA-referenser mot disk före spawn); A kräver korsvalidering; C och D är sannolikt kontrakts-design, ej mekanism. **Marcus: *"bra uppgift för agenter i nästa resume"*.** **Andra uppdragsrevisionen (2026-08-02, OLANDAD PR #573):** 30 uppdrag, 188 påståenden, 11 hårda fel (6,25 %), 56,9 % källmärkta — n=2, men BÅDA körningarna pre-Sonnet (T113 väntar fortfarande på sin första Sonnet-datapunkt); ingen effektslutsats. **Fyra nya instanser, tjugoandra resumen:** rad-referens till fel fil (i), en hypotes självfalsifierad genom mätning (ii), T112-angränsande dead-park (iii, bokförd i T112), och en tvåstegs källkedja (iv) där en orkestrerarkorrigering själv bar en felaktig premiss ("kortet är Done" — verifierat `○ To Do`), fångad av mottagarens premiss-pass. **Ny instans 2026-08-03 (S96, andra resumen) — klassens första på ett SKILL-kontrakt:** `session-resume` steg 6 (tillstånds-återställningen) utfördes aldrig; sessionen stod `lifecycle: paused` medan tre PR:er landade i den, och tre LÄS-steg hoppades över. Formen var känd och uttalad i orkestrerarens egen transparens-rapport — ändå ej utförd. **Utvidgar klass C:** kortets strukturella tes bygger på att kontraktet aldrig committas (uppdragstext, DoD-block), men `session-resume`s SKILL.md är distribuerad, versionerad och läsbar hela tiden — otillgänglighet var alltså inte orsaken, vilket gör en do-confirm-grind billigare att tänka sig än § Vad en utredning bör avgöra punkt 5 antagit (registrerad observation, ingen grind föreslagen). Två egna fel i samma observation bokförda: en falsk klass-hopkoppling till `T116` och en felaktig framställning av `check-lifecycle.sh`s syfte (grinden prövar konsistens, inte sanning — avsiktligt per detta registers egen text), båda fällda av Marcus. Plus en klass A-instans samma pass (`mergeStateStatus: UNKNOWN` läst som verkligt tillstånd på en redan `MERGED` PR). Besläktad: `T108` · `ADR-083` · `TASK-90` · `L328` · `T116`

**Ingång (fullständig, ursprunglig):**
[T110-orkestrerarens-felklasser.md](T110-orkestrerarens-felklasser.md)
