# First principles-dekonstruktion: prototyp→skarp-processen

**Datum:** 2026-08-08 · **Session:** S93 (sjunde resumen) · **Metod:**
`/first-principles`-skillens fem faser, körd av Marcus på ramfrågan — inte på
enskilda rotorsaker. **Status: ANALYS, inte beslut** — prövas i grillningarna
(G-klustren i `processaudit-syntes-och-grillningsunderlag-2026-08-08.md`) och
korsprovas mot research-passen RP1–RP3 (branschprecedent).

**Ramfrågan:** Varför bygger vi samma yta två gånger — vad är "det skarpa
bygget" om skarpa måste vara identisk med prototypen? Sekundärt: måste allt
arbete gå genom kort→agent-apparaten?

**Triage-utfallet:** äkta antagande-problem. Processen är ärvd
(Pocock-skills + klassisk prototyp-doktrin) utan att grundformen prövats;
frustrationen har motstått upprepade fixar; alla nio rotorsaker i `ADR-102`
svarar på frågan "hur bär apparaten facit bättre?" — ingen prövar varför två
artefakter finns.

---

## Fas 1 — Antagande-obduktionen

| # | Antagande | Källa |
|---|---|---|
| A1 | Prototypen är kastbar; "skarpa bygget" är den riktiga | Konvention ("plan to throw one away"); `/prototype`-skillens throwaway-kontrakt |
| A2 | Prototyp och produktion är två artefakter som måste synkas | Följer av A1 — hela facit-apparaten förvaltar synken |
| A3 | Allt kodarbete går genom kort→agent-pipelinen | Tidigare framgång (logik/CI) + Pocock-skillsen + identitet |
| A4 | Spec:en är text; bilder är bilagor | Verktygskonvention + Pococks metod, född för typ-nivå-arbete, inte pixlar |
| A5 | Marcus granskning är ett steg i slutet (DoD-bock) | Pipeline-formen bygg→verifiera→granska, som passar logik |
| A6 | Iterationstakt = agent-varv | Följer av A3 |
| A7 | Kvalitet säkras genom fler grindar | Tidigare framgång; applicerad på UI förökar sig grindarna men grundproblemet består |
| A8 | Prototypen bor i produktionskoden som variant-grenar | `ADR-074`, medvetet val — men nedströms-konsekvensen (rivning = kirurgi) ärvdes oprövad |

Mönster: A2, A6 och A8:s konsekvenser är härledda, inte beslutade. Ingen
fattade beslutet "bygg samma yta två gånger" — det uppstod ur A1+A3.

## Fas 2 — Irreducibla sanningar

1. **T1** — Marcus öga är enda auktoriteten på hur ytan ska se ut. Mekanik
   fäller ATT två ytor skiljer sig; bara ögat avgör VILKEN som är rätt.
   (20+ iterationsvågor; R7–R9-rapportens O1–O4-slutsats.)
2. **T2** — Vid någon tidpunkt uppstår en rendering Marcus godkänner — den
   körande koden är ytans enda fullständiga specifikation. Skärmbilder,
   prosa-AC och manifest är förlustprojektioner av den.
3. **T3** — Varje översättning mellan representationer kan tappa
   information; förlusten upptäcks först av T1, sent och dyrt. Kedjan
   prototyp→bilder→PRD→AC→agent→kod läckte i varje hopp (sex spec-fel,
   "bilderna finns inte i repot", F43, F56).
4. **T4** — Kod som redan renderar rätt behöver inte byggas igen. Mätt:
   "skarpa bygget" gav netto −134 rader — en översättning-och-städning som
   låtsades vara ett bygge.
5. **T5** — UI-iterationens naturliga takt är sekunder–minuter (ändra→se),
   inte timmar. 150 min/skiva mot en öga-bedömning på tre sekunder.
6. **T6** — Produktionskod har krav prototypkod saknar: tillgänglighet 11,
   testbarhet, datakoppling, städning. Den äkta kärnan i A1 — det enda som
   överlever.
7. **T7** — Två parallella representationer av samma sanning divergerar om
   ingen struktur tvingar dem samman. Gäller kod-varianter (R7),
   facit-bilder (R4), dok-kopior (K1). Divergens är default, inte
   misslyckande.

## Fas 3 — Återbygge från noll (tre genuint distinkta vägar)

**Väg 1 — Promovering: en enda artefakt.** Iterera direkt på riktiga ytan
(bakom flagga/variant) i T5-tempo tills T1 godkänner; härda sedan SAMMA kod
på plats per T6 (mekaniserad promoverings-checklista); riv flaggan. "Riva
prototypen" upphör som begrepp — det som rivs är flaggan. Facit-apparaten
krymper till regressionslås (godkänd-SHA + snapshot). Noll översättningshopp.

**Väg 2 — Levande spec-yta.** Ytan lever som explicita tillstånd
(Storybook-klassens modell); godkända tillstånd ÄR spec:en; appen konsumerar
samma komponenter — identiteten är strukturell, R8 löses genom delning i
stället för diff. Extra relevant för dubbla outputen (Mm Component Library).

**Väg 3 — Behåll två artefakter, mekanisera översättningen fullt ut.**
Utföraren får prototyp-koden + en diff-grind röd tills renderingarna är
identiska; AC = "grinden grön + Marcus godkänt". Nuvarande trajektoria
(`ADR-102` B5 + R8) dragen till sin ändpunkt.

Värdering: väg 3 är A7 ("fler grindar") applicerad på en översättning som T4
säger aldrig behövde finnas. Väg 1 och 2 eliminerar översättningen. Väg 1 är
den enda som stämmer med samtliga sju sanningar samtidigt.

## Fas 4 — Kartan: antagande mot sanning

| Utgångspunkt | Sanningarna säger | Var det ledde fel |
|---|---|---|
| A1 riv-och-bygg | T2+T4: godkänd kod är enda kompletta spec:en; bygget byggde aldrig | Planen var att riva den enda fullständiga spec:en och återskapa den ur förlustprojektioner |
| A2 två artefakter | T7: två representationer divergerar per default | Facit-apparaten vaktar en divergens som existerar för att vi valde två artefakter |
| A3+A6 allt genom apparaten | T5: UI-iteration lever i sekundtakt | 150 min/skiva; 72 min spill; "vi kodar ju inte ett nytt Google" |
| A4 spec är text | T2+T3: prosa är förlustprojektion av pixlar | Sex spec-fel i rad; F56 |
| A5 granskning i slutet | T1: ögat ÄR loopen | Design-review-posten okryssad/felkryssad — ögat kom för sent för att styra |
| A7 fler grindar | T3: grindarna vaktar översättningen; översättningen är defekten | `facit.json`/`check-facit.sh` täcker 1 katalog av 22 |

## Fas 5 — Draget

> **Draget:** Avskaffa "det skarpa bygget" som begrepp — den godkända
> prototypen PROMOVERAS till produktion genom en mekaniserad
> härdnings-checklista i samma kod, och byggs aldrig om.
>
> **Grund:** T2 (godkänd rendering = enda kompletta spec:en) + T4
> (återbygget byggde aldrig något) + T3 (varje hopp läcker, varje hopp är
> mätt läckande). Promovering sätter hoppen till noll: identitet blir en
> STRUKTUR som inte kan brytas i stället för ett MÅL som ska verifieras.
>
> **Vad som dör:** A1+A2 — och med dem större delen av R1–R6:s problemrymd
> (symptom på översättningskedjan), B4:s jämför-och-riv-ritual (blir
> godkänn-och-promovera) och facit-bildernas roll som spec (blir
> regressionslås). T6 överlever som explicit promoverings-steg — apparaten
> behåller härdning, datakoppling, tester. Marcus eget ord bar fröet:
> *"Prototypen och skarpa version ska vara IDENTISKA — det är ju hela
> poängen."* Om de måste vara identiska är en av dem överflödig.
>
> **Första konkreta steget:** Vänd spår B:s riktning innan `A1`–`A6`
> skivas: inte "gör skarpa lik prototypen" (rekonstruktion) utan "promovera
> prototyp-grenens form till ovillkorlig, behåll skarpas datavägar, riv
> flaggan" (mekanisk flytt + härdning). Samma slutpunkt, strukturellt
> oförmögen att divergera, radikalt billigare.

## Förbehåll — vad som INTE avgörs här

- Detta är analys; besluten fattas i grillningarna av Marcus.
- R7:s detaljer (protoAktiv-defaulten `false`, `protoDataMode` som
  datakälla — inte form, fem `?variant`-läsare) är exakt vad
  promoverings-checklistan måste hantera; de försvinner inte av att ramen
  byts.
- `ADR-074`:s live-jämförelsevärde UNDER konvergensen överlever draget —
  två former sida vid sida är rätt medan iterationen pågår; två-artefakt-
  modellen dör efter godkännandet.
- Branschprövningen är RP1:s delfråga (d): promoverar frontier-teamen,
  eller bygger någon faktiskt två gånger? Svaret vägs in innan grillning.
- Väg 2 (levande spec-yta) förkastas inte av draget — den är en möjlig
  biblioteks-nivå-evolution (Mm Component Library) och prövas mot RP2:s
  fynd om story-per-tillstånd som spec-bärare.
